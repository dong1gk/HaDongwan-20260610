import Disclaimer from "./Disclaimer.jsx";

export default function Landing({ onStart }) {
  return (
    <main className="landing">
      <h1 className="landing-title">
        나에게 맞는 영양제,
        <br />
        <span className="accent">3분 안에 후보 3개</span>로 압축
      </h1>
      <p className="landing-sub">
        긴 설문 없이, 대화하듯 건강 고민을 이야기하세요.
        <br />
        성분, 함량, 후기, 가격까지 한 번에 비교해드립니다.
      </p>

      <ul className="landing-points">
        <li>
          <span className="point-icon">💬</span>
          <div>
            <strong>대화로 시작하는 추천</strong>
            <p>"요즘 너무 피곤해요"라고 말하면, 필요한 것만 몇 가지 더 여쭤봐요.</p>
          </div>
        </li>
        <li>
          <span className="point-icon">💊</span>
          <div>
            <strong>지금 먹는 영양제와 중복 체크</strong>
            <p>이미 복용 중인 제품과 성분이 겹치는지 먼저 확인해요.</p>
          </div>
        </li>
        <li>
          <span className="point-icon">🧾</span>
          <div>
            <strong>최종 구매 확인 카드</strong>
            <p>하루 비용, 주의점, 확인할 점을 한 장으로 정리해드려요.</p>
          </div>
        </li>
      </ul>

      <button className="btn-primary" onClick={onStart}>
        시작하기
      </button>

      <Disclaimer />
    </main>
  );
}
