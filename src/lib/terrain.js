import * as THREE from 'three'
import { MYTHS } from '../data/myths'
import { COAST_EXTRA } from '../data/coastPoints'

// 위도·경도 → 3D 월드 좌표. 1km = KM 유닛 (제주 동서 73km·남북 31km 비율 유지)
const KM = 0.5
const CENTER = { lat: 33.37, lng: 126.56 }
export const toWorld = (lat, lng) => [(lng - CENTER.lng) * 92.5 * KM, (CENTER.lat - lat) * 111 * KM]

// 제주 해안선을 단순화한 윤곽 (위도, 경도) — 시계 방향. 실제 해안선의 근사값입니다.
const COAST = [
  [33.296, 126.158], [33.330, 126.164], [33.370, 126.205], [33.394, 126.236], // 고산 → 협재
  [33.414, 126.262], [33.450, 126.298], [33.468, 126.325], [33.490, 126.385], // 한림 → 귀덕 → 애월
  [33.506, 126.455], [33.518, 126.510], [33.522, 126.545], [33.533, 126.590], // 도두 → 용두암 → 삼양
  [33.545, 126.640], [33.553, 126.690], [33.560, 126.740], [33.562, 126.770], // 조천 → 함덕 → 김녕
  [33.556, 126.815], [33.530, 126.860], [33.495, 126.910], [33.470, 126.955], // 월정 → 세화 → 성산(동쪽 끝)
  [33.440, 126.945], [33.415, 126.915], [33.370, 126.880], [33.325, 126.835], // 섭지코지 → 표선
  [33.290, 126.770], [33.270, 126.710], [33.262, 126.650], [33.238, 126.590], // 남원 → 위미 → 보목
  [33.235, 126.540], [33.240, 126.480], [33.243, 126.420], [33.236, 126.370], // 서귀포 → 중문 → 화순
  [33.228, 126.315], [33.215, 126.280], [33.200, 126.255], [33.215, 126.215], // 산방산 → 송악산
  [33.255, 126.175],
].map(([lat, lng]) => toWorld(lat, lng))

// 신화 장소 바로 밑은 윤곽이 조금 어긋나도 땅이 되도록 보장하는 반경 (월드 유닛, ≈ 0.7km).
// 좌표가 API 기준으로 정리됐으므로 작게 둔다 — 크면 해안 장소 둘레의 해안선이 바다 쪽으로 부푼다.
const SITE_R = 0.35
const SITES = MYTHS.map((m) => toWorld(m.lat, m.lng))

// 관광공사 API 장소 중 위 윤곽 바깥에 놓인 58곳 — 둘레 0.4유닛(≈0.8km)을 땅으로 보강해 해안선을 API 위치에 맞춘다
const EXTRA_R = 0.4
const EXTRA = COAST_EXTRA.map(([lat, lng]) => toWorld(lat, lng))
const [HX, HZ] = toWorld(33.3613, 126.5326) // 한라산 백록담

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// 해안선까지의 부호 있는 거리: 땅 안쪽이면 +, 바다면 −
function landValue(x, z) {
  let inside = false
  let best = Infinity
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
    const [xi, zi] = COAST[i]
    const [xj, zj] = COAST[j]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
    const dx = xj - xi
    const dz = zj - zi
    const t = Math.max(0, Math.min(1, ((x - xi) * dx + (z - zi) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - (xi + t * dx), z - (zi + t * dz)))
  }
  let v = inside ? best : -best
  for (const [sx, sz] of SITES) v = Math.max(v, SITE_R - Math.hypot(x - sx, z - sz))
  for (const [ex, ez] of EXTRA) v = Math.max(v, EXTRA_R - Math.hypot(x - ex, z - ez))
  // 해안선을 울퉁불퉁하게
  return v + 0.15 * Math.sin(x * 1.3 + z * 0.7) + 0.1 * Math.sin(z * 2.1 - x * 0.9)
}

// 368개 오름 흉내: 시드 고정 의사난수로 작은 봉우리를 땅 위에 흩뿌린다
const BUMPS = (() => {
  let s = 20260
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out = []
  for (let tries = 0; out.length < 46 && tries < 4000; tries++) {
    const x = (rnd() * 2 - 1) * 19
    const z = (rnd() * 2 - 1) * 10
    const h = 0.18 + rnd() * 0.32
    const s2 = 2 * (0.3 + rnd() * 0.3) ** 2
    if (landValue(x, z) < 1.2) continue
    out.push({ x, z, h, s2 })
  }
  return out
})()

// (x, z)에서의 지형 높이. 0.2 아래는 바다 속(해수면 = y 0 → 지형 y = h - 0.2)
export function heightAt(x, z) {
  const land = landValue(x, z)
  const base = smooth(-0.64, 1.5, land) * 0.9 // 해안선(land = 0)에서 h ≈ 0.2 → 정확히 해수면
  const r2 = (x - HX) ** 2 + (z - HZ) ** 2
  // 백록담: 꼭대기를 깎아 분화구를 만들고, 둘레에 낮은 능선(분화구 벽)을 세운다 (실제는 지름 ≈0.5km, 눈에 보이도록 과장)
  const crater = -0.5 * Math.exp(-r2 / (2 * 0.3 ** 2)) + 0.2 * Math.exp(-((Math.sqrt(r2) - 0.55) ** 2) / (2 * 0.16 ** 2))
  const peak = (3.6 * Math.exp(-r2 / (2 * 2.1 ** 2)) + crater) * smooth(0, 1.2, land)
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
