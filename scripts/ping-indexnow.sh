#!/bin/bash
# IndexNow ping script - run after deploy
KEY=$(cat dist/indexnow-key.txt)
HOST="www.orbitwebdesigns.co.ke"
URLS=$(cat dist/indexnow.xml | grep -oP '(?<=<loc>)[^<]+' | tr '\n' ',' | sed 's/,$//')

curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    "host": "${HOST}",
    "key": "${KEY}",
    "keyLocation": "https://${HOST}/indexnow-key.txt",
    "urlList": [${URLS}]
  }"
