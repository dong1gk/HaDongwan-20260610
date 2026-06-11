function formatAmounts(amounts) {
  return Object.entries(amounts)
    .map(([name, amount]) => `${name} ${amount}`)
    .join(", ");
}

export default function ProductComparison({ topProducts }) {
  return (
    <section className="card">
      <h2>성분·함량 한눈에 비교</h2>
      <p className="section-sub">성분과 복용 루틴 기준으로 비교했습니다.</p>

      <div className="table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>제품명</th>
              <th>핵심 성분</th>
              <th>함량</th>
              <th>1일 섭취량</th>
              <th>복용 편의성</th>
              <th>주의사항</th>
              <th>1일 비용</th>
              <th>추천 이유</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((tp) => {
              const p = tp.product;
              return (
                <tr key={tp.productId}>
                  <td className="cell-name">
                    {p.productName}
                    <span className="cell-brand">{p.brand}</span>
                  </td>
                  <td>{p.ingredients.slice(0, 3).join(", ")}</td>
                  <td>{formatAmounts(p.ingredientAmounts)}</td>
                  <td>{p.dosage}</td>
                  <td>{p.convenience}</td>
                  <td>{p.warnings[0]}</td>
                  <td className="cell-price">약 {tp.cost.pricePerDay.toLocaleString("ko-KR")}원</td>
                  <td>{tp.recommendationReason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
