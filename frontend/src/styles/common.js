export const card = {
  background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)'
};

export const cardSm = {
  background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
};

export const label = {
  fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6
};

export const input = {
  width: '100%', padding: '11px 13px', border: '1px solid #E5E7EB', borderRadius: 9,
  background: '#F9FAFB', fontSize: 13, color: '#111827'
};

export const inputSm = {
  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8,
  background: '#F9FAFB', fontSize: 13
};

export const textarea = {
  width: '100%', minHeight: 70, border: '1px solid #E5E7EB', borderRadius: 8,
  background: '#F9FAFB', fontSize: 13, padding: 10, resize: 'vertical'
};

export const btnPrimary = {
  background: '#2563EB', color: '#fff', border: 'none', padding: '11px 22px',
  borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer'
};

export const btnSecondary = {
  background: '#F3F4F6', color: '#374151', border: 'none', padding: '11px 22px',
  borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer'
};

export const btnGhostBlue = {
  background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '9px 18px',
  borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
};

export const pill = {
  padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer'
};

export const avatar = (tint, accent, size = 36) => ({
  width: size, height: size, borderRadius: '50%', background: tint, color: accent,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36
});

export const toggle = (on) => ({
  width: 42, height: 24, borderRadius: 12, background: on ? '#2563EB' : '#D8E1EC',
  position: 'relative', cursor: 'pointer', transition: 'background 0.15s'
});

export const toggleKnob = (on) => ({
  width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
  top: 3, left: on ? 21 : 3, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
});

export const statusPill = (bg, color) => ({
  fontSize: 11.5, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap'
});

export const page = { padding: '22px 28px' };
export const pageWide = { padding: '26px 28px' };
