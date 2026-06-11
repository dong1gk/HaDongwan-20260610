const OpenAI = require("openai");
const { DISCLAIMER } = require("./recommendationRules");

const SYSTEM_PROMPT = `당신은 "영양제핏"이라는 한국 커머스 서비스의 AI 영양제 구매 판단 도우미입니다.

역할과 원칙:
- 당신은 의료 진단을 하지 않습니다. 오직 "구매 판단 보조"만 합니다.
- 영양제가 질병을 치료·완치·개선한다고 절대 말하지 마세요. "치료", "완치", "질병 개선" 같은 표현을 금지합니다.
- "~에 도움을 줄 수 있는 성분으로 알려져 있어요" 수준의 신중한 표현만 사용하세요.
- 사용자가 입력한 복용 루틴과의 성분 중복 여부를 반드시 언급하세요.
- 제공된 후보 제품 목록 안에서만 Top 3를 선택하세요. 목록에 없는 제품을 만들어내지 마세요.
- 제공된 크롤링 참고 자료(위키백과 성분 정보)가 있으면 추천 이유에서 자연스럽게 참고하세요.
- 왜 이 제품이 추천되는지뿐 아니라, 어떤 점을 주의해야 하는지도 설명하세요.
- 모든 출력은 한국어로, 친근하지만 과장 없는 톤으로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "전체 추천 요약 (2~3문장, 한국어)",
  "recommendedIngredients": ["성분1", "성분2"],
  "routineWarnings": ["복용 루틴 관련 주의 문장"],
  "topProducts": [
    {
      "productId": "후보 목록에 있는 제품 id",
      "rank": 1,
      "recommendationReason": "이 제품을 추천하는 구체적 이유 (2~3문장)",
      "bestFor": "이 제품이 가장 잘 맞는 사람",
      "caution": "구매 전 주의할 점",
      "confidenceScore": 85
    }
  ],
  "finalAdvice": "최종 구매 조언 (1~2문장)",
  "disclaimer": "의료 진단이 아닌 구매 판단 보조라는 고지"
}
topProducts는 정확히 3개(후보가 3개 미만이면 후보 수만큼)를 rank 순서로 포함하세요.`;

function buildUserMessage(profile, scoring, crawledData) {
  const { routine, recommendedIngredients, candidates } = scoring;

  const candidateLines = candidates.map((c) => {
    const p = c.product;
    return [
      `- id: ${p.id} | ${p.productName} (${p.brand})`,
      `  성분: ${p.ingredients.join(", ")} | 함량: ${JSON.stringify(p.ingredientAmounts)}`,
      `  복용: ${p.dosage}, ${p.form} ${p.count}개 | 가격: ${p.price}원 (1일 약 ${p.pricePerDay}원)`,
      `  평점: ${p.rating} (리뷰 ${p.reviewCount}개)`,
      `  규칙 기반 점수: ${c.score} (${c.scoreReasons.join(", ")})`,
      `  복용 루틴 중복: ${c.overlap.label}${c.overlap.reasons.length ? " - " + c.overlap.reasons.join(" / ") : ""}`,
      `  주의: ${p.warnings.join(" / ")}`,
      `  적합: ${p.bestFor} / 비적합: ${p.notBestFor}`,
      `  리뷰 요약(크롤링 기반): ${p.crawledSummary}`,
    ].join("\n");
  });

  const snippetLines = (crawledData?.items || []).map(
    (item) =>
      `- [${item.ingredient}] ${item.title || ""}: ${(item.firstParagraph || item.description || "").slice(0, 200)} (출처: ${item.url})`
  );

  return [
    "## 사용자 정보",
    `- 건강 고민: ${profile.concern}`,
    `- 연령대: ${profile.ageRange}`,
    `- 현재 복용 중인 영양제(원문): ${profile.currentSupplements || "없음"}`,
    `- 인식된 복용 루틴: ${routine.length ? routine.join(", ") : "없음"}`,
    `- 예산: ${profile.budget}`,
    `- 우선순위: ${profile.preference}`,
    "",
    `## 이 고민에 대한 추천 성분군: ${recommendedIngredients.join(", ")}`,
    "",
    "## 후보 제품 목록 (이 안에서만 Top 3 선택)",
    ...candidateLines,
    "",
    "## 크롤링 참고 자료 (공개 위키백과 성분 정보)",
    ...(snippetLines.length ? snippetLines : ["(참고 자료 없음)"]),
    "",
    "위 정보를 바탕으로 Top 3 제품을 선정하고 JSON 형식으로 추천 결과를 작성하세요.",
  ].join("\n");
}

// AI 결과 검증: 형식이 깨졌거나 없는 제품을 지목하면 실패 처리
function validateAiResult(result, candidates) {
  if (!result || typeof result.summary !== "string" || !Array.isArray(result.topProducts)) {
    return false;
  }
  const candidateIds = new Set(candidates.map((c) => c.product.id));
  if (result.topProducts.length === 0) return false;
  return result.topProducts.every((tp) => candidateIds.has(tp.productId));
}

