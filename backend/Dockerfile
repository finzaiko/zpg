FROM node:alpine
ENV NODE_ENV=production

COPY package*.json ./

WORKDIR '/var/www/app'

RUN npm install --production

COPY . .

EXPOSE 9000

CMD [ "node", "index.js" ]