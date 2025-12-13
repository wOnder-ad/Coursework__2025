const express = require('express');
const cors = require('cors');
const logic = require('./logic');

const app = express();
app.use(cors()); // Дозволяє фронтенду звертатися до бекенду
app.use(express.json({ limit: '50mb' })); // Збільшений ліміт для даних

let savedPortfolios = [];

app.get('/api/stocks', (req, res) => {
    const data = logic.loadStockData();
    const stocks = new Set();
    data.forEach(row => Object.keys(row).forEach(k => {
        if (k !== 'Date') stocks.add(k);
    }));
    res.json(Array.from(stocks).sort());
});

app.post('/api/simulate', (req, res) => {
    try {
        const result = logic.runSimulation(req.body);
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/portfolio', (req, res) => res.json(savedPortfolios));
app.post('/api/portfolio', (req, res) => {
    savedPortfolios.push(req.body);
    res.json({ success: true });
});

app.listen(5000, () => console.log('Backend running on port 5000'));