import { card, btnGhostBlue, statusPill } from '../styles/common.js';

export default function DashboardScreen({ v }) {
  return (
    <div style={{ padding: '26px 28px' }}>
      <div style={{ background: '#2563EB', borderRadius: 14, padding: '18px 22px', color: '#fff', marginBottom: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>ยินดีต้อนรับ, {v.firstNameShort}</div>
        <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 3 }}>นี่คือภาพรวมงานและทีมของคุณวันนี้</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 22 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>ทีมทั้งหมด</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginTop: 4 }}>{v.dashStats.teamCount}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>งานที่ต้องทำ</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#B45309', marginTop: 4 }}>{v.dashStats.pendingTasks}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>คะแนนสะสม</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563EB', marginTop: 4 }}>{v.dashStats.points}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>งานที่ใกล้ครบกำหนด</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {v.dashUpcomingTasks.map((t) => (
              <div key={t.id} onClick={t.onOpen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 9, background: '#F9FAFB', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>กำหนดส่ง {t.dueDate}</div>
                </div>
                <span style={statusPill(t.statusBg, t.statusColor)}>{t.statusLabel}</span>
              </div>
            ))}
            {v.dashNoUpcomingTasks && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12.5 }}>ไม่มีงานที่ใกล้ครบกำหนด</div>}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ทีมของฉัน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {v.groups.map((g) => (
              <div key={g.id} onClick={g.onOpen} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', background: '#F9FAFB' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: g.tint, color: g.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11.5 }}>{g.letter}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>ทีม {g.letter} · {g.name}</div>
              </div>
            ))}
          </div>
          <button onClick={v.goTeams} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูทีมทั้งหมด</button>
        </div>
      </div>
    </div>
  );
}
