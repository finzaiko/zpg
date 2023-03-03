# DEPLOY TO PM2

## Install
```
git clone https://github.com/finzaiko/zpg.git
cd zpg/backend
cp .env.example .env
npm i
npm run build
pm2 start index.js --name "zpg"
```

## Update
```
pm2 stop zpg
cd /home/finzaiko/project/zpg/backend 
git pull
npm run build
pm2 start zpg
```

