const products = require("../data/products.json");

// 건강 고민 → 추천 성분군 매핑
const CONCERN_INGREDIENT_MAP = {
  피로: ["비타민B", "마그네슘", "코엔자임Q10"],
  수면: ["마그네슘", "테아닌"],
  "눈 건강": ["루테인", "지아잔틴", "오메가3"],
  "장 건강": ["유산균", "프리바이오틱스"],
  피부: ["콜라겐", "비타민C", "히알루론산"],
  혈당: ["바나바잎추출물", "크롬"],
  관절: ["MSM", "글루코사민", "비타민D"],
  다이어트: ["가르시니아", "녹차추출물", "크롬"],
  면역: ["비타민C", "아연", "비타민D"],
};

// 기타(직접 입력) 고민일 때 기본 후보 성분군
const DEFAULT_INGREDIENTS = ["비타민C", "비타민D", "종합비타민"];

// 복용 루틴 텍스트에서 인식할 영양제 키워드 사전
const ROUTINE_KEYWORDS = {
  종합비타민: ["종합비타민", "멀티비타민", "멀티비타민미네랄", "종합 비타민", "멀티 비타민"],
  오메가3: ["오메가3", "오메가-3", "오메가 3", "피쉬오일", "어유", "epa", "dha"],
  유산균: ["유산균", "프로바이오틱스", "락토", "프리바이오틱스"],
  비타민C: ["비타민c", "비타민씨", "비타민 c"],
  비타민D: ["비타민d", "비타민디", "비타민 d"],
  비타민B: ["비타민b", "비타민비", "비타민 b", "비콤"],
  마그네슘: ["마그네슘"],
  루테인: ["루테인", "지아잔틴"],
  콜라겐: ["콜라겐"],
  칼슘: ["칼슘"],
  철분: ["철분"],
  아연: ["아연"],
  밀크씨슬: ["밀크씨슬", "밀크시슬", "실리마린"],
  코엔자임Q10: ["코엔자임", "코큐텐", "coq10"],
  테아닌: ["테아닌"],
  글루코사민: ["글루코사민", "msm"],
  가르시니아: ["가르시니아"],
};

// 복용 중인 영양제가 어떤 성분 카테고리를 "이미 커버"하는지
// level: high(중복 가능성 있음) / medium(주의 필요)
const ROUTINE_COVERAGE = {
  종합비타민: {
    high: ["비타민B", "종합비타민"],
    medium: ["비타민C", "비타민D", "아연", "마그네슘"],
  },
  오메가3: { high: ["오메가3"], medium: [] },
  유산균: { high: ["유산균", "프리바이오틱스"], medium: [] },
  비타민C: { high: ["비타민C"], medium: ["종합비타민"] },
  비타민D: { high: ["비타민D"], medium: ["종합비타민"] },
  비타민B: { high: ["비타민B"], medium: ["종합비타민"] },
  마그네슘: { high: ["마그네슘"], medium: [] },
  루테인: { high: ["루테인", "지아잔틴"], medium: [] },
  콜라겐: { high: ["콜라겐"], medium: [] },
  아연: { high: ["아연"], medium: ["종합비타민"] },
  코엔자임Q10: { high: ["코엔자임Q10"], medium: [] },
  테아닌: { high: ["테아닌"], medium: [] },
  글루코사민: { high: ["글루코사민", "MSM"], medium: [] },
  가르시니아: { high: ["가르시니아"], medium: [] },
  칼슘: { high: ["칼슘"], medium: [] },
  철분: { high: ["철분"], medium: [] },
  밀크씨슬: { high: ["밀크씨슬"], medium: [] },
};

const OVERLAP_LEVELS = {
  high: "중복 가능성 있음",
  medium: "주의 필요",
  low: "비교적 중복 낮음",
};

// 예산 옵션 → 가격 범위
const BUDGET_RANGES = {
  "2만원 이하": { min: 0, max: 20000 },
  "2-4만원": { min: 20000, max: 40000 },
  "4-6만원": { min: 40000, max: 60000 },
  상관없음: null,
};

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

// 자유 입력 텍스트 → 인식된 영양제 목록
function parseRoutine(text) {
  const normalized = normalize(text);
  if (!normalized) return [];
  const found = [];
  for (const [name, aliases] of Object.entries(ROUTINE_KEYWORDS)) {
    if (aliases.some((alias) => normalized.includes(normalize(alias)))) {
      found.push(name);
    }
  }
  return found;
}

function getRecommendedIngredients(concern) {
  return CONCERN_INGREDIENT_MAP[concern] || DEFAULT_INGREDIENTS;
}

