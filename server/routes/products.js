const express = require("express");
const { products } = require("../services/recommendationRules");

const router = express.Router();

// GET /api/products — 로컬 시드 제품 DB 반환
router.get("/", (req, res) => {
  res.json({ count: products.length, products });
});

module.exports = router;
