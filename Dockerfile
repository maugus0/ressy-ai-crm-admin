FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies with clean CI install
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build the Vite app
COPY . .
RUN GITHUB_PAGES=true npm run build:gh-pages

# Run the compiled site behind Nginx
FROM nginx:1.27-alpine AS runtime

# Replace the default site configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite build artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

