#!/bin/sh

git clone https://github.com/finzaiko/zpg.git
cd zpg/backend
cp .env.example .env
npm i
npm run build
pm2 start index.js --name "zpg"