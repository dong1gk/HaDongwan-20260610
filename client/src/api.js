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

export function fetchRecommendation(answers) {
  return request("/api/recommend", {
    method: "POST",
    body: JSON.stringify(answers),
  });
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
