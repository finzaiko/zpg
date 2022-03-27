#!/bin/sh

#Stop PM2 service
pm2 stop zpg

cd backend 

# Backup database
cp db.sqlite ../../

# Reset git
git reset --hard

cd ..

# Pull and update
git pull

chmod +x pm2update.sh

# Restore database
cp ../db.sqlite  backend/

# Build frontend
cd frontend
npm i && npm run build
cd ..

# Start PM2 service
pm2 start zpg

# https://pm2.keymetrics.io/docs/usage/startup/
