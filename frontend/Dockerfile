# Використовуємо легкий Node.js
FROM node:20-alpine

WORKDIR /app

# Копіюємо залежності
COPY package*.json ./

# Встановлюємо їх
RUN npm install

# Копіюємо код
COPY . .

# Відкриваємо порт Vite
EXPOSE 5173

# Запускаємо в режимі розробки з флагом --host (щоб був доступ ззовні контейнера)
CMD ["npm", "run", "dev", "--", "--host"]