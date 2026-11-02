import { getWeather } from '../server/weather.js'

export default async function handler(req, res) {
  try {
    res.status(200).json(await getWeather({ lat: req.query.lat, lng: req.query.lng }))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
