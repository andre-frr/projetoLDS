FROM node:18

RUN npm install -g npm@latest

WORKDIR /usr/src/app

COPY service-a/package*.json ./

RUN npm install

COPY protos ./protos
COPY service-a/. .

EXPOSE 50051

CMD [ "node", "server.js" ]

