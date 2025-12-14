const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const logic = require('./logic');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Шлях до файлу збереження
const DATA_FILE = path.join(__dirname, 'data', 'portfolios.json');

// Функція завантаження збережених даних
const loadPortfolios = () => {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error("Error reading portfolios file:", e);
            return [];
        }
    }
    return [];
};

// Функція збереження на диск
const saveToDisk = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error writing to disk:", e);
    }
};

// Завантажуємо дані при старті сервера
let savedPortfolios = loadPortfolios();

app.get('/api/stocks', (req, res) => {
    const data = logic.loadStockData();
    const stocks = new Set();
    data.forEach(row => Object.keys(row).forEach(k => {
        if (k !== 'Date') stocks.add(k);
    }));
    res.json(Array.from(stocks).sort());
});

app.post('/api/simulate', async (req, res) => {
    try {
        console.log("Starting simulation...");
        const result = await logic.runSimulation(req.body);
        console.log("Simulation finished."); 
        res.json(result);
    } catch (e) {
        console.error("Simulation Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/portfolio', (req, res) => {
    // Завжди читаємо актуальний стан (на випадок ручних правок файлу)
    savedPortfolios = loadPortfolios();
    res.json(savedPortfolios);
});

app.post('/api/portfolio', (req, res) => {
    const newPortfolio = { ...req.body, id: Date.now().toString() };
    savedPortfolios.push(newPortfolio);
    
    // ЗБЕРІГАЄМО НА ДИСК
    saveToDisk(savedPortfolios);
    
    res.json({ success: true, id: newPortfolio.id });
});

app.delete('/api/portfolio/:id', (req, res) => {
    const { id } = req.params;
    savedPortfolios = savedPortfolios.filter(p => p.id !== id);
    
    // ЗБЕРІГАЄМО НА ДИСК
    saveToDisk(savedPortfolios);
    
    res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));