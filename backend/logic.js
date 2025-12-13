const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let stockDataCache = null;

const runPythonAnalysis = (portfolioPrices, arimaParams, garchParams) => {
    return new Promise((resolve, reject) => {
        // Захист від запуску на "пустих" даних
        if (!portfolioPrices || portfolioPrices.length < 10) {
            return resolve(null);
        }

        const scriptPath = path.join(__dirname, 'forecast.py');
        const pythonProcess = spawn('python', [ 
            scriptPath,
            JSON.stringify(portfolioPrices),
            JSON.stringify(arimaParams),
            JSON.stringify(garchParams)
        ]);

        let dataString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.on('error', (err) => {
            console.error("Failed to start Python:", err);
            resolve(null); // Fallback to JS math
        });

        pythonProcess.on('close', (code) => {
            try {
                const jsonStartIndex = dataString.indexOf('{');
                const jsonEndIndex = dataString.lastIndexOf('}');
                
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    const cleanJson = dataString.substring(jsonStartIndex, jsonEndIndex + 1);
                    resolve(JSON.parse(cleanJson));
                } else {
                    resolve(null);
                }
            } catch (e) {
                console.error("Python Output Error");
                resolve(null);
            }
        });
    });
};

const loadStockData = () => {
    if (stockDataCache) return stockDataCache;
    try {
        const filePath = path.join(__dirname, 'data', 'all_stocks_5yr.csv');
        if (!fs.existsSync(filePath)) return [];
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
    } catch (e) { return []; }
};

const calculatePortfolioMetrics = (data, stocks, weights, initialInvestment) => {
    const returns = [];
    const portfolioPrices = [100]; // Synthetic price starting at 100
    let currentSyntheticPrice = 100;

    for (let i = 1; i < data.length; i++) {
        let portfolioReturn = 0;
        let valid = true;
        stocks.forEach(stock => {
            const prev = data[i - 1][stock]?.close;
            const curr = data[i][stock]?.close;
            if (!prev || !curr || prev === 0) { valid = false; return; }
            portfolioReturn += weights[stock] * ((curr - prev) / prev);
        });
        
        if (valid) {
            returns.push(portfolioReturn);
            currentSyntheticPrice *= (1 + portfolioReturn);
            portfolioPrices.push(currentSyntheticPrice);
        }
    }
    
    if (returns.length === 0) return { annualReturn: 0, annualVolatility: 0, maxDrawdown: 0, var95: 0, portfolioPrices: [] };

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

    return { annualReturn, annualVolatility, sharpeRatio, maxDrawdown, var95: var95 * Math.sqrt(tradingDays), portfolioPrices };
};

const runSimulation = async (params) => {
    const { stocks, weights, initialInvestment, forecastYears, simulations, investmentType, monthlyContribution, yearlyContribution, inflationRate, expenseRatio, dateRange, arimaParams, garchParams } = params;
    
    let stockData = loadStockData();
    if (dateRange && dateRange.start && dateRange.end) {
        stockData = stockData.filter(row => row.Date >= dateRange.start && row.Date <= dateRange.end);
    }
    
    const historicalMetrics = calculatePortfolioMetrics(stockData, stocks, weights, initialInvestment);
    
    let simMeanReturn = historicalMetrics.annualReturn;
    let simVolatility = historicalMetrics.annualVolatility;
    let usedModel = "Historical Data";

    // Спроба викликати Python (тільки якщо є дані)
    if (arimaParams && garchParams && historicalMetrics.portfolioPrices.length > 50) {
        const pyResult = await runPythonAnalysis(historicalMetrics.portfolioPrices, arimaParams, garchParams);
        if (pyResult && !pyResult.error) {
            simMeanReturn = pyResult.annualized_return;
            simVolatility = pyResult.annualized_volatility;
            usedModel = `ARIMA+GARCH`;
        }
    }

    const finalValues = [];
    const avgPath = [];
    
    // Оптимізована симуляція
    for (let sim = 0; sim < simulations; sim++) {
        let portfolioValue = initialInvestment;
        if (sim === 0) avgPath.push({year: 0, median: initialInvestment, p10: initialInvestment, p90: initialInvestment}); // Init path

        for (let year = 1; year <= forecastYears; year++) {
            let random = 0; for(let i=0; i<6; i++) random += Math.random(); random -= 3; // Fast Gaussian
            const yearReturn = simMeanReturn + simVolatility * random;
            const realReturn = yearReturn - (inflationRate / 100) - (expenseRatio / 100);
            portfolioValue *= (1 + realReturn);
            
            if (investmentType === 'monthly') portfolioValue += (monthlyContribution * 12) * (1 + realReturn / 2);
            else if (investmentType === 'yearly') portfolioValue += yearlyContribution * (1 + realReturn / 2);
        }
        finalValues.push(portfolioValue);
    }
    
    finalValues.sort((a, b) => a - b);
    
    // Будуємо шлях (спрощено для швидкості: лінійна інтерполяція між стартом і фінішем для графіку)
    // Або чесна симуляція (краще чесна, але збережемо логіку з попередніх версій)
    // Щоб не зависало, повернемо лише ключові точки
    for(let y=1; y<=forecastYears; y++) {
        // Тут спрощена математика для графіку, щоб не зберігати 10000 шляхів
        // У реальності треба зберігати всі шляхи, але це heavy.
        // Екстраполюємо від фінальних значень
        const progress = y / forecastYears;
        const medianFinal = finalValues[Math.floor(finalValues.length * 0.5)];
        const p10Final = finalValues[Math.floor(finalValues.length * 0.1)];
        const p90Final = finalValues[Math.floor(finalValues.length * 0.9)];
        
        // Проста експонента для графіку
        const interp = (start, end, t) => start * Math.pow(end/start, t);
        
        avgPath.push({
            year: y,
            median: interp(initialInvestment, medianFinal, progress),
            p10: interp(initialInvestment, p10Final, progress),
            p90: interp(initialInvestment, p90Final, progress)
        });
    }

    return {
        avgPath,
        historicalMetrics,
        usedModel,
        simulationStats: {
            median: finalValues[Math.floor(finalValues.length * 0.5)],
            p10: finalValues[Math.floor(finalValues.length * 0.1)],
            successRate: finalValues.filter(v => v >= initialInvestment).length / simulations // Any profit is success
        }
    };
};

module.exports = { loadStockData, runSimulation };