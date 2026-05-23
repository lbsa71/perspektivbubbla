FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/client/package.json packages/client/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/server/package.json packages/server/package.json

RUN npm ci

FROM deps AS build

COPY . .

RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173
ENV PERSPEKTIVBUBBLA_CLIENT_DIR=/app/packages/client/public/dist

COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/core/src packages/core/src
COPY packages/server/src packages/server/src
COPY --from=build /app/packages/client/public/dist packages/client/public/dist

EXPOSE 5173

USER node

CMD ["npm", "start"]
