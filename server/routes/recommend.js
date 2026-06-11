const express = require("express");
const {
  scoreProducts,
  buildFallbackResult,
  buildBadges,
  buildCost,
  buildRoutineWarnings,
  getProductById,
} = require("../services/recommendationRules");
const { readCache, matchSnippetsToProducts } = require("../services/crawlerService");
const { generateRecommendation } = require("../services/openaiService");

const router = express.Router();

const CONCERN_OPTIONS = new Set([
  "피로", "수면", "눈 건강", "장 건강", "피부", "혈당", "관절", "다이어트", "면역",
]);

// POST /api/recommend — 규칙 기반 후보 압축 + AI 추천 설명 생성
router.post("/", async (req, res) => {
  const { concern, ageRange, currentSupplements = "", budget, preference, chatTranscript } = req.body || {};

  if (!concern || !budget || !preference) {
    return res.status(400).json({ error: "concern, budget, preference는 필수 항목입니다." });
  }

  // "기타 직접 입력"은 자유 텍스트 고민으로 처리
  const profile = {
    concern: CONCERN_OPTIONS.has(concern) ? concern : concern,
    ageRange: ageRange || "미입력",
    currentSupplements,
    budget,
    preference,
  };

  try {
    // 1) 규칙 기반: 루틴 파싱 + 점수 계산 + 후보 5~7개 압축
    const scoring = scoreProducts(profile);

    if (scoring.candidates.length === 0) {
      return res.status(200).json({
        aiGenerated: false,
        noResult: true,
        message:
          "입력하신 조건에 맞는 후보를 찾지 못했어요. 예산을 '상관없음'으로 바꾸거나 고민을 다시 선택해보세요.",
      });
    }

    // 2) 크롤링 데이터 로드 (캐시 우선)
    const crawledData = readCache();

    // 3) AI 추천 설명 생성, 실패 시 규칙 기반 폴백
    // 대화로 들어온 경우 상담 내용을 함께 전달해 더 개인화된 설명 생성
    const ai = await generateRecommendation(profile, scoring, crawledData, chatTranscript);
    const aiGenerated = ai.ok;
    const core = ai.ok ? ai.result : buildFallbackResult(profile, scoring);

    // 4) AI가 고른 productId를 실제 제품 데이터와 병합
    const topProducts = core.topProducts
      .map((tp) => {
        const candidate = scoring.candidates.find((c) => c.product.id === tp.productId);
        const product = getProductById(tp.productId);
        if (!product || !candidate) return null;
        return {
          ...tp,
          product,
          badges: buildBadges(candidate, profile),
          overlap: candidate.overlap,
          cost: buildCost(product),
        };
      })
      .filter(Boolean);

    // 5) 상위 제품과 매칭되는 크롤링 스니펫
    const matchedSnippets = matchSnippetsToProducts(
      topProducts.map((tp) => tp.product),
      crawledData
    );

    res.json({
      aiGenerated,
      fallbackNotice: aiGenerated
        ? null
        : "AI 응답 생성에 실패하여 규칙 기반 추천을 표시합니다.",
      profile,
      routineAnalysis: {
        parsedRoutine: scoring.routine,
        warnings: core.routineWarnings?.length
          ? core.routineWarnings
          : buildRoutineWarnings(scoring.routine, profile.concern),
      },
      summary: core.summary,
      recommendedIngredients: core.recommendedIngredients,
      topProducts,
      candidates: scoring.candidates.map((c) => ({
        productId: c.product.id,
        productName: c.product.productName,
        score: c.score,
        overlapLabel: c.overlap.label,
      })),
      finalAdvice: core.finalAdvice,
      disclaimer: core.disclaimer,
      crawledReferences: {
        source: crawledData.source,
        crawledAt: crawledData.crawledAt,
        fallbackMessage: crawledData.fallbackMessage || null,
        byProduct: matchedSnippets,
      },
    });
  } catch (error) {
    console.error("추천 생성 실패:", error);
    res.status(500).json({ error: "추천 생성 중 오류가 발생했습니다.", detail: error.message });
  }
});

module.exports = router;
