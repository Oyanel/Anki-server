FROM node:lts-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0 as build
WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

FROM build as build-dist
WORKDIR /usr/src/app

RUN npm ci --only-production
RUN npm run build


FROM build AS development
RUN npm ci

FROM node:lts-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0 as production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --production
COPY --from=build-dist /usr/src/app/dist dist
