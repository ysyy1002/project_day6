import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// 개발 서버에서 /api/*.js (Vercel 서버 함수)를 그대로 실행해 주는 플러그인.
// → `npm run dev` 한 번으로 화면 + 서버 함수가 같이 돈다 (vercel dev 불필요)
function apiDev() {
  return {
    name: 'api-dev',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.slice(5)
        if (!/^[a-z]+$/.test(name)) return next()

        req.query = Object.fromEntries(url.searchParams)
        if (req.method === 'POST') {
          let raw = ''
          for await (const chunk of req) raw += chunk
          try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
        }
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(obj))
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          await mod.default(req, res)
        } catch (e) {
          if (!res.headersSent) res.status(500).json({ error: e.message })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDev()],
  build: { chunkSizeWarningLimit: 1500 },
})
