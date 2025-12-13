import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Settings, PieChart as PieIcon, BarChart3, Save, FolderOpen, Upload, DollarSign, Calendar, Info, Zap, Target, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const PortfolioAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [availableStocks, setAvailableStocks] = useState([]); // Список імен файлів
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [weights, setWeights] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Параметри інвестування
  const [investmentType, setInvestmentType] = useState('lumpsum');
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [yearlyContribution, setYearlyContribution] = useState(6000);
  const [rebalanceFrequency, setRebalanceFrequency] = useState('yearly');
  
  // Параметри симуляції
  const [forecastYears, setForecastYears] = useState(10);
  const [simulations, setSimulations] = useState(1000);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [expenseRatio, setExpenseRatio] = useState(0.1);
  const [taxRate, setTaxRate] = useState(15);
  const [dateRange, setDateRange] = useState({ start: '2013-02-08', end: '2018-02-07' });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [savedPortfolios, setSavedPortfolios] = useState([]);

  // Завантаження списку акцій при старті
  useEffect(() => {
    fetch(`${API_URL}/stocks`)
      .then(res => res.json())
      .then(data => setAvailableStocks(data))
      .catch(err => console.error("Error loading stocks:", err));
      
    loadSavedPortfolios();
  }, []);

  const loadSavedPortfolios = async () => {
    try {
        const res = await fetch(`${API_URL}/portfolio`);
        const data = await res.json();
        setSavedPortfolios(data);
    } catch(e) { console.error(e); }
  };

  const handleStockToggle = (stock) => {
    if (selectedStocks.includes(stock)) {
      setSelectedStocks(selectedStocks.filter(s => s !== stock));
      const newWeights = { ...weights };
      delete newWeights[stock];
      setWeights(newWeights);
    } else {
      setSelectedStocks([...selectedStocks, stock]);
      const equalWeight = 1 / (selectedStocks.length + 1);
      const newWeights = {};
      [...selectedStocks, stock].forEach(s => newWeights[s] = equalWeight);
      setWeights(newWeights);
    }
  };

  const handleWeightChange = (stock, value) => {
    setWeights({ ...weights, [stock]: parseFloat(value) || 0 });
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const normalized = {};
      Object.keys(weights).forEach(stock => normalized[stock] = weights[stock] / total);
      setWeights(normalized);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload = {
        stocks: selectedStocks,
        weights,
        initialInvestment,
        investmentType,
        monthlyContribution,
        yearlyContribution,
        forecastYears,
        simulations,
        inflationRate,
        expenseRatio,
        rebalanceFrequency,
        dateRange,
        taxRate,
        confidenceLevel
      };

      const res = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setResults(data);
      setActiveTab('analysis');
    } catch (e) {
      alert("Помилка симуляції: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const savePortfolio = async () => {
    const p = { 
        name: `Портфель ${new Date().toLocaleDateString('uk-UA')}`, 
        stocks: selectedStocks, 
        weights,
        settings: { initialInvestment, forecastYears, investmentType }
    };
    await fetch(`${API_URL}/portfolio`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(p)
    });
    loadSavedPortfolios();
    alert("Збережено!");
  };

  const loadPortfolio = (p) => {
      setSelectedStocks(p.stocks);
      setWeights(p.weights);
      setInitialInvestment(p.settings.initialInvestment);
      setForecastYears(p.settings.forecastYears);
      setActiveTab('portfolio');
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = Math.abs(totalWeight - 1) < 0.01;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Професійний Аналізатор Інвестицій
          </h1>
          <p className="text-gray-300 text-lg">S&P 500 • Симуляція Монте-Карло • Глибока Аналітика</p>
        </header>

        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {[
            { id: 'portfolio', label: 'Портфоліо', icon: PieIcon },
            { id: 'settings', label: 'Налаштування', icon: Settings },
            { id: 'analysis', label: 'Аналіз', icon: BarChart3 },
            { id: 'saved', label: 'Збережені', icon: FolderOpen }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Вкладка: ПОРТФОЛІО */}
        {activeTab === 'portfolio' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
             <h2 className="text-2xl font-semibold mb-4">Виберіть акції</h2>
             <input type="text" placeholder="🔍 Пошук тікера..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 mb-4 text-white" />
             
             <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6 max-h-60 overflow-y-auto">
                {availableStocks.length === 0 && <div className="col-span-4 text-center text-gray-400">Завантаження акцій... (перевірте бекенд)</div>}
                {availableStocks.filter(s => s.includes(searchTerm.toUpperCase())).map(stock => (
                    <button key={stock} onClick={() => handleStockToggle(stock)}
                      className={`p-2 rounded border transition-all text-xs font-bold ${
                        selectedStocks.includes(stock) ? 'bg-purple-600 border-purple-400' : 'bg-white/5 border-white/20'
                      }`}>
                      {stock}
                    </button>
                ))}
             </div>

             {selectedStocks.length > 0 && (
                <div className="mt-6">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl">Розподіл ({(totalWeight*100).toFixed(1)}%)</h3>
                      <div className="flex gap-2">
                        <button onClick={normalizeWeights} className="px-4 py-2 bg-blue-600 rounded text-sm">Нормалізувати</button>
                        {!isWeightValid && <span className="text-red-400 flex items-center gap-1"><AlertCircle size={16}/> ≠ 100%</span>}
                      </div>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedStocks.map((stock, idx) => (
                          <div key={stock} className="bg-white/5 p-4 rounded border border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}/>
                                  <span className="font-bold">{stock}</span>
                              </div>
                              <input type="number" min="0" max="1" step="0.01" value={weights[stock]||0} 
                                  onChange={e => handleWeightChange(stock, e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white mb-1"/>
                              <div className="text-center font-bold text-purple-400 mt-1">{((weights[stock]||0)*100).toFixed(1)}%</div>
                          </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}

        {/* Вкладка: НАЛАШТУВАННЯ */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><DollarSign/> Стратегія</h2>
                <div className="space-y-4">
                   <div>
                      <label className="block mb-2 text-gray-300">Тип інвестування</label>
                      <select value={investmentType} onChange={e => setInvestmentType(e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white">
                         <option value="lumpsum">Одноразова</option>
                         <option value="monthly">Щомісячна</option>
                         <option value="yearly">Щорічна</option>
                      </select>
                   </div>
                   <div>
                      <label className="block mb-2 text-gray-300">Початкова сума ($)</label>
                      <input type="number" value={initialInvestment} onChange={e => setInitialInvestment(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/>
                   </div>
                   {investmentType === 'monthly' && (
                       <div><label className="block mb-2 text-gray-300">Щомісячний внесок ($)</label>
                       <input type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                   )}
                   {investmentType === 'yearly' && (
                       <div><label className="block mb-2 text-gray-300">Щорічний внесок ($)</label>
                       <input type="number" value={yearlyContribution} onChange={e => setYearlyContribution(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                   )}
                   <div>
                      <label className="block mb-2 text-gray-300">Ребалансування</label>
                      <select value={rebalanceFrequency} onChange={e => setRebalanceFrequency(e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white">
                         <option value="never">Ніколи</option>
                         <option value="monthly">Щомісяця</option>
                         <option value="quarterly">Щокварталу</option>
                         <option value="yearly">Щороку</option>
                      </select>
                   </div>
                   <div>
                      <label className="block mb-2 text-gray-300">Період (Дати)</label>
                      <div className="flex gap-2">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full bg-white/5 p-2 rounded border border-white/20 text-white"/>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full bg-white/5 p-2 rounded border border-white/20 text-white"/>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Settings/> Симуляція</h2>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block mb-2 text-gray-300">Років</label>
                      <input type="number" value={forecastYears} onChange={e => setForecastYears(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                      <div><label className="block mb-2 text-gray-300">Симуляцій</label>
                      <input type="number" value={simulations} onChange={e => setSimulations(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block mb-2 text-gray-300">Інфляція %</label>
                      <input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                      <div><label className="block mb-2 text-gray-300">Комісія %</label>
                      <input type="number" step="0.1" value={expenseRatio} onChange={e => setExpenseRatio(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                   </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block mb-2 text-gray-300">Податок %</label>
                      <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                      <div><label className="block mb-2 text-gray-300">Довіра %</label>
                      <input type="number" step="0.1" value={confidenceLevel} onChange={e => setConfidenceLevel(+e.target.value)} className="w-full bg-white/5 p-3 rounded border border-white/20 text-white"/></div>
                   </div>

                   <button onClick={runSimulation} disabled={loading || !isWeightValid || selectedStocks.length === 0} 
                     className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded font-bold hover:scale-105 transition-transform flex justify-center gap-2 disabled:opacity-50">
                     {loading ? "Симуляція..." : <><Zap/> Запустити</>}
                   </button>
                   {selectedStocks.length > 0 && <button onClick={savePortfolio} className="w-full bg-white/10 py-3 rounded flex justify-center gap-2"><Save/> Зберегти</button>}
                </div>
             </div>
          </div>
        )}

        {/* Вкладка: АНАЛІЗ */}
        {activeTab === 'analysis' && results && (
           <div className="space-y-6">
              {/* Метрики */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                    { l: 'Очікуваний результат', v: `$${results.simulationStats.median.toLocaleString('uk-UA', {maximumFractionDigits:0})}`, c: 'text-green-400' },
                    { l: 'Річна дохідність', v: `${(results.historicalMetrics.annualReturn*100).toFixed(2)}%`, c: 'text-blue-400' },
                    { l: 'Волатильність', v: `${(results.historicalMetrics.annualVolatility*100).toFixed(2)}%`, c: 'text-orange-400' },
                    { l: 'Sharpe Ratio', v: results.historicalMetrics.sharpeRatio.toFixed(2), c: 'text-purple-400' }
                 ].map((m, i) => (
                    <div key={i} className="bg-white/10 p-6 rounded-xl border border-white/20 text-center">
                       <div className="text-gray-400 text-sm">{m.l}</div>
                       <div className={`text-2xl font-bold ${m.c}`}>{m.v}</div>
                    </div>
                 ))}
              </div>

              {/* Графік */}
              <div className="bg-white/10 p-6 rounded-xl border border-white/20">
                 <h3 className="text-xl font-bold mb-4">Прогноз вартості</h3>
                 <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={results.avgPath}>
                       <defs>
                          <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.5}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20"/>
                       <XAxis dataKey="year" stroke="#fff"/>
                       <YAxis stroke="#fff" tickFormatter={val => `$${val/1000}k`}/>
                       <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} formatter={val => `$${val.toLocaleString()}`}/>
                       <Legend/>
                       <Area type="monotone" dataKey="median" stroke="#22c55e" fill="url(#colorMed)" name="Медіана" strokeWidth={3}/>
                       <Area type="monotone" dataKey="p90" stroke="#a855f7" fill="transparent" name="Оптимістичний (90%)" strokeDasharray="5 5"/>
                       <Area type="monotone" dataKey="p10" stroke="#ef4444" fill="transparent" name="Песимістичний (10%)" strokeDasharray="5 5"/>
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              
              {/* Кругова діаграма та Ризики */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/10 p-6 rounded-xl border border-white/20">
                      <h3 className="font-bold mb-4">Розподіл активів</h3>
                      <ResponsiveContainer height={300}>
                          <PieChart>
                              <Pie data={selectedStocks.map(s => ({name: s, value: weights[s]}))} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({name}) => name}>
                                  {selectedStocks.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                              </Pie>
                              <Tooltip/>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="bg-white/10 p-6 rounded-xl border border-white/20 space-y-4">
                      <h3 className="font-bold mb-4">Ризики та Шанси</h3>
                      <div>
                          <div className="flex justify-between text-sm"><span>Макс. просадка</span><span className="text-red-400">-{(results.historicalMetrics.maxDrawdown*100).toFixed(1)}%</span></div>
                          <div className="w-full bg-gray-700 h-2 rounded"><div className="bg-red-500 h-2 rounded" style={{width: `${results.historicalMetrics.maxDrawdown*100}%`}}/></div>
                      </div>
                      <div>
                          <div className="flex justify-between text-sm"><span>Шанс подвоєння</span><span className="text-green-400">{(results.simulationStats.successRate*100).toFixed(1)}%</span></div>
                          <div className="w-full bg-gray-700 h-2 rounded"><div className="bg-green-500 h-2 rounded" style={{width: `${results.simulationStats.successRate*100}%`}}/></div>
                      </div>
                      <div className="p-4 bg-blue-900/30 rounded border border-blue-500/30 mt-4 text-sm">
                          <Info size={16} className="inline mr-2"/>
                          Value at Risk (VaR 95%): Ви можете втратити <span className="text-red-400 font-bold">{(results.historicalMetrics.var95*100).toFixed(1)}%</span> у найгірші 5% днів.
                      </div>
                  </div>
              </div>
           </div>
        )}

        {/* Вкладка: ЗБЕРЕЖЕНІ */}
        {activeTab === 'saved' && (
           <div className="bg-white/10 p-6 rounded-xl border border-white/20">
              <h2 className="text-2xl font-bold mb-4">Архів портфелів</h2>
              <div className="grid gap-4 md:grid-cols-2">
                 {savedPortfolios.length === 0 && <p className="text-gray-400">Немає збережених портфелів.</p>}
                 {savedPortfolios.map((p, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded border border-white/10 hover:border-purple-500 cursor-pointer" onClick={() => loadPortfolio(p)}>
                        <div className="font-bold text-lg">{p.name}</div>
                        <div className="text-sm text-gray-400">{p.stocks.join(', ')}</div>
                        <div className="text-green-400 font-mono mt-2">${p.settings.initialInvestment.toLocaleString()}</div>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default PortfolioAnalyzer;