// 제품 성분이 특정 성분 카테고리에 해당하는지 (부분 일치)
function productHasIngredient(product, ingredientName) {
  const target = normalize(ingredientName);
  const haystack = [product.category, ...(product.ingredients || [])].map(normalize);
  return haystack.some((h) => h.includes(target) || target.includes(h));
}

// 복용 루틴 대비 제품 중복도 평가
function checkOverlap(routine, product) {
  let level = "low";
  const reasons = [];
  for (const item of routine) {
    const coverage = ROUTINE_COVERAGE[item];
    if (!coverage) continue;
    const highHit = coverage.high.find((ing) => productHasIngredient(product, ing));
    if (highHit) {
      level = "high";
      reasons.push(`현재 복용 중인 ${item}와(과) ${highHit} 성분이 겹칠 수 있어요.`);
      continue;
    }
    const mediumHit = coverage.medium.find((ing) => productHasIngredient(product, ing));
    if (mediumHit && level !== "high") {
      level = "medium";
      reasons.push(`현재 복용 중인 ${item}에 ${mediumHit} 성분이 포함되어 있다면 총 섭취량 확인이 필요해요.`);
    }
  }
  return { level, label: OVERLAP_LEVELS[level], reasons };
}

// 루틴 전체에 대한 안내 메시지 (제품과 무관한 일반 경고)
function buildRoutineWarnings(routine, concern) {
  const warnings = [];
  if (routine.includes("종합비타민")) {
    warnings.push(
      "현재 종합비타민을 복용 중이라면 비타민B·비타민D 등 개별 비타민 제품은 성분이 겹칠 수 있어요. 제품 라벨의 함량을 꼭 확인하세요."
    );
  }
  if (routine.includes("오메가3")) {
    warnings.push("이미 오메가3를 복용 중이라면 오메가3 제품을 추가로 구매할 필요는 낮아요.");
  }
  if (routine.includes("유산균")) {
    warnings.push("이미 유산균을 복용 중이라면 유산균 제품을 추가하는 것은 중복일 수 있어요.");
  }
  // 복용 중인 영양제가 이번 고민의 추천 성분군과 직접 겹치는 경우
  const recommended = getRecommendedIngredients(concern);
  for (const item of routine) {
    if (["종합비타민", "오메가3", "유산균"].includes(item)) continue; // 위에서 처리됨
    const coverage = ROUTINE_COVERAGE[item];
    if (!coverage) continue;
    const hit = coverage.high.find((ing) =>
      recommended.some((r) => normalize(r).includes(normalize(ing)) || normalize(ing).includes(normalize(r)))
    );
    if (hit) {
      warnings.push(
        `현재 ${item}을(를) 복용 중이라면 ${hit} 함유 제품은 성분이 겹칠 수 있어요. 같은 고민이라도 다른 성분 제품을 먼저 비교해보는 것이 좋습니다.`
      );
    }
  }
  if (routine.length === 0) {
    warnings.push("현재 복용 중인 영양제가 없다면 한 가지 제품부터 시작해 몸의 반응을 확인하는 것을 권장해요.");
  }
  if (concern === "혈당") {
    warnings.push("혈당 관련 약을 복용 중이라면 구매 전 반드시 의사·약사와 상담하세요.");
  }
  return warnings;
}

// 선호 옵션 매칭
function matchesPreference(product, preference, overlapLevel) {
  switch (preference) {
    case "가성비":
      return product.pricePerDay <= 400 || (product.attributes || []).includes("가성비");
    case "리뷰 신뢰도":
      return product.reviewCount >= 3000 && product.rating >= 4.5;
    case "성분 함량":
      return (product.attributes || []).includes("고함량");
    case "복용 편의성":
      return (product.attributes || []).includes("간편복용");
    case "기존 영양제와 안 겹치는 것":
      return overlapLevel === "low";
    default:
      return false;
  }
}

function withinBudget(product, budget) {
  const range = BUDGET_RANGES[budget];
  if (!range) return true; // 상관없음
  return product.price >= range.min && product.price <= range.max;
}

// 핵심: 규칙 기반 점수 계산 → 상위 후보 반환
function scoreProducts(profile) {
  const { concern, budget, preference } = profile;
  const routine = parseRoutine(profile.currentSupplements);
  const recommendedIngredients = getRecommendedIngredients(concern);

  const scored = products.map((product) => {
    let score = 0;
    const scoreReasons = [];

    if ((product.concerns || []).includes(concern)) {
      score += 40;
      scoreReasons.push("고민 적합 +40");
    }
    if (recommendedIngredients.some((ing) => productHasIngredient(product, ing))) {
      score += 25;
      scoreReasons.push("추천 성분 포함 +25");
    }
    if (withinBudget(product, budget)) {
      score += 15;
      scoreReasons.push("예산 적합 +15");
    }

    const overlap = checkOverlap(routine, product);
    if (overlap.level === "high") {
      score -= 20;
      scoreReasons.push("복용 루틴과 중복 -20");
    } else if (overlap.level === "medium") {
      score -= 10;
      scoreReasons.push("복용 루틴과 일부 중복 주의 -10");
    }

    if (matchesPreference(product, preference, overlap.level)) {
      score += 10;
      scoreReasons.push("선호 조건 일치 +10");
    }

    return { product, score, scoreReasons, overlap };
  });

  const candidates = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  return { routine, recommendedIngredients, candidates };
}

