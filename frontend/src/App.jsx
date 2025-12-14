import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Settings, PieChart as PieIcon, BarChart3, Save, FolderOpen, DollarSign, Info, Zap, AlertCircle, BrainCircuit, ArrowRight, Trash2, X, RotateCcw, FileText, LineChart as LineChartIcon } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

const CleanInput = ({ value, onChange, min, max, step, className, ...props }) => {
  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '') { onChange(''); } else { onChange(parseFloat(val)); }
  };
  return (
    <input type="number" value={value} onChange={handleChange} min={min} max={max} step={step}
      className={`bg-black/20 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors ${className}`} {...props} />
  );
};

const InfoTooltip = ({ title, text, standard }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-2 z-50">
      <Info size={14} className="text-blue-400 cursor-help hover:text-blue-300 transition-colors inline"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-slate-900 border border-slate-600 rounded-lg shadow-xl text-xs text-gray-200 leading-relaxed pointer-events-none">
          <div className="font-bold text-white mb-1 border-b border-slate-600 pb-1">{title}</div>
          <div className="text-gray-300 mb-1">{text}</div>
          {standard && <div className="text-green-400 font-mono bg-green-900/20 p-1 rounded text-center">Standard: {standard}</div>}
        </div>
      )}
    </div>
  );
};

const PortfolioAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [availableStocks, setAvailableStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [weights, setWeights] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inputs
  const [investmentType, setInvestmentType] = useState('lumpsum');
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [yearlyContribution, setYearlyContribution] = useState(6000);
  const [rebalanceFrequency, setRebalanceFrequency] = useState('yearly');
  const [forecastYears, setForecastYears] = useState(10);
  const [simulations, setSimulations] = useState(1000);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [expenseRatio, setExpenseRatio] = useState(0.1);
  const [taxRate, setTaxRate] = useState(15);
  const [dateRange, setDateRange] = useState({ start: '2013-02-08', end: '2018-02-07' });

  // AI Models
  const [arimaP, setArimaP] = useState(1);
  const [arimaD, setArimaD] = useState(0);
  const [arimaQ, setArimaQ] = useState(1);
  const [garchP, setGarchP] = useState(1);
  const [garchQ, setGarchQ] = useState(1);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [savedPortfolios, setSavedPortfolios] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/stocks`).then(res => res.json()).then(setAvailableStocks).catch(console.error);
    loadSavedPortfolios();
  }, []);

  const loadSavedPortfolios = () => {
    fetch(`${API_URL}/portfolio`).then(res => res.json()).then(setSavedPortfolios).catch(console.error);
  };

  const handleStockToggle = (stock) => {
    if (selectedStocks.includes(stock)) {
      setSelectedStocks(selectedStocks.filter(s => s !== stock));
      const newWeights = { ...weights }; delete newWeights[stock]; setWeights(newWeights);
    } else {
      setSelectedStocks([...selectedStocks, stock]);
      const w = 1 / (selectedStocks.length + 1);
      const newWeights = {}; [...selectedStocks, stock].forEach(s => newWeights[s] = w); setWeights(newWeights);
    }
  };

  const clearAllStocks = () => {
      if(window.confirm("Очистити весь список акцій?")) {
          setSelectedStocks([]);
          setWeights({});
      }
  };

  const normalizeWeights = () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      const normalized = {}; Object.keys(weights).forEach(s => normalized[s] = weights[s] / total); setWeights(normalized);
    }
  };

  const deletePortfolio = async (id, e) => {
      e.stopPropagation();
      if(!window.confirm("Видалити цей запис?")) return;
      try {
          await fetch(`${API_URL}/portfolio/${id}`, { method: 'DELETE' });
          loadSavedPortfolios();
      } catch (err) { console.error(err); alert("Помилка видалення"); }
  };

  const runSimulation = async () => {
    setLoading(true); setResults(null);
    try {
      const payload = {
        stocks: selectedStocks, weights, 
        initialInvestment: Number(initialInvestment) || 0, 
        investmentType, 
        monthlyContribution: Number(monthlyContribution) || 0,
        yearlyContribution: Number(yearlyContribution) || 0, 
        forecastYears: Number(forecastYears) || 1, 
        simulations: Number(simulations) || 100, 
        inflationRate: Number(inflationRate) || 0, 
        expenseRatio: Number(expenseRatio) || 0, 
        rebalanceFrequency,
        dateRange, 
        taxRate: Number(taxRate) || 0, 
        confidenceLevel: Number(confidenceLevel) || 95, 
        arimaParams: { p: Number(arimaP)||0, d: Number(arimaD)||0, q: Number(arimaQ)||0 }, 
        garchParams: { p: Number(garchP)||1, q: Number(garchQ)||1 }
      };

      const res = await fetch(`${API_URL}/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      if (!data.avgPath || data.avgPath.length === 0) throw new Error("Сервер повернув пусті дані");
      if (isNaN(data.simulationStats.median)) throw new Error("Помилка обчислень (NaN). Перевірте вхідні дані.");

      setResults(data);
      setActiveTab('analysis');
    } catch (e) { 
        console.error(e);
        alert("Помилка: " + e.message); 
    } finally { setLoading(false); }
  };

  // === 1. ЗБЕРЕЖЕННЯ КОНФІГУРАЦІЇ (ЧЕРНЕТКА) ===
  const saveConfiguration = async () => {
    const name = prompt("Назвіть цю конфігурацію:", `Налаштування ${new Date().toLocaleTimeString()}`);
    if (!name) return;

    const p = { 
        name: name,
        type: 'config', // Маркер типу
        stocks: selectedStocks, 
        weights, 
        fullSettings: {
            initialInvestment, investmentType, monthlyContribution, yearlyContribution,
            rebalanceFrequency, forecastYears, simulations, confidenceLevel,
            inflationRate, expenseRatio, taxRate, dateRange,
            arimaParams: { p: arimaP, d: arimaD, q: arimaQ },
            garchParams: { p: garchP, q: garchQ }
        }
    };
    await fetch(`${API_URL}/portfolio`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(p) });
    loadSavedPortfolios();
  };

  // === 2. ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТУ (ЗНІМОК) ===
  const saveResult = async () => {
    if (!results) return;
    const name = prompt("Назвіть цей результат аналізу:", `Аналіз ${new Date().toLocaleTimeString()}`);
    if (!name) return;

    const p = { 
        name: name,
        type: 'result', // Маркер типу
        stocks: selectedStocks, 
        weights, 
        fullSettings: {
            initialInvestment, investmentType, monthlyContribution, yearlyContribution,
            rebalanceFrequency, forecastYears, simulations, confidenceLevel,
            inflationRate, expenseRatio, taxRate, dateRange,
            arimaParams: { p: arimaP, d: arimaD, q: arimaQ },
            garchParams: { p: garchP, q: garchQ }
        },
        analysisResult: results // Зберігаємо сам результат
    };
    await fetch(`${API_URL}/portfolio`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(p) });
    loadSavedPortfolios();
    alert("Результат збережено!");
  };

  // === 3. ЗАВАНТАЖЕННЯ ===
  const loadPortfolio = (p) => {
      // 1. Відновлюємо змінні
      setSelectedStocks(p.stocks); 
      setWeights(p.weights);
      
      const s = p.fullSettings || p.settings || {}; // Fallback для старих версій
      
      if (s.initialInvestment !== undefined) setInitialInvestment(s.initialInvestment);
      if (s.investmentType) setInvestmentType(s.investmentType);
      if (s.monthlyContribution !== undefined) setMonthlyContribution(s.monthlyContribution);
      if (s.yearlyContribution !== undefined) setYearlyContribution(s.yearlyContribution);
      if (s.rebalanceFrequency) setRebalanceFrequency(s.rebalanceFrequency);
      if (s.forecastYears) setForecastYears(s.forecastYears);
      if (s.simulations) setSimulations(s.simulations);
      if (s.confidenceLevel) setConfidenceLevel(s.confidenceLevel);
      if (s.inflationRate !== undefined) setInflationRate(s.inflationRate);
      if (s.expenseRatio !== undefined) setExpenseRatio(s.expenseRatio);
      if (s.taxRate !== undefined) setTaxRate(s.taxRate);
      if (s.dateRange) setDateRange(s.dateRange);
      
      if (s.arimaParams) {
          setArimaP(s.arimaParams.p); setArimaD(s.arimaParams.d); setArimaQ(s.arimaParams.q);
      }
      if (s.garchParams) {
          setGarchP(s.garchParams.p); setGarchQ(s.garchParams.q);
      }

      // 2. Перевіряємо тип збереження
      if (p.type === 'result' && p.analysisResult) {
          // Це збережений аналіз -> Відкриваємо результат
          setResults(p.analysisResult);
          setActiveTab('analysis');
      } else {
          // Це просто налаштування -> Йдемо редагувати
          setResults(null);
          setActiveTab('settings');
      }
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 font-sans selection:bg-purple-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Investment AI Analyst</h1>
          <p className="text-gray-500 text-sm">Advanced Market Simulation Engine</p>
        </header>

        <div className="flex justify-center gap-3 mb-6">
          {[
            { id: 'portfolio', icon: PieIcon, label: 'Портфоліо' },
            { id: 'settings', icon: Settings, label: 'Налаштування' },
            { id: 'analysis', icon: BarChart3, label: 'Аналіз' },
            { id: 'saved', icon: FolderOpen, label: 'Збережені' }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-medium ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-900/20' : 'bg-white/5 hover:bg-white/10'}`}>
              <t.icon size={16}/> {t.label}
            </button>
          ))}
        </div>

        {/* ПОРТФОЛІО */}
        {activeTab === 'portfolio' && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-5 animate-in fade-in">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold flex items-center gap-2"><PieIcon className="text-purple-400"/> Вибір активів</h2>
                 <div className="flex gap-2">
                     {selectedStocks.length > 0 && (
                         <button onClick={clearAllStocks} className="text-xs flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1.5 rounded hover:bg-red-500/20 transition-colors">
                             <Trash2 size={14}/> Очистити все
                         </button>
                     )}
                 </div>
             </div>
             
             <div className="relative mb-4">
                 <input type="text" placeholder="🔍 Пошук (напр. AAPL, GOOGL)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"/>
                 {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-gray-500 hover:text-white"><X size={18}/></button>}
             </div>

             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6 max-h-60 overflow-y-auto pr-2">
                {availableStocks.filter(s => s.includes(searchTerm.toUpperCase())).map(s => (
                    <button key={s} onClick={() => handleStockToggle(s)} 
                        className={`p-2 rounded-lg border text-xs font-bold transition-all ${selectedStocks.includes(s) ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                        {s}
                    </button>
                ))}
             </div>

             {selectedStocks.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-6 animate-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-300">Ваги</h3>
                          <span className={`text-xs px-2 py-0.5 rounded font-mono ${Math.abs(totalWeight - 1) < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {(totalWeight*100).toFixed(1)}%
                          </span>
                      </div>
                      <button onClick={normalizeWeights} className="text-xs flex items-center gap-1 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-500/20">
                          <RotateCcw size={12}/> Авто-розподіл
                      </button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {selectedStocks.map((s, i) => (
                          <div key={s} className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-2 group hover:border-white/10 transition-colors">
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/>
                                      <span className="font-bold text-sm">{s}</span>
                                  </div>
                                  <button onClick={() => handleStockToggle(s)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                              </div>
                              <div className="relative">
                                  <CleanInput 
                                    step="0.05" 
                                    value={weights[s] || ''} 
                                    onChange={val => setWeights({...weights, [s]: val})} 
                                    className="w-full text-right text-sm pr-6" 
                                  />
                                  <span className="absolute right-2 top-2 text-xs text-gray-500">%</span>
                              </div>
                          </div>
                      ))}
                   </div>
                   <button onClick={saveConfiguration} className="w-full mt-6 bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold flex justify-center gap-2 transition-all">
                       <FileText size={18}/> Зберегти як чернетку
                   </button>
                </div>
             )}
          </div>
        )}

        {/* НАЛАШТУВАННЯ */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in">
             <div className="bg-slate-800/50 backdrop-blur p-5 rounded-2xl border border-white/10 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-blue-300 border-b border-white/5 pb-2"><DollarSign size={18}/> Стратегія</h2>
                <div className="grid gap-3">
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Тип вкладу</label>
                        <select value={investmentType} onChange={e => setInvestmentType(e.target.value)} className="w-full bg-black/20 p-2 rounded-lg border border-white/10 text-sm outline-none focus:border-blue-500">
                            <option value="lumpsum">Одноразово</option>
                            <option value="monthly">Щомісяця</option>
                            <option value="yearly">Щорічно</option>
                        </select>
                    </div>
                    <div><label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Старт ($)</label><CleanInput value={initialInvestment} onChange={setInitialInvestment} className="w-full"/></div>
                    {(investmentType === 'monthly' || investmentType === 'yearly') && (
                        <div><label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Додавання ($)</label><CleanInput value={investmentType === 'monthly' ? monthlyContribution : yearlyContribution} onChange={investmentType === 'monthly' ? setMonthlyContribution : setYearlyContribution} className="w-full"/></div>
                    )}
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Ребаланс</label>
                        <select value={rebalanceFrequency} onChange={e => setRebalanceFrequency(e.target.value)} className="w-full bg-black/20 p-2 rounded-lg border border-white/10 text-sm outline-none focus:border-blue-500">
                            <option value="never">Ніколи</option>
                            <option value="monthly">Щомісяця</option>
                            <option value="yearly">Щороку</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider mb-1 block">Дати</label>
                        <div className="flex gap-2">
                            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full bg-black/20 p-2 rounded-lg border border-white/10 text-xs text-gray-300"/>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full bg-black/20 p-2 rounded-lg border border-white/10 text-xs text-gray-300"/>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-slate-800/50 backdrop-blur p-5 rounded-2xl border border-white/10 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-purple-300 border-b border-white/5 pb-2"><Zap size={18}/> Симуляція</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-gray-500 text-[10px] uppercase">Років</label><CleanInput value={forecastYears} onChange={setForecastYears} className="w-full"/></div>
                    <div><label className="text-gray-500 text-[10px] uppercase">Симуляцій</label><CleanInput value={simulations} onChange={setSimulations} className="w-full"/></div>
                    <div><label className="text-gray-500 text-[10px] uppercase">Інфляція %</label><CleanInput step="0.1" value={inflationRate} onChange={setInflationRate} className="w-full"/></div>
                    <div><label className="text-gray-500 text-[10px] uppercase">Комісія %</label><CleanInput step="0.1" value={expenseRatio} onChange={setExpenseRatio} className="w-full"/></div>
                    <div><label className="text-gray-500 text-[10px] uppercase">Податок %</label><CleanInput step="0.1" value={taxRate} onChange={setTaxRate} className="w-full"/></div>
                    <div><label className="text-gray-500 text-[10px] uppercase">Довіра %</label><CleanInput value={confidenceLevel} onChange={setConfidenceLevel} className="w-full"/></div>
                </div>
             </div>

             <div className="bg-blue-900/10 backdrop-blur p-5 rounded-2xl border border-blue-500/20 space-y-4 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-blue-300 border-b border-blue-500/20 pb-2"><BrainCircuit size={18}/> AI Models</h2>
                    <div className="mt-4 space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-gray-300">ARIMA</span><InfoTooltip title="ARIMA" text="Прогноз тренду (p, d, q)" standard="1, 0, 1"/></div>
                            <div className="flex gap-1">
                                <CleanInput placeholder="p" value={arimaP} onChange={setArimaP} className="w-full text-center"/>
                                <CleanInput placeholder="d" value={arimaD} onChange={setArimaD} className="w-full text-center"/>
                                <CleanInput placeholder="q" value={arimaQ} onChange={setArimaQ} className="w-full text-center"/>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-gray-300">GARCH</span><InfoTooltip title="GARCH" text="Прогноз ризику (p, q)" standard="1, 1"/></div>
                            <div className="flex gap-1">
                                <CleanInput placeholder="p" value={garchP} onChange={setGarchP} className="w-full text-center"/>
                                <CleanInput placeholder="q" value={garchQ} onChange={setGarchQ} className="w-full text-center"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <button onClick={saveConfiguration} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold flex justify-center gap-2 transition-all">
                       <FileText size={18}/> Зберегти конфіг
                    </button>
                    <button onClick={runSimulation} disabled={loading || selectedStocks.length === 0} 
                         className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex justify-center gap-2 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-purple-900/20">
                         {loading ? "Аналіз..." : <><Zap size={18}/> Запустити</>}
                    </button>
                </div>
             </div>
          </div>
        )}

        {/* АНАЛІЗ */}
        {activeTab === 'analysis' && results && (
           <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                    { l: 'Медіана (50%)', v: `$${results.simulationStats.median?.toLocaleString(undefined, {maximumFractionDigits:0}) ?? 0}`, c: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                    { l: 'Песимістичний (10%)', v: `$${results.simulationStats.p10?.toLocaleString(undefined, {maximumFractionDigits:0}) ?? 0}`, c: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                    { l: 'CAGR (Річний ріст)', v: `${(results.historicalMetrics.annualReturn*100).toFixed(2)}%`, c: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { l: 'Успіх (>2x)', v: `${(results.simulationStats.successRate*100).toFixed(1)}%`, c: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
                 ].map((m, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${m.bg} backdrop-blur`}>
                       <div className="text-gray-400 text-xs mb-1">{m.l}</div>
                       <div className={`text-2xl font-bold ${m.c}`}>{m.v}</div>
                    </div>
                 ))}
              </div>

              <div className="bg-slate-800/50 backdrop-blur p-6 rounded-2xl border border-white/10">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowRight size={18}/> Прогноз динаміки (Monte Carlo)</h3>
                 <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <AreaChart data={results.avgPath}>
                            <defs>
                                <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                            <XAxis dataKey="year" stroke="#94a3b8"/>
                            <YAxis stroke="#94a3b8" tickFormatter={v => `$${v/1000}k`}/>
                            <ChartTooltip contentStyle={{backgroundColor: '#0f172a', border:'1px solid #334155'}} formatter={v => `$${v.toLocaleString()}`}/>
                            <Legend/>
                            <Area type="monotone" dataKey="median" stroke="#22c55e" fill="url(#colorMed)" strokeWidth={3} name="Медіана"/>
                            <Area type="monotone" dataKey="p90" stroke="#a855f7" fill="transparent" strokeDasharray="3 3" name="Оптимістичний"/>
                            <Area type="monotone" dataKey="p10" stroke="#ef4444" fill="transparent" strokeDasharray="3 3" name="Песимістичний"/>
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 backdrop-blur p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                      <div>
                          <h3 className="font-bold mb-6 flex items-center gap-2"><AlertCircle className="text-orange-400"/> Аналіз Ризиків</h3>
                          <div className="space-y-6">
                              <div>
                                  <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-300">Макс. просадка (Max Drawdown)</span>
                                      <span className="text-red-400 font-mono font-bold">{(results.historicalMetrics.maxDrawdown*100).toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                      <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full rounded-full" style={{width: `${Math.min(results.historicalMetrics.maxDrawdown*100, 100)}%`}}/>
                                  </div>
                              </div>
                              <div>
                                  <div className="flex justify-between text-sm mb-2">
                                      <span className="text-gray-300">Ймовірність зростання</span>
                                      <span className="text-green-400 font-mono font-bold">{(results.simulationStats.successRate*100).toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                      <div className="bg-gradient-to-r from-green-600 to-emerald-400 h-full rounded-full" style={{width: `${results.simulationStats.successRate*100}%`}}/>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-6">
                          <div className="flex gap-2 items-start">
                              <Info size={16} className="text-red-400 mt-0.5 shrink-0"/>
                              <div className="text-xs text-gray-300">
                                  <span className="text-red-300 font-bold">VaR (95%):</span> З ймовірністю 95% ваш денний збиток не перевищить <span className="text-white font-mono">{(results.historicalMetrics.var95*100).toFixed(2)}%</span>.
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur p-6 rounded-2xl border border-white/10">
                      <h3 className="font-bold mb-4">Очікуваний капітал (по рокам)</h3>
                      <div className="h-64">
                        <ResponsiveContainer>
                            <BarChart data={results.avgPath.filter((_,i)=>i>0)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false}/>
                                <XAxis dataKey="year" stroke="#94a3b8"/>
                                <YAxis stroke="#94a3b8" tickFormatter={v => `$${v/1000}k`}/>
                                <ChartTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', border:'none'}} formatter={v => `$${v.toLocaleString()}`}/>
                                <Bar dataKey="median" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {results.avgPath.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>
              
              <button onClick={saveResult} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-4 rounded-xl font-bold flex justify-center gap-2 shadow-lg shadow-green-900/20 transition-all">
                   <LineChartIcon size={20}/> Зберегти цей результат
              </button>
           </div>
        )}

        {/* ЗБЕРЕЖЕНІ */}
        {activeTab === 'saved' && (
           <div className="bg-slate-800/50 backdrop-blur p-6 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
              {savedPortfolios.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">Тут пусто. Збережіть налаштування або результат!</p>}
              {savedPortfolios.map((p, i) => (
                  <div key={i} onClick={() => loadPortfolio(p)} className="group bg-black/20 p-5 rounded-xl border border-white/5 hover:border-purple-500/50 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => deletePortfolio(p.id, e)} className="text-gray-500 hover:text-red-400 bg-black/50 p-2 rounded-lg backdrop-blur">
                              <Trash2 size={16}/>
                          </button>
                      </div>
                      
                      <div>
                          <div className="flex items-center gap-2 mb-2">
                             {/* ІКОНКА ТИПУ */}
                             {p.type === 'result' ? (
                                 <span className="bg-green-500/20 text-green-400 p-1.5 rounded-lg"><LineChartIcon size={14}/></span>
                             ) : (
                                 <span className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg"><FileText size={14}/></span>
                             )}
                             <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                 {p.type === 'result' ? 'Звіт' : 'Чернетка'}
                             </span>
                          </div>

                          <div className="font-bold text-lg text-white mb-1">{p.name}</div>
                          <div className="text-xs text-gray-400 mb-4 font-mono line-clamp-1">{p.stocks.join(', ')}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white/5 p-2 rounded"><div className="text-gray-500">Старт</div><div className="text-white font-mono">${(p.fullSettings?.initialInvestment || p.settings?.initialInvestment || 0).toLocaleString()}</div></div>
                          {p.type === 'result' && p.analysisResult ? (
                              <div className="bg-green-500/10 border border-green-500/20 p-2 rounded"><div className="text-green-500">Фінал (50%)</div><div className="text-green-300 font-bold font-mono">${p.analysisResult.simulationStats.median.toLocaleString()}</div></div>
                          ) : (
                              <div className="bg-white/5 p-2 rounded"><div className="text-gray-500">Горизонт</div><div className="text-purple-400 font-mono">{p.fullSettings?.forecastYears || p.settings?.forecastYears} років</div></div>
                          )}
                      </div>
                  </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalyzer;