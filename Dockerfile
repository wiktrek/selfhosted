# syntax=docker/dockerfile:1
FROM oven/bun:alpine

WORKDIR /app

COPY . .

RUN bun install

CMD ["bun", "index.ts"]
