// 시그니처 요소: "정해줘" 버튼을 누르면 한 곳이 도장처럼 박힌다.
export default function Verdict({ picked, onPick, disabled }) {
  return (
    <div className="verdict">
      <button className="verdict__btn" onClick={onPick} disabled={disabled}>
        오늘 점심 정해줘
      </button>

      {picked && (
        <a
          key={picked.id}
          className="verdict__card"
          href={picked.place_url}
          target="_blank"
          rel="noreferrer"
        >
          {picked.isCafeteria && (
            <span className="stamp stamp--school">학식</span>
          )}
          <strong className="verdict__name">{picked.place_name}</strong>
          {picked.isCafeteria && picked.address && (
            <span className="verdict__cat">{picked.address}</span>
          )}
          {!picked.isCafeteria && picked.category_name && (
            <span className="verdict__cat">{picked.category_name}</span>
          )}
          <span className="verdict__go">
            {picked.isCafeteria ? '오늘 메뉴 확인하기 →' : '카카오맵에서 보기 →'}
          </span>
        </a>
      )}
    </div>
  );
}
