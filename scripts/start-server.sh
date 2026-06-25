#!/bin/bash
# Zarbin web app server starter
# Starts a static file server on port 3000 in the background.
cd /home/z/my-project/zarbin
nohup node scripts/server.js > /tmp/zarbin-server.log 2>&1 &
echo $! > /tmp/zarbin-server.pid
disown
sleep 1
echo "Server PID: $(cat /tmp/zarbin-server.pid)"
