# JUWON SYSTEM

Windows용 로컬 프로젝트 진행 시스템이다. 생활 습관을 평가하지 않으며 프로젝트 결과물만 기록한다.

## 실행과 검증

```powershell
rtk npm install
rtk npm run dev
rtk npm run typecheck
rtk npm run test:run
rtk npm run build
rtk npm run test:e2e
rtk npm run package
```

`npm run package`는 `release/`에 Windows x64 설치 파일과 unpacked 앱을 만든다. 관리자 권한, 자동 시작, 방화벽 변경, 보안 예외를 요청하지 않는다.

## 화면

- A — `PLAYER STATUS`: 시작 화면. 플레이어 레벨, YouTube·Vibe Coding·Business 능력치, 활성 Gate, 현재 퀘스트.
- B — `QUEST DETAIL`: A의 현재 퀘스트를 클릭해 연다. 목표, 단계, 고정 보상, 증거 제출.
- C — `PROJECT COMMAND`: `PROJECTS` 버튼으로 필요할 때만 연다. ACTIVE, SHADOW, LOCKED, CLEARED 프로젝트 목록.

## 데이터와 백업

데이터는 Electron의 Windows `userData` 폴더 안 `juwon-system.db`에 저장된다. 같은 폴더의 `backups/`에는 하루 한 번 `system-YYYY-MM-DD.db`가 생성되며 최신 7개만 유지된다. 증거 원본 파일은 복사하거나 삭제하지 않는다.

DB가 손상되면 앱을 닫고 다음 순서로 복구한다.

1. `juwon-system.db`, `juwon-system.db-wal`, `juwon-system.db-shm`을 별도 폴더로 이동해 보존한다.
2. `backups/`의 가장 최신 `system-YYYY-MM-DD.db`를 복사한다.
3. 복사본 이름을 `juwon-system.db`로 바꾼다.
4. 앱을 다시 연다.

원본이나 백업을 삭제하지 말고 먼저 복사본으로 복구한다.

## 진행 규칙

- ACTIVE 프로젝트 최대 1개, SHADOW 자동화 프로젝트 최대 1개.
- 능력치는 YouTube, Vibe Coding, Business만 존재한다.
- 퀘스트 XP와 능력치 배분은 시작할 때 고정된다.
- 증거 제출 뒤 검토가 완료되어야 XP가 한 번 지급된다.
- 실패하거나 미룬 퀘스트에 마이너스 XP나 수치심 문구를 사용하지 않는다.

현재 Core 패키지에는 Codex Bridge, Safe Controller, Chrome Focus Guard가 들어 있지 않다. 따라서 임의 명령 실행, Chrome·OBS 제어, 웹사이트 차단 기능도 아직 없다.
