import { useState } from "react";
import Landing from "./components/Landing.jsx";
import Questionnaire from "./components/Questionnaire.jsx";
import LoadingState from "./components/LoadingState.jsx";
import RoutineCheck from "./components/RoutineCheck.jsx";
import RecommendationResults from "./components/RecommendationResults.jsx";
import ProductComparison from "./components/ProductComparison.jsx";
import TrustEvidence from "./components/TrustEvidence.jsx";
import FinalPurchaseCard from "./components/FinalPurchaseCard.jsx";
import Disclaimer from "./components/Disclaimer.jsx";
import { fetchRecommendation } from "./api.js";

export default function App() {
  const [step, setStep] = useState("landing"); // landing | form | loading | results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(answers) {
    setStep("loading");
    setError(null);
    try {
      const data = await fetchRecommendation(answers);
      if (data.noResult) {
        setError(data.message);
        setStep("form");
        return;
      }
      setResult(data);
      setStep("results");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e.message || "추천을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      setStep("form");
    }
  }

  function restart() {
    setResult(null);
    setError(null);
    setStep("form");
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo" onClick={() => setStep("landing")}>
          영양제핏
        </span>
        <span className="header-tag">AI 영양제 구매 도우미</span>
      </header>

      {step === "landing" && <Landing onStart={() => setStep("form")} />}

      {step === "form" && (
        <>
          {error && <div className="error-banner">{error}</div>}
          <Questionnaire onSubmit={handleSubmit} />
        </>
      )}

      {step === "loading" && <LoadingState />}

      {step === "results" && result && (
        <main className="results">
          <Disclaimer />
          {result.fallbackNotice && (
            <div className="fallback-banner">{result.fallbackNotice}</div>
          )}

          <section className="card summary-card">
            <h2>추천 요약</h2>
            <p>{result.summary}</p>
          </section>

          <RoutineCheck
            profile={result.profile}
            recommendedIngredients={result.recommendedIngredients}
            routineAnalysis={result.routineAnalysis}
          />
          <RecommendationResults topProducts={result.topProducts} />
          <ProductComparison topProducts={result.topProducts} />
          <TrustEvidence
            topProducts={result.topProducts}
            crawledReferences={result.crawledReferences}
          />
          <FinalPurchaseCard result={result} />

          <button className="btn-secondary restart-btn" onClick={restart}>
            조건 바꿔서 다시 추천받기
          </button>
        </main>
      )}

      <footer className="app-footer">
        <p>
          영양제핏은 의료 진단 서비스가 아니며, 구매 판단을 돕기 위한 정보를 제공합니다.
          <br />
          건강 상태가 걱정되거나 약을 복용 중이라면 전문가와 상담하세요.
        </p>
      </footer>
    </div>
  );
}
