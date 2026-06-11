import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api.js";

const GREETING = {
  role: "assistant",
  content:
    "안녕하세요, 영양제핏이에요 🙂 요즘 어떤 점이 가장 신경 쓰이세요? 편하게 이야기해주세요.",
  quickReplies: ["요즘 너무 피곤해요", "잠을 잘 못 자요", "눈이 침침해요", "장이 예민해요", "피부가 푸석해요"],
};

// 추천 프롬프트에 전달할 대화 요약 텍스트
function buildTranscript(messages) {
  return messages
    .map((m) => `${m.role === "user" ? "고객" : "도우미"}: ${m.content}`)
    .join("\n")
    .slice(-2000);
}

export default function ChatIntake({ onComplete, onFallback }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef(null);
  const lastSentRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, waiting, failed]);

  async function callApi(nextMessages) {
    setWaiting(true);
    setFailed(false);

    try {
      const data = await sendChatMessage(
        nextMessages.map(({ role, content }) => ({ role, content }))
      );

      if (!data.aiAvailable) {
        // AI 자체를 쓸 수 없는 상태 → 재시도 의미 없음, 설문으로 폴백
        onFallback("AI 대화 모드를 사용할 수 없어 간단 설문으로 진행할게요.");
        return;
      }

      const finalMessages = [
        ...nextMessages,
        { role: "assistant", content: data.reply, quickReplies: data.quickReplies },
      ];
      setMessages(finalMessages);

      if (data.status === "ready" && data.profile) {
        // 마지막 요약 메시지를 잠깐 보여준 뒤 추천 생성으로 이동
        setTimeout(() => onComplete(data.profile, buildTranscript(finalMessages)), 1200);
        return;
      }
    } catch (e) {
      // 일시적 네트워크 오류일 수 있으므로 바로 포기하지 않고 재시도 버튼 제공
      setFailed(true);
      setWaiting(false);
      return;
    }
    setWaiting(false);
  }

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed || waiting) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    lastSentRef.current = nextMessages;
    callApi(nextMessages);
  }

  function retry() {
    if (lastSentRef.current) callApi(lastSentRef.current);
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
          {failed && (
            <div className="chat-error">
              <p>잠시 연결이 불안정했어요. 다시 시도해볼까요?</p>
              <div className="chat-error-actions">
                <button type="button" className="chip chip-retry" onClick={retry}>
                  다시 시도
                </button>
                <button
                  type="button"
                  className="chip"
                  onClick={() => onFallback("간단 설문으로 진행할게요.")}
                >
                  간단 설문으로 진행
                </button>
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
