import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { MYTHS, MYTH_BY_ID } from '../data/myths'
import { buildTerrainGeometry, surfaceY, toWorld } from '../lib/terrain'

const OVERVIEW = { target: new THREE.Vector3(0, 0, 0), cam: new THREE.Vector3(0, 17, 28) }

function Terrain() {
  const geo = useMemo(buildTerrainGeometry, [])
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} />
    </mesh>
  )
}

function Sea() {
  const ref = useRef()
  useFrame((s) => { ref.current.material.opacity = 0.82 + Math.sin(s.clock.elapsedTime * 0.6) * 0.03 })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[160, 100]} />
      <meshStandardMaterial color="#0a2c4d" transparent opacity={0.85} roughness={0.25} metalness={0.3} />
    </mesh>
  )
}

function Moon() {
  return (
    <group position={[-22, 17, -34]}>
      <mesh>
        <sphereGeometry args={[2.4, 32, 32]} />
        <meshBasicMaterial color="#fff6dc" toneMapped={false} />
      </mesh>
      <pointLight intensity={900} distance={120} color="#cfe0ff" />
    </group>
  )
}

// 신화 장소 하나 = 빛기둥 + 떠 있는 보석
function Beacon({ site, selected, discovered, focused, onSelect }) {
  const [x, z] = toWorld(site.lat, site.lng)
  const y = surfaceY(x, z)
  const gem = useRef()
  const ring = useRef()
  const color = discovered ? '#ffd27a' : site.color
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    gem.current.rotation.y += dt * (selected ? 2.4 : 0.9)
    gem.current.position.y = 1.25 + Math.sin(t * 1.6 + x) * 0.12
    const pulse = focused ? 1 + ((t * 1.5) % 1) * 2.2 : selected ? 1.4 : 1
    ring.current.scale.setScalar(pulse)
    ring.current.material.opacity = focused ? 1 - ((t * 1.5) % 1) : 0.55
  })
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.035, 0.12, 3.2, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.5 : 0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.35, 0.45, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={gem}>
        <octahedronGeometry args={[selected ? 0.42 : 0.3]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 2.6 : 1.5} toneMapped={false} />
      </mesh>
      {/* 클릭하기 쉽도록 투명한 큰 충돌 구 */}
      <mesh
        position={[0, 1.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(site.id) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 2.1, 0]} center distanceFactor={15} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`beacon-tag${selected ? ' on' : ''}${discovered ? ' done' : ''}`}>{site.name}</div>
      </Html>
    </group>
  )
}

// 비가 오면 선택한 장소 위에 빗줄기가 내린다 (기상청 API → 3D)
function Rain({ at }) {
  const ref = useRef()
  const N = 700
  const pos = useMemo(() => {
    const a = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      a[i * 3] = (Math.random() - 0.5) * 9
      a[i * 3 + 1] = Math.random() * 6
      a[i * 3 + 2] = (Math.random() - 0.5) * 9
    }
    return a
  }, [])
  useFrame((_, dt) => {
    const p = ref.current.geometry.attributes.position
    for (let i = 0; i < N; i++) {
      let y = p.getY(i) - dt * 7
      if (y < 0) y += 6
      p.setY(i, y)
    }
    p.needsUpdate = true
  })
  return (
    <points ref={ref} position={[at[0], at[1], at[2]]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#9ec9ff" transparent opacity={0.8} depthWrite={false} />
    </points>
  )
}

// 주변 명소(TourAPI, 청록 구슬)·국가유산(국가유산청 API, 금빛 상자)
function Markers({ items }) {
  const [hover, setHover] = useState(null)
  return items.map((m) => {
    const [x, z] = toWorld(m.lat, m.lng)
    const y = surfaceY(x, z) + 0.18
    const c = m.kind === 'tour' ? '#5fe3d0' : '#ffcf5a'
    return (
      <group key={`${m.kind}-${m.id}`} position={[x, y, z]}>
        <mesh onPointerOver={(e) => { e.stopPropagation(); setHover(m.id) }} onPointerOut={() => setHover(null)}>
          {m.kind === 'tour' ? <sphereGeometry args={[0.13, 12, 12]} /> : <boxGeometry args={[0.22, 0.22, 0.22]} />}
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {hover === m.id && (
          <Html position={[0, 0.4, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div className="marker-tag">{m.title}</div>
          </Html>
        )}
      </group>
    )
  })
}

// 선택이 바뀌면 카메라가 그 장소로 날아간다. 이동이 끝나면 사용자가 자유롭게 돌릴 수 있다.
function CameraRig({ selectedId, controls }) {
  const { camera } = useThree()
  const anim = useRef(null)
  useEffect(() => {
    const c = controls.current
    if (!c) return
    if (!selectedId) { anim.current = { to: OVERVIEW.target, cam: OVERVIEW.cam, t: 0 }; return }
    const site = MYTH_BY_ID[selectedId]
    const [x, z] = toWorld(site.lat, site.lng)
    const to = new THREE.Vector3(x, surfaceY(x, z) + 0.8, z)
    const dir = camera.position.clone().sub(c.target).normalize()
    dir.y = Math.max(dir.y, 0.4)
    anim.current = { to, cam: to.clone().add(dir.normalize().multiplyScalar(8)), t: 0 }
  }, [selectedId, camera, controls])
  useFrame((_, dt) => {
    const a = anim.current
    const c = controls.current
    if (!a || !c) return
    a.t += dt
    const k = 1 - Math.pow(0.002, dt)
    c.target.lerp(a.to, k)
    camera.position.lerp(a.cam, k)
    c.update()
    if (a.t > 1.8) anim.current = null
  })
  return null
}

export default function Scene({ selectedId, onSelect, discovered, focus, weather, nearby }) {
  const controls = useRef()
  const site = selectedId ? MYTH_BY_ID[selectedId] : null
  const sitePos = useMemo(() => {
    if (!site) return null
    const [x, z] = toWorld(site.lat, site.lng)
    return [x, surfaceY(x, z), z]
  }, [site])
  const raining = weather?.some((w) => w.rain !== '없음')

  return (
    <Canvas camera={{ position: OVERVIEW.cam.toArray(), fov: 45 }} dpr={[1, 2]} onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#050a14']} />
      <fog attach="fog" args={['#050a14', 48, 110]} />
      <ambientLight intensity={0.55} color="#8fa6d6" />
      <directionalLight position={[-12, 18, -16]} intensity={1.6} color="#d6e4ff" />
      <hemisphereLight args={['#6f8fd8', '#1a2a1c', 0.6]} />
      <Stars radius={90} depth={40} count={3500} factor={5} fade speed={0.6} />
      <Moon />
      <Terrain />
      <Sea />
      <Sparkles count={70} scale={[16, 4, 6]} size={4} speed={0.3} color="#cfe8ff" position={[-1, 4.5, 1]} />
      {MYTHS.map((m) => (
        <Beacon
          key={m.id}
          site={m}
          selected={m.id === selectedId}
          discovered={discovered.includes(m.id)}
          focused={focus.includes(m.id)}
          onSelect={onSelect}
        />
      ))}
      <Markers items={nearby} />
      {raining && sitePos && <Rain at={sitePos} />}
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={44} maxPolarAngle={Math.PI * 0.47} />
      <CameraRig selectedId={selectedId} controls={controls} />
    </Canvas>
  )
}
