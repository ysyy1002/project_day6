# 신들의 섬 — 제주 신화 지도

제주 신화·설화가 깃든 9곳을 **3D 지도(Three.js)** 위에 별로 띄우고, 그 자리의 **공공데이터 3종**(기상청 예보 · 한국관광공사 TourAPI · 국가유산청)을 겹쳐 보여주는 웹앱. **AI 에이전트 '할망'** 이 이 API들을 도구로 골라 호출해 답합니다.

## 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # 화면 + /api 서버 함수가 함께 실행 (http://localhost:5173)
```

| 키 | 용도 |
|---|---|
| `DATA_GO_KR_KEY` | 공공데이터포털 **Decoding** 키 (TourAPI + 기상청 단기예보). 국가유산청 API는 키 불필요 |
| `ANTHROPIC_API_KEY` | 에이전트 전용 (서버에서만 사용) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | 즐겨찾기·도감 저장. 비워 두면 localStorage 로 대신 저장 |

Supabase: `supabase/schema.sql` 을 SQL Editor 에서 실행 (favorites, discoveries 테이블).

## 구조

```
api/       Vercel 서버 함수 (tour, weather, heritage, agent, hello)
server/    공공데이터 호출 로직 — api/ 와 에이전트 도구가 같이 씀
src/
  pages/       Home(3D 지도) · Codex(도감) · Oracle(에이전트) · Journey(내 여정)
  components/  Scene(Three.js) · SitePanel · ApiState · Toasts
  store/       Zustand (선택 장소, API 캐시, 즐겨찾기, 도감, 대화)
  api/         /api 호출 모음      lib/ terrain·supabase      data/ 신화 9곳
```

## 3D ↔ 데이터 연결
- 위경도 → 월드 좌표 변환으로 신화 장소를 한라산 지형 위에 배치
- 기상청 예보에 비가 있으면 선택한 장소 위에 **빗줄기** 렌더링
- TourAPI 주변 명소(청록 구슬)·국가유산(금빛 상자)이 3D 위에 마커로 표시
- 에이전트가 언급한 장소는 지도에서 **반짝임**

## 배포 (Vercel)
1. GitHub 에 push → Vercel Import (Framework: Vite)
2. Environment Variables 에 위 5개 키 등록
3. 고정 주소(`프로젝트명.vercel.app`) 로 접속해 확인
