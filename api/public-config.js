// api/public-config.js
// ─────────────────────────────────────────────────────────────
// 브라우저에 전달해도 되는 "공개" 설정값을 런타임에 넘긴다.
//
// 왜 있나: GOOGLE_API_KEY는 client-side 키라 브라우저엔 어차피 노출되지만(숨길 수 없음),
//   공개 GitHub 리포에 커밋된 채로 두면 시크릿 스캐너(GitGuardian/Google)가 계속 flag한다.
//   그래서 키를 config.js에서 빼서 Vercel 환경변수(GOOGLE_API_KEY)에 두고, 여기서 전달한다.
//   → 리포엔 키가 없다. (브라우저 런타임 노출은 client-side 키의 본질이라 불가피)
//
// 값이 없으면 빈 문자열 — 프론트는 드라이브 버튼을 '설정 필요'로 비활성 처리(폴백).
// ─────────────────────────────────────────────────────────────

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).json({
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    tossClientKey: process.env.TOSS_CLIENT_KEY || '',   // 토스 클라이언트 키(공개값)
    // 진단용: 시크릿 키는 값을 노출하지 않고 "설정 여부"만 boolean으로 알린다(서버 전용 값 보호).
    tossSecretConfigured: !!process.env.TOSS_SECRET_KEY,
    // 사업자정보(전자상거래법상 사이트에 공개 표시가 의무인 값) — env에서 읽어 푸터에 표시.
    // 리포에 커밋하지 않고 Vercel 환경변수로 관리. 비면 푸터는 "[…준비중]" 플레이스홀더.
    business: {
      company:     process.env.BIZ_COMPANY || '시티델(citidel)',
      ceo:         process.env.BIZ_CEO || process.env.BIZ_NAME || '윤태훈',
      bizNo:       process.env.BIZ_NO || '771-26-02153',
      mailOrderNo: process.env.BIZ_MAIL_ORDER_NO || '',
      address:     process.env.BIZ_ADDRESS || '서울특별시 금천구 시흥대로 291',
      email:       process.env.BIZ_EMAIL || 's01090533790@gmail.com',
      phone:       process.env.BIZ_PHONE || '',
    },
  });
}
