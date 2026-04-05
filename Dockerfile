FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/mcp-tools.yaml ./mcp-tools.yaml
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production
ENV TRANSPORT=http
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js", "--transport", "http"]
