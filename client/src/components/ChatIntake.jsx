import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api.js";

const GREETING = {
  role: "assistant",
  content:
    "안녕하세요, 영양제핏이에요 🙂 요즘 어떤 점이 가장 신경 쓰이세요? 편하게 이야기해주세요.",
  quickReplies: ["요즘 너무 피곤해요", "잠을 잘 못 자요", "눈이 침침해요", "장이 예민해요", "피부가 푸석해요"],
};

export default function ChatIntake({ onComplete, onFallback }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, waiting]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || waiting) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setWaiting(true);

    try {
      const data = await sendChatMessage(
        nextMessages.map(({ role, content }) => ({ role, content }))
      );

      if (!data.aiAvailable) {
        onFallback("AI 대화 모드를 사용할 수 없어 간단 설문으로 진행할게요.");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, quickReplies: data.quickReplies },
      ]);

      if (data.status === "ready" && data.profile) {
        // 마지막 요약 메시지를 잠깐 보여준 뒤 추천 생성으로 이동
        setTimeout(() => onComplete(data.profile), 1200);
        return;
      }
    } catch (e) {
      onFallback("연결이 불안정해 간단 설문으로 진행할게요.");
      return;
    }
    setWaiting(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  const lastQuickReplies =
    !waiting && messages[messages.length - 1]?.role === "assistant"
      ? messages[messages.length - 1].quickReplies || []
      : [];

  return (
    <main className="chat">
      <h2>대화로 알려주세요</h2>
      <p className="questionnaire-sub">긴 설문 대신, 필요한 것만 몇 가지 여쭤볼게요.</p>

      <div className="chat-window">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble-row ${m.role}`}>
              {m.role === "assistant" && <span className="chat-avatar">💊</span>}
              <div className={`bubble ${m.role}`}>{m.content}</div>
            </div>
          ))}
          {waiting && (
            <div className="bubble-row assistant">
              <span className="chat-avatar">💊</span>
              <div className="bubble assistant typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {lastQuickReplies.length > 0 && (
          <div className="quick-replies">
            {lastQuickReplies.map((qr) => (
              <button key={qr} type="button" className="chip" onClick={() => send(qr)}>
                {qr}
              </button>
            ))}
          </div>
        )}

        <form className="chat-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            className="text-input chat-input"
            placeholder="메시지를 입력하세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={waiting}
          />
          <button type="submit" className="chat-send" disabled={waiting || !input.trim()}>
            보내기
          </button>
        </form>
      </div>

      <p className="field-hint chat-hint">
        영양제핏은 진단이 아니라 구매 판단 보조입니다. 약 복용 중이라면 전문가와 상담하세요.
      </p>
    </main>
  );
}