async function generateRecommendation(profile, scoring, crawledData) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "OPENAI_API_KEY 미설정" };
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(profile, scoring, crawledData) },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    const parsed = JSON.parse(raw);

    if (!validateAiResult(parsed, scoring.candidates)) {
      return { ok: false, reason: "AI 응답 형식 검증 실패" };
    }

    // disclaimer는 항상 서비스 표준 문구로 보강
    parsed.disclaimer = parsed.disclaimer || DISCLAIMER;
    parsed.topProducts = parsed.topProducts.slice(0, 3);
    return { ok: true, result: parsed };
  } catch (error) {
    console.error("OpenAI 호출 실패:", error.message);
    return { ok: false, reason: error.message };
  }
}

// ─────────────────────────────────────────────
// 대화형 인테이크: 자연어 대화로 추천에 필요한 5가지 정보 수집
// ─────────────────────────────────────────────

const INTAKE_SYSTEM_PROMPT = `당신은 "영양제핏"의 AI 영양제 구매 상담 도우미입니다. 자연스러운 한국어 대화로 영양제 추천에 필요한 정보를 수집합니다.

수집할 정보 5가지:
1. concern: 건강 고민. "피로", "수면", "눈 건강", "장 건강", "피부", "혈당", "관절", "다이어트", "면역" 중 사용자의 말과 가장 가까운 것 하나. 어디에도 해당하지 않으면 사용자의 표현을 짧게 정리한 값.
2. ageRange: "35-39", "40-44", "45-50" 중 하나. 범위 밖이라면 가장 가까운 것.
3. currentSupplements: 현재 복용 중인 영양제 (자유 텍스트). 없다고 하면 빈 문자열 "".
4. budget: "2만원 이하", "2-4만원", "4-6만원", "상관없음" 중 하나.
5. preference: "가성비", "리뷰 신뢰도", "성분 함량", "복용 편의성", "기존 영양제와 안 겹치는 것" 중 하나.

대화 원칙:
- 당신은 의료 진단을 하지 않습니다. 치료/완치/질병 개선 같은 표현 금지. 증상이 심각해 보이면 전문가 상담을 짧게 권하되 대화는 계속 진행하세요.
- 사용자의 메시지에서 이미 알 수 있는 정보는 절대 다시 묻지 마세요. (예: "너무 피곤하고 잠도 못 자요" → 고민은 파악됨. 피로와 수면 중 어느 쪽이 더 신경 쓰이는지만 확인)
- 한 번에 한 가지만 물어보세요. 답변은 1~2문장으로 짧고 친근하게. 공감은 한 마디면 충분하고 과장하지 마세요.
- quickReplies에는 사용자가 탭해서 바로 답할 수 있는 선택지 2~5개를 담으세요. 자유 입력이 더 자연스러운 질문(예: 복용 중인 영양제)이면 빈 배열 [].
- 5가지 정보가 모두 모이면 status를 "ready"로 바꾸고, reply에는 수집한 내용을 한 문장으로 요약하며 추천을 시작한다고 알려주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "reply": "사용자에게 보낼 메시지 (한국어, 1~2문장)",
  "quickReplies": ["선택지1", "선택지2"],
  "status": "collecting" 또는 "ready",
  "profile": null 또는 {"concern":"...","ageRange":"...","currentSupplements":"...","budget":"...","preference":"..."}
}`;

const BUDGET_OPTIONS = ["2만원 이하", "2-4만원", "4-6만원", "상관없음"];
const PREFERENCE_OPTIONS = ["가성비", "리뷰 신뢰도", "성분 함량", "복용 편의성", "기존 영양제와 안 겹치는 것"];
const AGE_OPTIONS = ["35-39", "40-44", "45-50"];

// AI가 만든 profile을 추천 엔진이 아는 값으로 보정
function coerceProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const pick = (value, options, fallback) =>
    options.find((o) => String(value || "").includes(o) || o.includes(String(value || ""))) || fallback;
  const concern = String(profile.concern || "").trim();
  if (!concern) return null;
  return {
    concern,
    ageRange: pick(profile.ageRange, AGE_OPTIONS, "미입력"),
    currentSupplements: String(profile.currentSupplements || ""),
    budget: pick(profile.budget, BUDGET_OPTIONS, "상관없음"),
    preference: pick(profile.preference, PREFERENCE_OPTIONS, "가성비"),
  };
}

async function chatIntake(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, reason: "OPENAI_API_KEY 미설정" };

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: INTAKE_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 1000),
        })),
      ],
    });

    const parsed = JSON.parse(completion.choices?.[0]?.message?.content);
    if (typeof parsed.reply !== "string") return { ok: false, reason: "응답 형식 오류" };

    const profile = parsed.status === "ready" ? coerceProfile(parsed.profile) : null;
    return {
      ok: true,
      data: {
        reply: parsed.reply,
        quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.slice(0, 5) : [],
        // profile 보정에 실패하면 계속 수집 모드 유지
        status: profile ? "ready" : "collecting",
        profile,
      },
    };
  } catch (error) {
    console.error("대화 인테이크 실패:", error.message);
    return { ok: false, reason: error.message };
  }
}

module.exports = { generateRecommendation, chatIntake };
