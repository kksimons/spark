FROM oven/bun:1.3.11 AS build
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ libsqlite3-dev && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.3.11 AS release
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ libsqlite3-dev && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
COPY server ./server
COPY tsconfig.json .

RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 3001

VOLUME ["/app/data"]

CMD ["bun", "run", "start"]
