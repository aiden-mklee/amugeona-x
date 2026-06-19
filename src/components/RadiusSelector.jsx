export default function RadiusSelector({ presets, value, onChange }) {
  return (
    <div className="chips" role="group" aria-label="거리 선택">
      {presets.map((p) => (
        <button
          key={p.id}
          className={`chip ${value.id === p.id ? 'chip--on' : ''}`}
          onClick={() => onChange(p)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
