export default function RoutineCheck({ profile, recommendedIngredients, routineAnalysis }) {
  return (
    <section className="card">
      <h2>고민 → 성분 변환 & 복용 루틴 체크</h2>

      <div className="routine-grid">
        <div className="routine-item">
          <span className="routine-label">선택한 고민</span>
          <span className="routine-value tag-concern">{profile.concern}</span>
        </div>
        <div className="routine-item">
          <span className="routine-label">추천 성분군</span>
          <div className="tag-list">
            {recommendedIngredients.map((ing) => (
              <span key={ing} className="tag">
                {ing}
              </span>
            ))}
          </div>
        </div>
        <div className="routine-item">
          <span className="routine-label">인식된 복용 루틴</span>
          <div className="tag-list">
            {routineAnalysis.parsedRoutine.length > 0 ? (
              routineAnalysis.parsedRoutine.map((item) => (
                <span key={item} className="tag tag-muted">
                  {item}
                </span>
              ))
            ) : (
              <span className="tag tag-muted">복용 중인 영양제 없음</span>
            )}
          </div>
        </div>
      </div>

      {routineAnalysis.warnings.length > 0 && (
        <ul className="warning-list">
          {routineAnalysis.warnings.map((w, i) => (
            <li key={i}>⚠️ {w}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
