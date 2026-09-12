FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && mkdir -p data && chown -R node:node /app
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4010
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:4010/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
EXPOSE 4010
CMD ["npm", "start"]
