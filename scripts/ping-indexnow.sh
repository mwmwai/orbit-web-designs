#!/bin/bash
# IndexNow ping script - run after deploy
KEY=$(cat public/indexnow-key.txt)
HOST="www.orbitwebdesigns.co.ke"
URLS=$(grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | sed 's/<[^>]*>//g' | sed 's/^/"/;s/$/"/' | tr '\n' ',' | sed 's/,$//')

curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    \"host\": \"${HOST}\",
    \"key\": \"${KEY}\",
    \"keyLocation\": \"https://${HOST}/indexnow-key.txt\",
    \"urlList\": [${URLS}]
  }"
