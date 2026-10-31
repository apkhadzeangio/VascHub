export default function Loading() {
  return (
    <div
      className="vh-theme vh-events vh-events-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="vh-container">
        <p>ღონისძიებები იტვირთება…</p>
        <div className="vh-events-grid" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="vh-events-skeleton" />
          ))}
        </div>
      </div>
    </div>
  )
}
