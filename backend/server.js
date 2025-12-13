const express = require('express');
const cors = require('cors');
const logic = require('./logic');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

let savedPortfolios = [];

app.get('/api/stocks', (req, res) => {
    const data = logic.loadStockData();
    const stocks = new Set();
    data.forEach(row => Object.keys(row).forEach(k => {
        if (k !== 'Date') stocks.add(k);
    }));
    res.json(Array.from(stocks).sort());
});

// === ОСНОВНЕ ВИПРАВЛЕННЯ ТУТ ===
app.post('/api/simulate', async (req, res) => { // 1. Додано async
    try {
        console.log("Starting simulation..."); // Лог для перевірки
        const result = await logic.runSimulation(req.body); // 2. Додано await
        console.log("Simulation finished."); 
        res.json(result);
    } catch (e) {
        console.error("Simulation Error:", e);
        res.status(500).json({ error: e.message });
    }
});
// ==============================

app.get('/api/portfolio', (req, res) => res.json(savedPortfolios));

app.post('/api/portfolio', (req, res) => {
    const newPortfolio = { ...req.body, id: Date.now().toString() };
    savedPortfolios.push(newPortfolio);
    res.json({ success: true, id: newPortfolio.id });
});

app.delete('/api/portfolio/:id', (req, res) => {
    const { id } = req.params;
    savedPortfolios = savedPortfolios.filter(p => p.id !== id);
    res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));