export default function TrustEvidence({ topProducts, crawledReferences }) {
  return (
    <section className="card">
      <h2>믿을 수 있는 근거 확인</h2>
      <p className="section-sub">
        리뷰 수가 많더라도 모든 후기가 실제 복용 경험을 의미하지는 않아요. 반복적으로 언급되는
        장점과 주의점을 중심으로 확인하세요.
      </p>

      {topProducts.map((tp) => {
        const p = tp.product;
        const matched = crawledReferences.byProduct.find((m) => m.productId === p.id);
        const snippets = matched?.snippets || [];
        return (
          <div key={tp.productId} className="trust-block">
            <h3>{p.productName}</h3>

            <p className="trust-summary">
              <strong>리뷰 요약</strong> {p.crawledSummary}
            </p>

            <div className="pros-cons">
              <div>
                <h4>반복적으로 나타나는 장점</h4>
                <ul>
                  {p.reviewPros.map((pro, i) => (
                    <li key={i}>👍 {pro}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>반복적으로 나타나는 단점</h4>
                <ul>
                  {p.reviewCons.map((con, i) => (
                    <li key={i}>👀 {con}</li>
                  ))}
                </ul>
              </div>
            </div>

            {p.reviewCons.some((c) => c.includes("광고") || c.includes("체험단")) && (
              <p className="ad-warning">
                ⚠️ 광고성·체험단 후기가 섞여 있을 수 있어요. 구체적인 복용 기간이 적힌 후기를
                중심으로 참고하세요.
              </p>
            )}

            {snippets.length > 0 && (
              <div className="crawled-box">
                <h4>크롤링 기반 참고 정보</h4>
                {snippets.map((s) => (
                  <div key={s.url} className="crawled-item">
                    <p className="crawled-title">📄 {s.title}</p>
                    <p className="crawled-text">{s.firstParagraph || s.description}</p>
                    <a href={s.url} target="_blank" rel="noreferrer" className="crawled-link">
                      출처 보기 ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p className="crawled-meta">
        {crawledReferences.fallbackMessage && (
          <span className="fallback-note">{crawledReferences.fallbackMessage} </span>
        )}
        참고 정보 수집 시점:{" "}
        {crawledReferences.crawledAt
          ? new Date(crawledReferences.crawledAt).toLocaleString("ko-KR")
          : "저장된 샘플 데이터"}
        {" · "}공개된 위키백과 성분 문서에서 수집했습니다.
      </p>
    </section>
  );
}
