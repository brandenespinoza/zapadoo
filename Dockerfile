# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY data ./data
COPY svelte.config.js tsconfig.json ./
# Copy vite.config.js only if it exists
COPY vite.config.js* ./
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --production
# Set permissions for the data directory (will be mounted at runtime)
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 3000
ENV NODE_ENV=production
ENV DATA_PATH=/app/data
CMD ["node", "build"]