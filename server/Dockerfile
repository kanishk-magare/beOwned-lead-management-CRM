FROM node:20-alpine

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose backend API port
EXPOSE 5000

# Start backend server
CMD ["node", "src/index.js"]
