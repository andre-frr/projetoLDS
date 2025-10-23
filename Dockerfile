# Usa imagem Node oficial
FROM node:20-alpine

# Define diretório de trabalho
WORKDIR /usr/src/app

# Copia ficheiros de package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o resto do projeto
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Comando para correr Next.js
CMD ["npm", "run", "dev"]
