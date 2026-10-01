import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const siteUrl = 'https://www.orbitwebdesigns.co.ke';

// Generate a random 128-char key for IndexNow
function generateKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 128; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function main() {
  // Read sitemap to get all URLs
  const sitemapPath = path.join(distDir, 'sitemap-0.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('Sitemap not found at', sitemapPath);
    process.exit(1);
  }

  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  const urlMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g);
  const urls = urlMatches ? urlMatches.map(m => m.replace('<loc>', '').replace('</loc>', '')) : [];

  if (urls.length === 0) {
    console.error('No URLs found in sitemap');
    process.exit(1);
  }

  // Generate key
  const key = generateKey();

  // Write key file for future pings
  const keyPath = path.join(distDir, 'indexnow-key.txt');
  fs.writeFileSync(keyPath, key);
  console.log('Generated IndexNow key:', key);

  // Generate indexnow.xml
  const today = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u === siteUrl + '/' ? '1.0' : u.includes('/packages') || u.includes('/services') ? '0.9' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;

  const xmlPath = path.join(distDir, 'indexnow.xml');
  fs.writeFileSync(xmlPath, xml);
  console.log(`Generated indexnow.xml with ${urls.length} URLs`);

  // Also create a simple ping script for CI/CD
  const pingScript = `#!/bin/bash
# IndexNow ping script - run after deploy
KEY=$(cat dist/indexnow-key.txt)
HOST="www.orbitwebdesigns.co.ke"
URLS=$(cat dist/indexnow.xml | grep -oP '(?<=<loc>)[^<]+' | tr '\\n' ',' | sed 's/,$//')

curl -X POST "https://api.indexnow.org/indexnow" \\
  -H "Content-Type: application/json; charset=utf-8" \\
  -d "{
    \"host\": \"\${HOST}\",
    \"key\": \"\${KEY}\",
    \"keyLocation\": \"https://\${HOST}/indexnow-key.txt\",
    \"urlList\": [\${URLS}]
  }"
`;

  const pingPath = path.join(__dirname, 'ping-indexnow.sh');
  fs.writeFileSync(pingPath, pingScript);
  fs.chmodSync(pingPath, 0o755);
  console.log('Created ping-indexnow.sh for CI/CD');
}

main();