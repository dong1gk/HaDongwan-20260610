const express = require("express");
const { runCrawl, readCache } = require("../services/crawlerService");

const router = express.Router();

// GET /api/crawl/sample — 캐시된 크롤링 데이터 반환 (?refresh=true 시 라이브 크롤링)
router.get("/sample", async (req, res) => {
  try {
    if (req.query.refresh === "true") {
      const data = await runCrawl();
      return res.json(data);
    }
    res.json(readCache());
  } catch (error) {
    res.status(500).json({ error: "크롤링 데이터를 불러오지 못했습니다.", detail: error.message });
  }
});

// POST /api/crawl — 라이브 크롤링 실행 후 캐시 갱신
router.post("/", async (req, res) => {
  try {
    const data = await runCrawl();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "크롤링 실행에 실패했습니다.", detail: error.message });
  }
});

module.exports = router;