// 상위 제품에 붙일 배지 계산
function buildBadges(candidate, profile) {
  const { product, overlap } = candidate;
  const badges = [];
  if ((product.concerns || []).includes(profile.concern)) badges.push("고민 적합");
  if (overlap.level === "low") badges.push("중복 낮음");
  if (product.pricePerDay <= 400) badges.push("가성비 좋음");
  if (product.reviewCount < 1500) badges.push("리뷰 신뢰도 확인 필요");
  if (overlap.level !== "low") badges.push("성분 함량 확인 필요");
  return badges;
}

// 비용 계산: 총 가격 / 섭취 일수 / 하루 비용 / 월 비용
function buildCost(product) {
  const perDayCountMatch = String(product.dosage).match(/1일\s*(\d+)/);
  const dailyCount = perDayCountMatch ? parseInt(perDayCountMatch[1], 10) : 1;
  const days = Math.floor(product.count / dailyCount);
  const perDay = product.pricePerDay || Math.round(product.price / days);
  const monthly = perDay * 30;
  return {
    totalPrice: product.price,
    count: product.count,
    estimatedDays: days,
    pricePerDay: perDay,
    monthlyCost: monthly,
    text: `하루 기준 약 ${perDay.toLocaleString("ko-KR")}원, 월 기준 약 ${monthly.toLocaleString("ko-KR")}원`,
  };
}

const DISCLAIMER =
  "이 결과는 의료 진단이 아니라 구매 판단을 돕기 위한 정보입니다. 건강 상태가 걱정되거나 약을 복용 중이라면 전문가와 상담하세요.";

// AI 호출 실패 시에도 동일한 형태의 결과를 만들어 주는 규칙 기반 폴백
function buildFallbackResult(profile, scoring) {
  const { routine, recommendedIngredients, candidates } = scoring;
  const top3 = candidates.slice(0, 3);

  const topProducts = top3.map((candidate, index) => {
    const { product, overlap } = candidate;
    const reasonParts = [
      `${profile.concern} 고민과 관련된 ${product.category} 계열 제품이에요.`,
    ];
    if (overlap.level === "low") {
      reasonParts.push("입력하신 복용 루틴과 큰 중복 없이 추가할 수 있어요.");
    } else {
      reasonParts.push(overlap.reasons[0] || "복용 루틴과 일부 성분이 겹칠 수 있어요.");
    }
    reasonParts.push(`하루 약 ${candidate.product.pricePerDay.toLocaleString("ko-KR")}원 수준의 비용이에요.`);

    return {
      productId: product.id,
      rank: index + 1,
      recommendationReason: reasonParts.join(" "),
      bestFor: product.bestFor,
      caution:
        overlap.level === "low"
          ? product.warnings[0] || "라벨의 섭취 시 주의사항을 확인하세요."
          : overlap.reasons[0],
      confidenceScore: Math.round(Math.min(95, 55 + candidate.score / 2)),
    };
  });

  return {
    summary: `${profile.concern} 고민에는 보통 ${recommendedIngredients.join(", ")} 계열 제품이 후보가 될 수 있어요. 입력하신 조건(예산 ${profile.budget}, 우선순위 ${profile.preference})과 현재 복용 루틴을 기준으로 후보를 ${topProducts.length}개로 압축했습니다.`,
    recommendedIngredients,
    routineWarnings: buildRoutineWarnings(routine, profile.concern),
    topProducts,
    finalAdvice:
      "이 제품이 무조건 좋다는 뜻은 아니며, 현재 입력한 조건 기준의 추천입니다. 구매 전 제품 라벨의 성분 함량을 한 번 더 확인하세요.",
    disclaimer: DISCLAIMER,
  };
}

function getProductById(id) {
  return products.find((p) => p.id === id);
}

module.exports = {
  CONCERN_INGREDIENT_MAP,
  DISCLAIMER,
  parseRoutine,
  getRecommendedIngredients,
  checkOverlap,
  buildRoutineWarnings,
  scoreProducts,
  buildBadges,
  buildCost,
  buildFallbackResult,
  getProductById,
  products,
};
