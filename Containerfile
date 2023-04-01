FROM docker.io/golang:1.20 as server-builder

WORKDIR /usr/src/app

# pre-copy/cache go.mod for pre-downloading dependencies and only redownloading them in subsequent builds if they change
COPY server/go.mod ./
RUN go mod download && go mod verify

COPY server .
RUN make

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

ARG REACT_APP_API_ROOT=/api

RUN npm run build

FROM docker.io/debian:stable-slim as runner
WORKDIR /app
COPY --from=server-builder /usr/src/app/dist /app
COPY --from=client-builder /app/dist /app/public
EXPOSE 3333
CMD ["/app/planner"]