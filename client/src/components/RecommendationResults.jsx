const RANK_LABELS = ["🥇 1순위", "🥈 2순위", "🥉 3순위"];

export default function RecommendationResults({ topProducts }) {
  return (
    <section className="card">
      <h2>Top 3 추천 제품</h2>
      <p className="section-sub">결정 피로를 줄이기 위해 후보를 3개로 압축했어요.</p>

      <div className="product-cards">
        {topProducts.map((tp, i) => {
          const p = tp.product;
          return (
            <article key={tp.productId} className={`product-card ${i === 0 ? "top-pick" : ""}`}>
              <div className="product-card-head">
                <span className="rank">{RANK_LABELS[i] || `${tp.rank}순위`}</span>
                <span className="confidence">적합도 {Math.round(tp.confidenceScore)}점</span>
              </div>

              <h3>{p.productName}</h3>
              <p className="brand">{p.brand}</p>

              <div className="badges">
                {tp.badges.map((b) => (
                  <span
                    key={b}
                    className={`badge ${b.includes("확인 필요") ? "badge-warn" : "badge-good"}`}
                  >
                    {b}
                  </span>
                ))}
              </div>

              <dl className="product-meta">
                <div>
                  <dt>핵심 성분</dt>
                  <dd>{p.ingredients.slice(0, 3).join(", ")}</dd>
                </div>
                <div>
                  <dt>가격</dt>
                  <dd>
                    {p.price.toLocaleString("ko-KR")}원
                    <span className="per-day"> (하루 약 {tp.cost.pricePerDay.toLocaleString("ko-KR")}원)</span>
                  </dd>
                </div>
                <div>
                  <dt>평점</dt>
                  <dd>
                    ⭐ {p.rating} <span className="review-count">리뷰 {p.reviewCount.toLocaleString("ko-KR")}개</span>
                  </dd>
                </div>
              </dl>

              <p className="reason">
                <strong>추천 이유</strong> {tp.recommendationReason}
              </p>
              <p className="caution">
                <strong>주의</strong> {tp.caution}
              </p>

              {p.productUrl && (
                <a className="buy-link" href={p.productUrl} target="_blank" rel="noreferrer">
                  올웨이즈에서 보기 ↗
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
