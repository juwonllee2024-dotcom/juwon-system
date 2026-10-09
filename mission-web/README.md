# MISSION local vertical slice

학생이 목표 하나를 현재 미션 하나로 바꾸고, 직접 완료 증거를 적어 XP를 받는 로컬 웹앱입니다.

## 실행

- 요구사항: Node.js 26
- 설치: `rtk npm install`
- 개발 실행: `rtk npm run dev`
- 검증: `rtk npm run typecheck`, `rtk npm run test:run`, `rtk npm run build`, `rtk npm run test:e2e`
- 로컬 단계 비용: CA$0

현재 비활성화: Google OAuth, 실제 AI 모델, Stripe, 공개 호스팅, 분석 도구, 파일 업로드, 공개 출시.

수동 확인: 온보딩 완료 → 미션 시작 → 힌트 1회 → 증거 제출 → 새로고침 → 데이터 내보내기 → OS reduced-motion 모드 확인.
