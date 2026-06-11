import { useEffect, useState } from "react";
import Landing from "./components/Landing.jsx";
import ChatIntake from "./components/ChatIntake.jsx";
import Questionnaire from "./components/Questionnaire.jsx";
import LoadingState from "./components/LoadingState.jsx";
import RoutineCheck from "./components/RoutineCheck.jsx";
import RecommendationResults from "./components/RecommendationResults.jsx";
import ProductComparison from "./components/ProductComparison.jsx";
import TrustEvidence from "./components/TrustEvidence.jsx";
import FinalPurchaseCard from "./components/FinalPurchaseCard.jsx";
import Disclaimer from "./components/Disclaimer.jsx";
import { fetchRecommendation, pingHealth } from "./api.js";

export default function App() {
  const [step, setStep] = useState("landing"); // landing | chat | survey | loading | results
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 랜딩 진입 시 서버를 미리 깨워 콜드 스타트 지연을 줄인다 (Render 무료 플랜)
  useEffect(() => {
    pingHealth();
  }, []);

  async function handleSubmit(answers, chatTranscript = null) {
    setStep("loading");
    setError(null);
    try {
      const data = await fetchRecommendation(answers, chatTranscript);
      if (data.noResult) {
        setError(data.message);
        setStep("survey");
        return;
      }
      setResult(data);
      setStep("results");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e.message || "추천을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      setStep("survey");
    }
  }

  // 채팅 인테이크 실패 시 설문 폴백
  function handleChatFallback(message) {
    setError(message);
    setStep("survey");
    window.scrollTo({ top: 0 });
  }

  function restart() {
    setResult(null);
    setError(null);
    setStep("chat");
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

      {step === "landing" && <Landing onStart={() => setStep("chat")} />}

      {step === "chat" && <ChatIntake onComplete={handleSubmit} onFallback={handleChatFallback} />}

      {step === "survey" && (
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
