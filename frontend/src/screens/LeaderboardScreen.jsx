import { IoMdTrophy } from 'react-icons/io';

export default function LeaderboardScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>อันดับคะแนน</div>
        <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 9, padding: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          {v.leaderboardPeriods.map((p) => (
            <div key={p.label} onClick={p.onClick} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: p.bg, color: p.color }}>{p.label}</div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 22, maxWidth: 920, marginLeft: 'auto', marginRight: 'auto' }}>
        {v.leaderboardPodium.map((row) => (
          <div key={row.studentId} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: row.border, boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: row.tint, color: row.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {row.initials}
                  {row.isFirst && <span style={{ position: 'absolute', top: -8, right: -6, color: '#D97706' }}><IoMdTrophy size={16} /></span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{row.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{row.studentId}</div>
                </div>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F3F4F6', color: '#374151', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row.rank}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.3 }}>คะแนน</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>{row.points}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 6px 18px rgba(0,0,0,0.05)', overflow: 'hidden', maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px 2fr 1fr', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.4, borderBottom: '1px solid #F3F4F6' }}>
          <div>อันดับ</div><div>ชื่อ</div><div>คะแนน</div>
        </div>
        {v.leaderboardRest.map((row) => (
          <div key={row.studentId} style={{ display: 'grid', gridTemplateColumns: '56px 2fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F9FAFB' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280' }}>{row.rank}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: row.tint, color: row.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11.5 }}>{row.initials}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{row.name}</div>
                <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{row.studentId}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2563EB' }}>{row.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
