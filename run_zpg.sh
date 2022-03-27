#!/bin/bash

SERVER=127.0.0.1
PORT=9000
nc -z -v -w5 $SERVER $PORT
result1=$?

if [  "$result1" != 0 ]; then
  echo  'port "$PORT" is closed'
else
  echo 'port "$PORT" is open'
  npx kill-port $PORT
fi

cd ~/Projects/postgres/zpg
npm run dev