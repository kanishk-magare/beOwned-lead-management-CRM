FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Build the Vite React app
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# Serve production build using Vite preview
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
