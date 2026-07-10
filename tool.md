Tool Audit · DocFinder 프로젝트
다음 단계에 쓸 만한 도구 후보 보고서
5 / 5 영역 완료
5개 에이전트를 영역별로 병렬로 띄워 실제 검색으로 확인한 것만 정리했습니다. 추측으로 지어낸 저장소/패키지명은 없고, 확인 안 된 항목은 그렇게 표시했습니다. 모든 항목은 이 환경(Windows, PowerShell, Node.js·npm·git 없음, Chrome만 설치됨)을 기준으로 평가했습니다.

브라우저 자동화 / 시각 테스트
이번 리서치의 핵심 발견
Claude Code 네이티브 Chrome 연동 (/chrome)
1순위
Claude Code에 내장된 기능. 확장 프로그램 하나만 깔면 클릭·타이핑·스크롤·탭 전환·콘솔 로그·네트워크 확인·스크린샷·GIF 녹화까지 전부 됨. Cmd+K 팔레트 열기, 다크모드 토글 클릭, 창 크기 바꿔 반응형 확인 — 지금 필요한 걸 다 커버.
Node/npm/git 전혀 불필요
Claude Code 유료 플랜 필요(Pro/Max/Team)
Windows 공식 지원
claude --chrome   (또는 세션 중 /chrome)
확인 필요 — 지금 이 세션(VSCode 확장 환경)에는 도구로 노출되어 있지 않음. 순수 터미널 Claude Code에서만 되는 기능인지 확인 중.
Chrome DevTools MCP (Google 공식)
이미 설치된 Chrome 150을 그대로 자동화. 스크린샷·성능 트레이스·콘솔·네트워크까지, Puppeteer 기반이라 클릭 등 액션도 가능.
Node.js 20.19+ 필요
무료·API 키 불필요
Windows 지원
claude mcp add-json chrome-devtools '{"command":"npx","args":["-y","chrome-devtools-mcp@latest"]}'
Playwright MCP (Microsoft 공식)
완전한 브라우저 자동화, 접근성 트리 기반이라 안정적. 브라우저 바이너리 별도 다운로드(~700MB) 필요.
Node 18+ 필요
~700MB 추가 다운로드
무료
claude mcp add playwright npx @playwright/mcp@latest
Chrome 헤드리스 CLI 스크린샷
이미 설치된 chrome.exe를 PowerShell에서 바로 호출해 정적 스크린샷 1장. 클릭·스크롤 같은 상호작용은 안 됨 — "지금 레이아웃이 어떻게 보이나"만 빠르게 볼 때.
설치 0단계
정적 스냅샷만, 상호작용 불가
chrome.exe --headless --screenshot="out.png" --window-size=1440,900 "http://localhost:5500"
Browserbase / Browserless MCP (클라우드)
호스팅된 원격 브라우저라 로컬 Node 불필요. 다만 localhost 정적 사이트에 접근하려면 별도 터널링이 필요할 수 있어 이 프로젝트엔 다소 과함.
Node 불필요 (원격)
계정·API 키 필요
결론 — /chrome이 지금 세션에서 되는지부터 확인. 안 되면 Node.js 설치가 그 다음 최선호(Chrome DevTools MCP). 둘 다 어려우면 헤드리스 스크린샷으로 정적 확인만이라도.
배포 / DevOps
git 부재가 최우선 병목
Git (winget)
먼저
GitHub에 뭘 하나 올리려 해도 이것부터 없으면 전부 막힘. 가장 먼저 해결해야 할 병목.
설치 0단계 (winget)
무료
winget install --id Git.Git -e --source winget
GitHub MCP
추천
공식 원격 MCP. 저장소 생성, 이슈/PR 관리, 커밋 분석까지. 원격(HTTP) 방식이라 Node/Docker 설치 없이 바로 등록 가능.
Node 불필요 (원격)
무료
PAT 인증 필요
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp/","headers":{"Authorization":"Bearer <PAT>"}}'
Vercel MCP
공식 원격 MCP. 배포 상태·로그 조회, 프로젝트 관리. 읽기 전용 설계라 실수로 배포를 건드릴 위험이 적음.
Node 불필요 (원격)
무료
Vercel 계정 OAuth
claude mcp add --transport http vercel https://mcp.vercel.com
로컬 정적 서버
Node 없이 파일을 http://localhost로 서빙하는 방법 두 가지 — PowerShell 자체 HttpListener 스크립트(설치 0, 직접 작성 필요) 또는 simple-http-server(winget 설치, Rust 바이너리).
Node 불필요
api/ 서버리스 함수는 별도(Vercel CLI 필요)
Doppler / 1Password 시크릿 MCP
.env 값을 안전하게 동기화해주는 전용 MCP. 지금 규모(개인 프로젝트, 키 4~5개)엔 과함 — Vercel 대시보드 환경변수로 충분.
Node 필요
유료 계정 전제
순서 — git(winget) → GitHub MCP 연결 → Vercel MCP 연결 → 환경변수는 그냥 Vercel 대시보드에서. Node는 API 라우트까지 로컬 테스트하고 싶을 때만.
디자인 / 접근성 / 성능
대부분 Node 필요, 예외 있음
Chrome DevTools MCP
추천
Google 공식. 이미 설치된 Chrome 150을 그대로 자동화 — 스크린샷, Lighthouse 감사(성능/SEO/접근성), 콘솔 로그, 뷰포트 크기 조절(반응형 확인)까지 하나로 커버.
Node.js 20.19+ 필요
무료·API 키 불필요
Windows 지원
claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest
Chrome 내장 Lighthouse 패널
DevTools → Lighthouse 탭. 자동화는 안 되지만 설치가 아예 필요 없어서 지금 당장 수동으로 쓸 수 있음.
설치 0단계
수동 조작만, MCP 아님
WAVE (브라우저 확장 / 웹 버전)
색상 대비, ARIA, 대체텍스트를 화면에 바로 오버레이. wave.webaim.org는 확장 설치조차 필요 없음 — URL만 넣으면 됨.
설치 0단계
무료
수동 조작만
Figma MCP (공식)
Figma 파일의 레이아웃/변수를 코드로 가져오는 원격 MCP. 이 프로젝트는 Figma 원본 없이 코드로 바로 만들었기 때문에 지금은 활용도 낮음.
Node 불필요 (원격)
Figma 파일이 있어야 의미 있음
Stylelint / Style Dictionary
색상·간격 하드코딩을 잡아내는 CSS 린터, 디자인 토큰 관리 도구. 빌드 없는 프로젝트라 지금 도입하기엔 이름.
Node 필요
지금은 과함
지금 당장은 WAVE 웹 버전 + Chrome Lighthouse 패널(둘 다 설치 0)로 수동 점검하고, Node를 설치하게 되면 Chrome DevTools MCP로 승격하는 게 자연스러운 순서.
이미지 / 에셋
API 직접 호출이 MCP보다 빠름
Pexels API
추천
사진 + 영상을 키 하나로 검색·다운로드. MCP도 Node도 필요 없이 PowerShell에서 바로 호출 가능 — 지금 하던 "Unsplash 페이지 찾고 URL 확인" 수작업을 스크립트 한 줄로 대체.
설치 0단계
무료 (200req/시간)
저작자 표시 불필요
Invoke-RestMethod "https://api.pexels.com/v1/search?query=technology" -Headers @{Authorization="KEY"}
Iconify (CDN 한 줄)
추천
30만+ 아이콘(Lucide·Heroicons·Phosphor 포함)을 스크립트 태그 하나로. 지금 쓰고 있는 이모지 아이콘(🔍📄🔒)을 진짜 SVG 아이콘으로 바꿀 수 있는 가장 저렴한 방법.
설치 0단계
대부분 MIT/무료
<iconify-icon icon="lucide:search"></iconify-icon>
Coverr API
"ai-technology" 같은 카테고리가 실제로 있어서 히어로 배경 영상(지금 Big Buck Bunny로 임시로 쓴 것)을 톤에 맞는 걸로 교체하기 좋음. 진짜 API라 자동화 가능.
설치 0단계
무료·상업적 사용 가능
Unsplash / Pixabay API
Pexels과 비슷한 스톡 사진 API. 이미 Unsplash는 수동으로 써봤음 — API 키 발급받으면 이것도 자동화 가능.
설치 0단계
무료 티어 있음
AI 이미지 생성 (DALL·E / Stability / Flux MCP)
텍스트로 커스텀 일러스트 생성. 지금은 스톡 사진으로 충분해서 과함 — 브랜드 톤이 더 뚜렷해지면 그때 고려.
Node 필요
유료 API
지금 당장 Pexels API 키 하나만 발급받으면(몇 분 걸림) 사진·영상 검색·다운로드가 전부 스크립트로 자동화됨. Iconify는 그냥 스크립트 태그 추가만 하면 끝.
Claude Code 스킬 생태계
이 환경과 전제가 정확히 맞는 것 하나 있음
seo-skill (aevans-eng)
추천
"빌드 도구 없는 정적 사이트"를 정확히 이 프로젝트와 같은 전제로 만들어진 SEO 점검 스킬. 메타태그·OG·JSON-LD·sitemap 9개 항목 감사. 파일 하나 복사가 설치의 전부.
설치 0단계
외부 의존성 없음
저장소 커밋 1개뿐(신생)
SKILL.md → ~/.claude/skills/seo/SKILL.md 로 복사
frontend-design (anthropics/skills 공식)
타이포그래피·색상·레이아웃·모션을 주제에 맞게 설계하도록 돕는 Anthropic 공식 스킬. 순수 HTML/CSS/JS에 바로 적용 가능하다고 SKILL.md에 명시돼 있음(직접 확인함).
설치 0단계
공식·신뢰도 높음
/plugin marketplace add anthropics/skills
webapp-testing (공식) / microsoft/playwright-mcp
스크린샷·반응형 뷰포트 검증엔 가장 강력하지만 Playwright(및 후자는 Node.js)가 전제 — 지금 논의 중인 "브라우저를 보는 문제"의 정공법이지만 설치 비용이 있음.
Node.js + Playwright 필요
무료
awesome-claude-code-subagents (VoltAgent)
154개 서브에이전트 모음, 23.1k 스타로 활발함. frontend-developer, ui-ux-tester 등 웹 QA 관련 에이전트 정의를 파일만 복사해서 바로 씀.
설치 0단계 (.claude/agents/에 복사)
지금 당장 seo-skill과 frontend-design 둘 다 설치 마찰이 사실상 0(파일 복사뿐)이라 가장 먼저 넣어볼 만함. webapp-testing은 Node 설치 여부가 정해지면 그때 같이 들어오면 됨.
조사 방법 — 5개 리서치 에이전트를 영역별로 병렬 실행, 각자 실제 웹 검색·저장소 확인으로 얻은 것만 반영했습니다. 존재가 확인되지 않은 도구는 포함하지 않았고, 세부 내용까지 확인하지 못한 항목은 원본 에이전트 결과에 "확인 안 됨"으로 표시돼 있습니다.