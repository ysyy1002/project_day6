import { createClient } from '@supabase/supabase-js'

// URL 뒤에 /rest/v1/ 같은 경로를 붙여 복사해도 동작하도록 도메인(origin)만 쓴다
const raw = import.meta.env.VITE_SUPABASE_URL
let url
try { url = raw ? new URL(raw.trim()).origin : undefined } catch { url = undefined }
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// .env.local 이 없어도 앱이 멈추지 않도록, 값이 없으면 null (이때 store 는 localStorage 로 대신 저장)
export const supabase = url && key ? createClient(url, key) : null
export const isSupabaseReady = Boolean(supabase)
