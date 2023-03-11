# FROM node:14.17.3
# FROM node:alpine
# ENV NODE_ENV=dev
# WORKDIR /
# COPY ./package*.json ./
# RUN npm install
# COPY . .
# EXPOSE 9000
# CMD ["node", "./index.js"]

# FROM node:16.17.0-alpine
FROM node:alpine

RUN mkdir /app
ADD . /app
WORKDIR /app

RUN npm update
CMD ["node", "index.js"]

# FROM node:alpine
# COPY ./ ./
# RUN npm install
# EXPOSE 9000
# CMD ["node", "index.js"]
