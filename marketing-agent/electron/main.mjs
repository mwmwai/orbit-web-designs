import {app, BrowserWindow} from 'electron';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('server did not start');
}

async function createWindow() {
  await import(pathToFileURL(path.join(here, '..', 'src', 'app.mjs')).href);
  const port = process.env.PORT || 4780;
  await waitForServer(`http://127.0.0.1:${port}/`);
  const win = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 380,
    backgroundColor: '#0b0f1a',
    autoHideMenuBar: true,
    title: 'Marketing Agent',
    icon: path.join(here, '..', 'public', 'icons', 'icon-192.png'),
    webPreferences: {contextIsolation: true}
  });
  await win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
