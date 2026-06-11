// 크롤러 단독 실행 스크립트: npm run crawl
// 공개 위키백과 성분 페이지를 수집해 data/crawled-products.json 캐시를 갱신합니다.
const { runCrawl } = require("../services/crawlerService");

runCrawl()
  .then((result) => {
    console.log(`크롤링 완료: ${result.items.length}개 페이지 수집 (source: ${result.source})`);
    if (result.failures?.length) {
      console.log("실패한 URL:");
      result.failures.forEach((f) => console.log(` - ${f.url}: ${f.error}`));
    }
  })
  .catch((error) => {
    console.error("크롤링 실패:", error.message);
    process.exit(1);
  });
