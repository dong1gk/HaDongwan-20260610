import { useState } from "react";

const CONCERNS = ["피로", "수면", "눈 건강", "장 건강", "피부", "혈당", "관절", "다이어트", "면역"];
const AGE_RANGES = ["35-39", "40-44", "45-50"];
const BUDGETS = ["2만원 이하", "2-4만원", "4-6만원", "상관없음"];
const PREFERENCES = ["가성비", "리뷰 신뢰도", "성분 함량", "복용 편의성", "기존 영양제와 안 겹치는 것"];

export default function Questionnaire({ onSubmit }) {
  const [concern, setConcern] = useState(null);
  const [customConcern, setCustomConcern] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [ageRange, setAgeRange] = useState(null);
  const [currentSupplements, setCurrentSupplements] = useState("");
  const [budget, setBudget] = useState(null);
  const [preference, setPreference] = useState(null);

  const finalConcern = isCustom ? customConcern.trim() : concern;
  const canSubmit = Boolean(finalConcern && ageRange && budget && preference);

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ concern: finalConcern, ageRange, currentSupplements, budget, preference });
  }

  return (
    <main className="questionnaire">
      <h2>몇 가지만 알려주세요</h2>
      <p className="questionnaire-sub">5개 질문이면 충분해요. 긴 설문은 없습니다.</p>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>1. 요즘 가장 신경 쓰이는 건강 고민은?</legend>
          <div className="chips">
            {CONCERNS.map((c) => (
              <button
                type="button"
                key={c}
                className={`chip ${!isCustom && concern === c ? "selected" : ""}`}
                onClick={() => {
                  setConcern(c);
                  setIsCustom(false);
                }}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              className={`chip ${isCustom ? "selected" : ""}`}
              onClick={() => setIsCustom(true)}
            >
              기타 직접 입력
            </button>
          </div>
          {isCustom && (
            <input
              type="text"
              className="text-input"
              placeholder="고민을 직접 입력해주세요 (예: 탈모, 갱년기)"
              value={customConcern}
              onChange={(e) => setCustomConcern(e.target.value)}
            />
          )}
        </fieldset>

        <fieldset>
          <legend>2. 연령대를 알려주세요</legend>
          <div className="chips">
            {AGE_RANGES.map((a) => (
              <button
                type="button"
                key={a}
                className={`chip ${ageRange === a ? "selected" : ""}`}
                onClick={() => setAgeRange(a)}
              >
                {a}세
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>3. 지금 복용 중인 영양제가 있나요?</legend>
          <input
            type="text"
            className="text-input"
            placeholder="예: 종합비타민, 오메가3, 유산균, 비타민D"
            value={currentSupplements}
            onChange={(e) => setCurrentSupplements(e.target.value)}
          />
          <p className="field-hint">없다면 비워두셔도 돼요. 중복 성분 확인에 사용됩니다.</p>
        </fieldset>

        <fieldset>
          <legend>4. 예산은 어느 정도가 편하세요?</legend>
          <div className="chips">
            {BUDGETS.map((b) => (
              <button
                type="button"
                key={b}
                className={`chip ${budget === b ? "selected" : ""}`}
                onClick={() => setBudget(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>5. 고를 때 가장 중요한 건 무엇인가요?</legend>
          <div className="chips">
            {PREFERENCES.map((p) => (
              <button
                type="button"
                key={p}
                className={`chip ${preference === p ? "selected" : ""}`}
                onClick={() => setPreference(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {canSubmit ? "맞춤 추천 받기" : "모든 항목을 선택해주세요"}
        </button>
      </form>
    </main>
  );
}
