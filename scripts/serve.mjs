// tiny static file server for .output/public — node scripts/serve.mjs [port]
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const root = join(process.cwd(), '.output', 'public')
const port = Number(process.argv[2] ?? 4173)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (path.endsWith('/')) path += 'index.html'
    let file = normalize(join(root, path))
    let body
    try {
      body = await readFile(file)
    } catch {
      // extensionless route → try /index.html then 404 page
      try {
        body = await readFile(join(root, path, 'index.html'))
        file = 'index.html'
      } catch {
        body = await readFile(join(root, '404.html'))
        file = '404.html'
      }
    }
    res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(500)
    res.end('error')
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`))
