#!/bin/bash
# Run Hermes exec system
cd "$(dirname "$0")"
npm install > /dev/null 2>&1
node src/core/index.js > /tmp/hermes.log 2>&1 &
echo "Hermes started in background (PID: $!)"
sleep 5
cat /tmp/hermes.log
