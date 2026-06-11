const express = require("express");
const { chatIntake } = require("../services/openaiService");

const router = express.Router();

// POST /api/chat — 대화형 인테이크. AI 사용 불가 시 aiAvailable:false 반환 → 클라이언트가 설문 폴백
router.post("/", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 배열이 필요합니다." });
  }

  try {
    // 토큰 관리를 위해 최근 24개 메시지만 사용
    const result = await chatIntake(messages.slice(-24));
    if (!result.ok) {
      return res.json({ aiAvailable: false });
    }
    res.json({ aiAvailable: true, ...result.data });
  } catch (error) {
    console.error("채팅 처리 실패:", error);
    res.status(500).json({ error: "대화 처리 중 오류가 발생했습니다.", detail: error.message });
  }
});

module.exports = router;
