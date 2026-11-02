import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent, fetchHeritage, fetchPlaces, fetchWeather } from '../api/client'
import { MYTH_BY_ID } from '../data/myths'

// ── 앱 전체가 함께 쓰는 상태(store) ──────────────────────
// 저장 위치: Supabase 가 설정돼 있으면 Supabase(+ localStorage 캐시), 없으면 localStorage 만.
const who = (get) => get().nickname || '익명'
const settle = (r) => (r.status === 'fulfilled' ? { ok: true, data: r.value } : { ok: false, error: r.reason.message })

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ① 사용자
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),

      // ② 알림(토스트)
      toasts: [],
      toast: (message, variant = 'ok') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2600)
      },

      // ③ 3D 지도에서 선택한 신화 장소 + 그 장소의 공공데이터 3종 (한 번 받으면 캐시)
      selectedId: null,
      siteData: {},
      select: (id) => {
        set({ selectedId: id })
        if (id) get().loadSite(id)
      },
      loadSite: async (id, force = false) => {
        const site = MYTH_BY_ID[id]
        if (!site || (!force && get().siteData[id])) return
        const patch = (v) => set((s) => ({ siteData: { ...s.siteData, [id]: v } }))
        patch({ loading: true })
        const [w, t, h] = await Promise.allSettled([
          fetchWeather({ lat: site.lat, lng: site.lng }),
          fetchPlaces({ lat: site.lat, lng: site.lng, radius: 8000, type: '12' }), // 12 = 관광지
          fetchHeritage(site.heritageKeyword),
        ])
        patch({ loading: false, weather: settle(w), tour: settle(t), heritage: settle(h) })
      },

      // ④ 신화 도감(방문 기록) — Supabase discoveries 테이블
      discovered: [],
      loadDiscoveries: async () => {
        if (!supabase) return
        const { data, error } = await supabase.from('discoveries').select('myth_id').eq('nickname', who(get))
        if (error) return get().toast(error.message, 'bad')
        set({ discovered: data.map((r) => r.myth_id) })
      },
      discover: async (mythId) => {
        if (get().discovered.includes(mythId)) return
        set({ discovered: [...get().discovered, mythId] })
        get().toast(`‘${MYTH_BY_ID[mythId].name}’ 이야기를 도감에 기록했어요`)
        if (!supabase) return
        const { error } = await supabase.from('discoveries')
          .upsert({ nickname: who(get), myth_id: mythId }, { onConflict: 'nickname,myth_id' })
        if (error) get().toast(error.message, 'bad')
      },

      // ⑤ 즐겨찾기 — Supabase favorites 테이블
      favorites: [],
      favLoading: false,
      loadFavorites: async () => {
        if (!supabase) return
        set({ favLoading: true })
        const { data, error } = await supabase.from('favorites').select('*')
          .eq('nickname', who(get)).order('created_at', { ascending: false })
        set({ favLoading: false })
        if (error) return get().toast(error.message, 'bad')
        set({ favorites: data })
      },
      addFavorite: async ({ source, id, title }) => {
        const item_id = String(id)
        if (get().favorites.some((f) => f.source === source && f.item_id === item_id)) return get().toast('이미 담아 둔 항목이에요')
        const row = { nickname: who(get), source, item_id, title }
        if (!supabase) {
          set({ favorites: [{ ...row, id: Date.now(), created_at: new Date().toISOString() }, ...get().favorites] })
          return get().toast('담았어요 (이 브라우저에 저장)')
        }
        const { data, error } = await supabase.from('favorites').insert(row).select().single()
        if (error) return get().toast(error.message, 'bad')
        set({ favorites: [data, ...get().favorites] })
        get().toast('담았어요')
      },
      removeFavorite: async (id) => {
        set({ favorites: get().favorites.filter((f) => f.id !== id) })
        if (!supabase) return
        const { error } = await supabase.from('favorites').delete().eq('id', id)
        if (error) get().toast(error.message, 'bad')
      },

      // ⑥ 에이전트 대화 — 페이지를 옮겨도 대화가 남도록 store 에 둔다
      messages: [], // { role, text, steps }
      chatLoading: false,
      focus: [],    // 에이전트가 언급한 신화 장소 → 3D 지도에서 반짝임
      sendMessage: async (text) => {
        const history = get().messages.map((m) => ({ role: m.role, content: m.text }))
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps, focus } = await askAgent(text, history)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps }], focus })
        } catch (e) {
          get().toast(e.message, 'bad')
        } finally {
          set({ chatLoading: false })
        }
      },
      clearChat: () => set({ messages: [], focus: [] }),
    }),
    {
      name: 'shindeul-store',
      partialize: (s) => ({ nickname: s.nickname, favorites: s.favorites, discovered: s.discovered }),
    },
  ),
)
