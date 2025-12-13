const fs = require('fs');
const path = require('path');

let stockDataCache = null;

const loadStockData = () => {
    if (stockDataCache) return stockDataCache;
    try {
        const filePath = path.join(__dirname, 'data', 'all_stocks_5yr.csv');
        const text = fs.readFileSync(filePath, 'utf8');
        const lines = text.split('\n').filter(line => line.trim());
        const stockMap = {};
        const dateSet = new Set();
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length < 7) continue;
            const date = values[0];
            const name = values[6];
            const close = parseFloat(values[4]);
            if (!date || !name || isNaN(close)) continue;
            dateSet.add(date);
            if (!stockMap[date]) stockMap[date] = { Date: date };
            stockMap[date][name] = { close };
        }
        stockDataCache = Array.from(dateSet).sort().map(date => stockMap[date]).filter(row => row && Object.keys(row).length > 1);
        return stockDataCache;
    } catch (e) {
        console.error("CSV Load Error:", e);
        return [];
    }
};

const calculatePortfolioMetrics = (data, stocks, weights, initialInvestment) => {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
        let portfolioReturn = 0;
        let valid = true;
        stocks.forEach(stock => {
            const prev = data[i - 1][stock]?.close;
            const curr = data[i][stock]?.close;
            if (!prev || !curr || prev === 0) { valid = false; return; }
            portfolioReturn += weights[stock] * ((curr - prev) / prev);
        });
        if (valid) returns.push(portfolioReturn);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const tradingDays = 252;
    const annualReturn = mean * tradingDays;
    const annualVolatility = stdDev * Math.sqrt(tradingDays);
    const sharpeRatio = annualVolatility === 0 ? 0 : annualReturn / annualVolatility;
    let peak = initialInvestment;
    let maxDrawdown = 0;
    let currentValue = initialInvestment;
    returns.forEach(ret => {
        currentValue *= (1 + ret);
        if (currentValue > peak) peak = currentValue;
        const drawdown = (peak - currentValue) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95 = sortedReturns[Math.floor(returns.length * 0.05)] || 0;
    return { annualReturn, annualVolatility, sharpeRatio, maxDrawdown, var95: var95 * Math.sqrt(tradingDays) };
};

const runSimulation = (params) => {
    const { stocks, weights, initialInvestment, forecastYears, simulations, investmentType, monthlyContribution, yearlyContribution, inflationRate, expenseRatio, dateRange } = params;
    let stockData = loadStockData();
    if (dateRange && dateRange.start && dateRange.end) {
        stockData = stockData.filter(row => row.Date >= dateRange.start && row.Date <= dateRange.end);
    }
    const historicalMetrics = calculatePortfolioMetrics(stockData, stocks, weights, initialInvestment);
    const simulationPaths = [];
    const finalValues = [];
    for (let sim = 0; sim < simulations; sim++) {
        let portfolioValue = initialInvestment;
        let totalContributions = initialInvestment;
        const path = [{ year: 0, value: portfolioValue }];
        for (let year = 1; year <= forecastYears; year++) {
            let random = 0; for(let i=0; i<12; i++) random += Math.random(); random -= 6;
            const yearReturn = historicalMetrics.annualReturn + historicalMetrics.annualVolatility * random;
            const realReturn = yearReturn - (inflationRate / 100) - (expenseRatio / 100);
            portfolioValue *= (1 + realReturn);
            if (investmentType === 'monthly') {
                portfolioValue += (monthlyContribution * 12) * (1 + realReturn / 2);
                totalContributions += monthlyContribution * 12;
            } else if (investmentType === 'yearly') {
                portfolioValue += yearlyContribution * (1 + realReturn / 2);
                totalContributions += yearlyContribution;
            }
            path.push({ year, value: portfolioValue });
        }
        simulationPaths.push(path);
        finalValues.push(portfolioValue);
    }
    finalValues.sort((a, b) => a - b);
    const percentile = (arr, p) => arr[Math.floor(arr.length * p)] || 0;
    const avgPath = [];
    for (let year = 0; year <= forecastYears; year++) {
        const values = simulationPaths.map(sim => sim[year].value);
        values.sort((a, b) => a - b);
        avgPath.push({
            year,
            median: percentile(values, 0.5),
            p10: percentile(values, 0.1),
            p90: percentile(values, 0.9)
        });
    }
    return {
        avgPath,
        historicalMetrics,
        simulationStats: {
            median: percentile(finalValues, 0.5),
            successRate: finalValues.filter(v => v >= initialInvestment * 2).length / simulations
        }
    };
};

module.exports = { loadStockData, runSimulation };