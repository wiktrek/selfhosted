# Build step
FROM oven/bun:alpine AS builder

WORKDIR /app
COPY . .

RUN bun install
RUN bunx vite build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3013
CMD ["nginx", "-g", "daemon off;"]