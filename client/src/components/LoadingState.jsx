import { useEffect, useState } from "react";

const MESSAGES = [
  "건강 고민을 성분군으로 변환하는 중…",
  "현재 복용 루틴과 중복 성분 확인 중…",
  "후보 제품을 압축하는 중…",
  "성분·함량·가격 비교 중…",
  "구매 확인 카드를 작성하는 중…",
];

export default function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="loading">
      <div className="spinner" />
      <p className="loading-message">{MESSAGES[index]}</p>
      <p className="loading-hint">보통 10초 안에 끝나요</p>
    </main>
  );
}
