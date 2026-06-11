require("dotenv").config();
const express = require("express");
const cors = require("cors");

const productsRouter = require("./routes/products");
const recommendRouter = require("./routes/recommend");
const crawlRouter = require("./routes/crawl");

const app = express();
const PORT = process.env.PORT || 5001;

// CORS: 로컬 개발 + 배포된 프론트엔드 출처 허용
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS 정책에 의해 차단된 출처입니다."));
    },
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "영양제핏 API", time: new Date().toISOString() });
});

app.use("/api/products", productsRouter);
app.use("/api/recommend", recommendRouter);
app.use("/api/crawl", crawlRouter);

app.listen(PORT, () => {
  console.log(`영양제핏 서버 실행 중: http://localhost:${PORT}`);
});
