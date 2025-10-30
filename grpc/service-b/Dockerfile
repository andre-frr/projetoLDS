FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ../protos ./protos
COPY . .

CMD [ "node", "client.js" ]

