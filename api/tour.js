import { searchTour } from '../server/tour.js'

export default async function handler(req, res) {
  try {
    const { keyword = '', type = '', lat, lng, radius } = req.query
    res.status(200).json(await searchTour({ keyword, contentTypeId: type, lat, lng, radius }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
