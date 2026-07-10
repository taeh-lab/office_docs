// api/synonyms.js
// ─────────────────────────────────────────────────────────────
// 동의어 제안 백엔드 (Vercel 서버리스 함수)
//
// 하는 일:
//   1. 브라우저에서 검색어(단어) 하나를 받는다
//   2. Groq API에 "이 단어와 비슷한 뜻의 한국어 비즈니스 용어 몇 개" 요청
//   3. 결과를 단어 배열로 정리해서 돌려준다
//
// 핵심 설계:
//   - GROQ_API_KEY 는 서버 환경변수에만 존재 → 브라우저에 절대 노출 안 됨
//   - Groq 호출이 실패하면(키 없음/한도초과/장애) 500을 던지고,
//     프론트엔드가 내장 사전으로 자동 폴백한다
//   - 모델명은 환경변수로 뺐다 → 무료 모델이 조용히 사라져도 코드 수정 없이 교체 가능
// ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS (같은 도메인에 올리면 필요 없지만, 로컬 테스트 편의를 위해)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // 키가 아예 없으면 프론트가 폴백하도록 신호
    return res.status(503).json({ error: 'no_api_key', fallback: true });
  }

  // 프론트가 업로드된 문서 내용을 훑어 추정한 문서 유형 힌트.
  // 자유 텍스트로 받으면 프롬프트 인젝션 통로가 되므로 화이트리스트로만 허용.
  const DOC_TYPE_HINTS = {
    '계약서': '계약 조항, 당사자(갑/을), 해지·손해배상 등 계약서에서 실제로 쓰이는 말 위주로',
    '견적서': '단가, 수량, 합계, 유효기간 등 견적서에서 실제로 쓰이는 말 위주로',
    '발주서': '납기, 품목, 발주처, 입고 등 발주서에서 실제로 쓰이는 말 위주로',
    '세금계산서/인보이스': '공급가액, 부가세, 전자세금계산서 등 세금계산서·인보이스에서 실제로 쓰이는 말 위주로',
  };

  let word = '';
  let docType = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    word = (body?.word || '').trim();
    const rawDocType = (body?.docType || '').trim();
    if (Object.prototype.hasOwnProperty.call(DOC_TYPE_HINTS, rawDocType)) {
      docType = rawDocType;
    }
  } catch {
    return res.status(400).json({ error: 'bad_request' });
  }
  if (!word) return res.status(400).json({ error: 'empty_word' });

  // 모델명은 환경변수로 (기본값은 Groq 무료 모델). 사라지면 여기만 바꾸면 됨.
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const domainLine = docType
    ? `- 지금 업로드된 문서는 "${docType}"로 보인다. ${DOC_TYPE_HINTS[docType]} 답해\n`
    : `- 실제 회사 문서(계약서, 견적서, 발주서 등)에서 쓰이는 말만\n`;

  const prompt =
    `너는 한국어 비즈니스 문서 용어 전문가야. ` +
    `아래 단어와 같은 문맥에서 바꿔 쓸 수 있는 유사어·동의어를 최대 6개 제시해.\n` +
    domainLine +
    `- 너무 억지스러운 확장 금지\n` +
    `- 설명 없이 JSON 배열로만 답해. 예: ["선금","착수금","선수금"]\n\n` +
    `단어: "${word}"`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('Groq error:', r.status, detail);
      // 한도초과(429)나 기타 오류 → 프론트가 폴백
      return res.status(502).json({ error: 'groq_failed', status: r.status, fallback: true });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';

    // 응답에서 JSON 배열만 안전하게 추출
    let synonyms = [];
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { synonyms = JSON.parse(match[0]); } catch { synonyms = []; }
    }
    // 정제: 문자열만, 원단어 제외, 중복 제거, 최대 6개
    synonyms = [...new Set(
      synonyms
        .filter(s => typeof s === 'string')
        .map(s => s.trim())
        .filter(s => s && s !== word)
    )].slice(0, 6);

    return res.status(200).json({ word, synonyms, source: 'groq' });

  } catch (err) {
    console.error('handler error:', err);
    return res.status(500).json({ error: 'internal', fallback: true });
  }
}
