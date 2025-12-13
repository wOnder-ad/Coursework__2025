import sys
import json
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from arch import arch_model
import warnings

# Вимикаємо попередження, щоб вони не псували JSON-відповідь для Node.js
warnings.filterwarnings("ignore")

def run_analysis():
    try:
        # Отримуємо дані від Node.js
        prices_input = json.loads(sys.argv[1]) # Історія цін портфелю
        arima_params = json.loads(sys.argv[2]) # {p, d, q}
        garch_params = json.loads(sys.argv[3]) # {p, q}

        if not prices_input or len(prices_input) < 30:
            print(json.dumps({"error": "Not enough data"}))
            return

        # 1. Підготовка даних (Логарифмічна дохідність)
        prices = pd.Series(prices_input)
        returns = 100 * np.log(prices / prices.shift(1)).dropna()

        # 2. ARIMA (Прогноз тренду)
        # Якщо модель не зійдеться, використовуємо просте середнє
        try:
            arima = ARIMA(returns, order=(arima_params['p'], arima_params['d'], arima_params['q']))
            arima_res = arima.fit()
            forecast_mean = float(arima_res.forecast(steps=1).iloc[0])
        except:
            forecast_mean = float(returns.mean())

        # 3. GARCH (Прогноз ризику/волатильності)
        # Якщо модель не зійдеться, використовуємо стандартне відхилення
        try:
            garch = arch_model(returns, vol='Garch', p=garch_params['p'], q=garch_params['q'], mean='Zero')
            garch_res = garch.fit(disp='off')
            forecast_vol = float(np.sqrt(garch_res.forecast(horizon=1).variance.iloc[-1, 0]))
        except:
            forecast_vol = float(returns.std())

        # 4. Масштабування на рік (252 робочі дні)
        annualized_return = (forecast_mean / 100) * 252
        annualized_volatility = (forecast_vol / 100) * np.sqrt(252)

        result = {
            "annualized_return": annualized_return,
            "annualized_volatility": annualized_volatility,
            "used_model": f"ARIMA({arima_params['p']},{arima_params['d']},{arima_params['q']}) + GARCH({garch_params['p']},{garch_params['q']})"
        }

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    run_analysis()