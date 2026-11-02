import { searchTour } from '../server/tour.js'

export default async function handler(req, res) {
  try {
    const { keyword = '', type = '', lat, lng, radius, rows } = req.query
    const n = Math.min(Math.max(Number(rows) || 10, 1), 100) // 한 번에 최대 100건
    res.status(200).json(await searchTour({ keyword, contentTypeId: type, lat, lng, radius, rows: n }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
