// 배포 환경에서는 VITE_API_BASE_URL 사용, 로컬 개발에서는 Vite 프록시(/api) 사용
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }
  return res.json();
}

export function fetchRecommendation(answers, chatTranscript = null) {
  return request("/api/recommend", {
    method: "POST",
    body: JSON.stringify({ ...answers, chatTranscript }),
  });
}

// Render 무료 플랜 슬립 해제용 — 랜딩 진입 시 미리 서버를 깨워둔다
export function pingHealth() {
  return fetch(`${API_BASE}/api/health`).catch(() => {});
}

export function sendChatMessage(messages) {
  return request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}

export function fetchCrawledSample() {
  return request("/api/crawl/sample");
}

export function fetchProducts() {
  return request("/api/products");
}
