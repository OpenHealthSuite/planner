FROM --platform=$BUILDPLATFORM docker.io/golang:1.20 as server-builder
ARG TARGETPLATFORM
WORKDIR /usr/src/app

COPY server .
RUN GOOS=linux GOARCH=$(echo $TARGETPLATFORM | sed 's/linux\///') \
  go build -o dist/planner main.go

FROM --platform=$BUILDPLATFORM docker.io/node:18.7.0 as client-builder
WORKDIR /app

COPY client/package*.json ./
COPY client/tsconfig*.json ./

RUN npm ci

COPY client/index.html .
COPY client/src src
COPY client/public public

ARG APP_ENV=production
ENV APP_ENV ${APP_ENV}

RUN npm run build

FROM docker.io/debian:stable-slim as runner
WORKDIR /app
COPY --from=server-builder /usr/src/app/dist /app
COPY --from=client-builder /app/dist /app/public
EXPOSE 3333
CMD ["/app/planner"]