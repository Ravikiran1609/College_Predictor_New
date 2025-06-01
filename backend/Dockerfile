FROM node:18

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY app.js ./
COPY Final_Data.csv ./

EXPOSE 5000
CMD ["node", "app.js"]

