# Build step
FROM oven/bun:alpine AS builder

WORKDIR /app
COPY . .

RUN bun install
RUN bunx vite build

# Serve with NGINX
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
