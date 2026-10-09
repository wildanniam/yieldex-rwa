FROM node:24.18.0-bookworm-slim
WORKDIR /app
RUN npm install --global pnpm@11.3.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod --filter @rwa/worker...
COPY packages/shared packages/shared
COPY apps/worker/src apps/worker/src
COPY infra/worker/entrypoint.sh /usr/local/bin/yieldex-indexer
USER node
ENTRYPOINT ["sh", "/usr/local/bin/yieldex-indexer"]
