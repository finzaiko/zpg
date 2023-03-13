#!/bin/sh
sed -i 's,API_BASE_URL, '"$API_SERVER"',g' '/app/public/assets/myapp.js'
sed -i 's,http://localhost:9000, '"$API_SERVER"',g' '/app/public/assets/monaco.js'
node index.js