# Використовуємо легку версію Linux з Node.js 20
FROM node:20-slim

# 1. Встановлюємо Python 3 та pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# 2. Налаштовуємо віртуальне середовище Python (щоб уникнути конфліктів системних пакетів)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 3. Робоча папка
WORKDIR /app

# 4. Спочатку копіюємо файли залежностей (для кешування)
COPY package*.json ./
COPY requirements.txt ./

# 5. Встановлюємо залежності Node.js та Python
RUN npm install
RUN pip install -r requirements.txt

# 6. Копіюємо весь інший код
COPY . .

# 7. Відкриваємо порт
EXPOSE 5000

# 8. Запускаємо сервер
CMD ["node", "server.js"]