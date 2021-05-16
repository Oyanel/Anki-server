FROM node:14 As development

RUN npm install --global node-pre-gyp
RUN apt-get update && apt-get install -y build-essential && apt-get install -y python && npm install

WORKDIR /usr/src/app

COPY package*.json ./

ARG NODE_ENV=development

RUN npm ci

COPY . .

RUN npm run compile
