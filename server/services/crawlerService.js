const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const CACHE_PATH = path.join(__dirname, "..", "data", "crawled-products.json");

const FALLBACK_MESSAGE =
  "일부 외부 페이지의 크롤링에 실패하여 저장된 샘플 데이터를 사용했습니다.";

// 기본 크롤링 대상: 공개된 한국어 위키백과 성분 페이지
// (로그인·유료벽·봇 차단 우회 없음, 공개 문서만 수집)
const DEFAULT_TARGETS = [
  { ingredient: "루테인", url: "https://ko.wikipedia.org/wiki/루테인" },
  { ingredient: "마그네슘", url: "https://ko.wikipedia.org/wiki/마그네슘" },
  { ingredient: "오메가3", url: "https://ko.wikipedia.org/wiki/오메가-3_지방산" },
  { ingredient: "콜라겐", url: "https://ko.wikipedia.org/wiki/콜라겐" },
  { ingredient: "비타민C", url: "https://ko.wikipedia.org/wiki/비타민_C" },
  { ingredient: "비타민D", url: "https://ko.wikipedia.org/wiki/비타민_D" },
  { ingredient: "유산균", url: "https://ko.wikipedia.org/wiki/프로바이오틱스" },
  { ingredient: "아연", url: "https://ko.wikipedia.org/wiki/아연" },
  { ingredient: "비타민B", url: "https://ko.wikipedia.org/wiki/비타민_B군" },
  { ingredient: "글루코사민", url: "https://ko.wikipedia.org/wiki/글루코사민" },
];

function getTargets() {
  const fromEnv = process.env.CRAWL_URLS;
  if (!fromEnv) return DEFAULT_TARGETS;
  return fromEnv
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({ ingredient: decodeURIComponent(url.split("/").pop() || ""), url }));
}

// 한 페이지 크롤링: 제목 / meta description / 첫 본문 문단 / 대표 이미지
async function crawlPage(target) {
  const { data: html } = await axios.get(target.url, {
    timeout: 8000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; YeongyangjeFitBot/1.0; assignment crawler for public pages)",
      "Accept-Language": "ko",
    },
  });
  const $ = cheerio.load(html);

  const title = $("title").text().trim() || null;
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    null;
  const imageUrl = $('meta[property="og:image"]').attr("content") || null;

  // 위키백과 본문에서 의미 있는 첫 문단 추출 (일반 페이지면 첫 <p>)
  let firstParagraph = null;
  $("#mw-content-text p, article p, main p, p").each((_, el) => {
    if (firstParagraph) return;
    const text = $(el).text().replace(/\[\d+\]/g, "").trim();
    if (text.length > 60) firstParagraph = text.slice(0, 400);
  });

  return {
    ingredient: target.ingredient,
    url: target.url,
    title,
    description,
    firstParagraph,
    imageUrl,
    ok: true,
  };
}

// 전체 대상 크롤링 후 캐시 파일 저장. 실패 시 캐시 폴백.
async function runCrawl() {
  const targets = getTargets();
  const results = await Promise.allSettled(targets.map(crawlPage));

  const items = [];
  const failures = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") items.push(result.value);
    else failures.push({ url: targets[i].url, error: result.reason?.message });
  });

  if (items.length === 0) {
    const cached = readCache();
    return {
      ...cached,
      source: "cache",
      fallbackMessage: FALLBACK_MESSAGE,
      failures,
    };
  }

  const payload = {
    source: "live",
    crawledAt: new Date().toISOString(),
    fallbackMessage: failures.length > 0 ? FALLBACK_MESSAGE : null,
    failures,
    items,
  };

  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2), "utf-8");
  } catch (e) {
    // 배포 환경에서 디스크 쓰기가 막혀 있어도 응답은 정상 반환
    console.warn("크롤링 캐시 저장 실패:", e.message);
  }
  return payload;
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch (e) {
    return { source: "cache", crawledAt: null, items: [], fallbackMessage: FALLBACK_MESSAGE };
  }
}

// 추천 제품의 성분과 매칭되는 크롤링 스니펫 찾기
function matchSnippetsToProducts(products, crawledData) {
  const items = crawledData?.items || [];
  const normalize = (t) => String(t || "").toLowerCase().replace(/\s+/g, "");
  return products.map((product) => {
    const haystack = [product.category, ...(product.ingredients || [])].map(normalize);
    const matched = items.filter((item) => {
      const key = normalize(item.ingredient);
      return haystack.some((h) => h.includes(key) || key.includes(h));
    });
    return { productId: product.id, snippets: matched };
  });
}

module.exports = { runCrawl, readCache, matchSnippetsToProducts, FALLBACK_MESSAGE };
