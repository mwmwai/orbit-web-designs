import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 4321;
const HTML_PATH = fileURLToPath(new URL('./index.html', import.meta.url));

const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url.startsWith('/index.html')) {
    try {
      const html = await readFile(HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Failed to load app: ${err.message}`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Playground app running at http://localhost:${PORT}`);
});
