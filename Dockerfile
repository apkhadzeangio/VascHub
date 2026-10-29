# Adapted from the official Payload Website Template / Next.js Docker example.
FROM node:24.22.1-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@11.25.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3000
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
# Only a non-secret build-time placeholder: never used by the runtime process.
RUN PAYLOAD_SECRET=build-only-not-a-runtime-secret pnpm build

# Keeps Payload CLI + TypeScript migrations available in the deployed image.
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app ./
RUN mkdir -p /app/public/media /app/media-data/library-private && chown -R node:node /app/public/media /app/media-data
USER node
EXPOSE 3000
CMD ["pnpm", "start", "--hostname", "0.0.0.0"]
