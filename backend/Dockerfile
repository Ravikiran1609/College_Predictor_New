FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production
RUN npm install pdfkit

# Copy source code and data
COPY app.js ./
COPY Final_Data.csv ./

EXPOSE 5000

CMD ["node", "app.js"]

