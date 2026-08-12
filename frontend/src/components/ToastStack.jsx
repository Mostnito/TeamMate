export default function ToastStack({ toasts, dismissToast }) {
  const palette = {
    success: { bg: '#111827', accent: '#22C55E' },
    error: { bg: '#111827', accent: '#DC2626' },
    info: { bg: '#111827', accent: '#2563EB' }
  };
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map((t) => {
        const p = palette[t.type] || palette.info;
        return (
          <div
            key={t.id}
            onClick={dismissToast(t.id)}
            style={{
              pointerEvents: 'auto', cursor: 'pointer', background: p.bg, color: '#fff', padding: '11px 16px',
              borderRadius: 9, fontSize: 13, fontWeight: 600, boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
              borderLeft: '3px solid ' + p.accent, animation: 'toastIn 0.2s ease', minWidth: 220
            }}
          >
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
