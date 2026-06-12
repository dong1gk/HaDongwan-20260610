export default function FinalPurchaseCard({ result }) {
  const top = result.topProducts[0];
  if (!top) return null;
  const p = top.product;

  return (
    <section className="card final-card">
      <div className="final-head">
        <p className="final-eyebrow">구매 전 최종 확인 카드</p>
        <h2>{p.productName}</h2>
        <p className="final-brand">
          {p.brand} · 1순위 추천 · 적합도 {Math.round(top.confidenceScore)}점
        </p>
      </div>

      <div className="final-grid">
      <div className="final-section">
        <h3>✅ 추천 이유</h3>
        <ul>
          <li>{top.recommendationReason}</li>
          <li>
            {top.overlap.level === "low"
              ? "현재 입력한 복용 루틴과 큰 중복은 적어 보입니다."
              : top.overlap.reasons[0]}
          </li>
        </ul>
      </div>

      <div className="final-section">
        <h3>🔍 확인할 점</h3>
        <ul>
          <li>{top.caution}</li>
          <li>특정 질환이 있거나 약을 복용 중이라면 전문가와 상담하세요.</li>
        </ul>
      </div>

      <div className="final-section">
        <h3>💰 가격 판단</h3>
        <ul>
          <li>
            총 {top.cost.totalPrice.toLocaleString("ko-KR")}원 / {top.cost.count}개입 / 약{" "}
            {top.cost.estimatedDays}일 분량
          </li>
          <li>{top.cost.text}</li>
        </ul>
      </div>

      <div className="final-section">
        <h3>🧭 최종 판단</h3>
        <ul>
          <li>{result.finalAdvice}</li>
        </ul>
      </div>
      </div>

      <p className="final-disclaimer">{result.disclaimer}</p>
    </section>
  );
}
