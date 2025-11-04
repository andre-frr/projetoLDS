FROM node:18

RUN npm install -g npm@latest

WORKDIR /usr/src/app

COPY service-b/package*.json ./

RUN npm install

COPY protos ./protos
COPY service-b/. .

CMD [ "node", "client.js" ]

