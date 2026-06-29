# Build the Vite app
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve statically with NGINX
FROM nginx:alpine
# Copy custom nginx config to handle 301 redirects and extensions
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 for Google Cloud Run
ENV PORT 8080
EXPOSE $PORT

# Cloud Run injects $PORT automatically. Configure nginx to listen on $PORT

CMD ["nginx", "-g", "daemon off;"]
