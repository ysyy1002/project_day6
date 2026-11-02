import * as THREE from 'three'

// 위도·경도 → 3D 월드 좌표. 1km = KM 유닛 (제주 동서 73km·남북 31km 비율 유지)
const KM = 0.5
const CENTER = { lat: 33.37, lng: 126.56 }
export const toWorld = (lat, lng) => [(lng - CENTER.lng) * 92.5 * KM, (CENTER.lat - lat) * 111 * KM]

const A = 36.5 * KM // 섬 반장축(동서)
const B = 15.5 * KM // 섬 반단축(남북)
const [HX, HZ] = toWorld(33.3617, 126.5292) // 한라산

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// 368개 오름 흉내: 시드 고정 의사난수로 작은 봉우리를 흩뿌린다
const BUMPS = (() => {
  let s = 20260
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out = []
  while (out.length < 46) {
    const x = (rnd() * 2 - 1) * A * 0.85
    const z = (rnd() * 2 - 1) * B * 0.8
    if ((x / A) ** 2 + (z / B) ** 2 > 0.7) continue
    out.push({ x, z, h: 0.18 + rnd() * 0.32, s2: 2 * (0.3 + rnd() * 0.3) ** 2 })
  }
  return out
})()

// (x, z)에서의 지형 높이. 0.2 아래는 바다 속(해수면 = y 0 → 지형 y = h - 0.2)
export function heightAt(x, z) {
  let d = Math.hypot(x / A, z / B)
  d *= 1 + 0.06 * Math.sin(x * 0.8 + z * 0.5) + 0.04 * Math.sin(z * 1.7 - x * 0.3) // 해안선을 울퉁불퉁하게
  const base = smooth(1.0, 0.5, d) * 0.9
  const r2 = (x - HX) ** 2 + (z - HZ) ** 2
  const peak = 3.6 * Math.exp(-r2 / (2 * 2.1 ** 2)) * smooth(1.0, 0.7, d)
  let bumps = 0
  for (const b of BUMPS) bumps += b.h * Math.exp(-((x - b.x) ** 2 + (z - b.z) ** 2) / b.s2)
  return base + peak + bumps * smooth(0.05, 0.4, base)
}

export const surfaceY = (x, z) => Math.max(0, heightAt(x, z) - 0.2)

const RAMP = [
  [0.0, '#1a3a52'], [0.17, '#2c5b73'], [0.25, '#d9c9a0'], [0.4, '#4f8a4c'],
  [1.1, '#3f6f45'], [2.0, '#6b6a52'], [3.0, '#8f8577'], [3.8, '#eef2f5'],
]
const rampColors = RAMP.map(([h, c]) => [h, new THREE.Color(c)])
function colorAt(h, out) {
  for (let i = 1; i < rampColors.length; i++) {
    if (h <= rampColors[i][0]) {
      const [h0, c0] = rampColors[i - 1], [h1, c1] = rampColors[i]
      return out.copy(c0).lerp(c1, (h - h0) / (h1 - h0))
    }
  }
  return out.copy(rampColors.at(-1)[1])
}

export function buildTerrainGeometry() {
  const geo = new THREE.PlaneGeometry(50, 28, 250, 140)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const h = heightAt(pos.getX(i), pos.getZ(i))
    pos.setY(i, h - 0.2)
    colorAt(h, c).toArray(colors, i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}
