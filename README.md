# 📈 Investment AI Analyst

A professional cross-platform application for analyzing and forecasting stock investment portfolios. The project combines the power of **Monte Carlo** simulations with advanced econometric models (**ARIMA**, **GARCH**) running on Python to provide accurate risk and trend assessments.

---

## 🚀 Key Features

* **Portfolio Management:** Select stocks from the S&P 500 (historical data), adjust weights, and manage saved portfolios.
* **Monte Carlo Simulation:** Generate thousands of potential market scenarios to estimate probabilities of success.
* **AI/ML Forecasting:**
    * **ARIMA:** Predicts price trends based on historical inertia.
    * **GARCH:** Models market volatility and risk clustering.
* **Financial Settings:** Configure inflation, broker fees, taxes, and monthly/yearly contributions.
* **Deep Analytics:** Interactive charts (Recharts), distribution histograms, VaR (Value at Risk) calculation, and annual return projections.
* **Cross-Platform:** Runs on Web, Desktop, and Mobile (via web technologies).

## 🛠 Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Recharts, Lucide React.
* **Backend:** Node.js (Express), Child Process for Python integration.
* **Math Engine:** Python (Pandas, NumPy, Statsmodels, Arch).
* **Containerization:** Docker & Docker Compose.

## 🐳 Running with Docker (Recommended)

This is the easiest way to run the application without installing dependencies manually.

1.  Make sure you have **Docker Desktop** installed.
2.  Open a terminal in the project root.
3.  Run the command:
    ```bash
    docker-compose up --build
    ```
4.  Open your browser at: `http://localhost:5173`

## ⚙️ Manual Installation

If you prefer running it without Docker:

**1. Backend Setup**
```bash
cd backend
npm install                 # Install Node dependencies
pip install -r requirements.txt  # Install Python libraries
node server.js              # Start server (Port 5000)
```
**2. Frontend Setup**
```bash
cd frontend
npm install                 # Install React dependencies
npm run dev                 # Start UI (Port 5173)
```
**License: MIT Author: 2025 Coursework Project**
