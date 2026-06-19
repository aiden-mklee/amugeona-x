export default function ResultList({
  results,
  loading,
  pickedId,
  walkMinutes,
  formatDistance,
  carMode,
}) {
  if (loading) return <p className="muted">주변을 살펴보는 중…</p>;
  if (!results.length)
    return <p className="muted">반경 안에 식당이 없어요. 거리를 넓혀보세요.</p>;

  return (
    <>
      <p className="result-count">총 {results.length}곳</p>
      <ul className="list" aria-label="주변 후보">
        {results.map((r) => (
          <li
            key={r.id}
            className={`card ${r.id === pickedId ? 'card--picked' : ''} ${
              r.isCafeteria ? 'card--school' : ''
            }`}
          >
            <a href={r.place_url} target="_blank" rel="noreferrer">
              <div className="card__top">
                <strong className="card__name">{r.place_name}</strong>
                {r.isCafeteria ? (
                  <span className="tag tag--school">학식</span>
                ) : (
                  <span className="card__dist">
                    {carMode
                      ? formatDistance(r.distance)
                      : `도보 ${walkMinutes(r.distance)}분`}
                  </span>
                )}
              </div>
              {r.category_name && <div className="card__cat">{r.category_name}</div>}
              {r.address && <div className="card__addr">{r.address}</div>}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
