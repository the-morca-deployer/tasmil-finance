# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.33.2

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=secret,id=npm_token,required=true \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" pnpm install --frozen-lockfile --ignore-scripts

FROM dependencies AS builder
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AI_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MCP_STELLAR_URL
ARG NEXT_PUBLIC_STELLAR_NETWORK
ARG AI_INTERNAL_URL
ARG BACKEND_INTERNAL_URL
ARG QUEST_BACKEND_INTERNAL_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_AI_URL=${NEXT_PUBLIC_AI_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_MCP_STELLAR_URL=${NEXT_PUBLIC_MCP_STELLAR_URL} \
    NEXT_PUBLIC_STELLAR_NETWORK=${NEXT_PUBLIC_STELLAR_NETWORK} \
    AI_INTERNAL_URL=${AI_INTERNAL_URL} \
    BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL} \
    QUEST_BACKEND_INTERNAL_URL=${QUEST_BACKEND_INTERNAL_URL} \
    NODE_OPTIONS=--max-old-space-size=4096

RUN --mount=type=cache,target=/app/.next/cache pnpm build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 app \
 && adduser --system --uid 1001 --ingroup app app

COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3000
CMD ["node", "server.js"]
