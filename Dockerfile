# Use uma imagem oficial do Node.js como base
FROM node:20-alpine

# Crie e defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie os arquivos de dependências
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Exponha a porta que a aplicação irá rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "src/index.js"]
