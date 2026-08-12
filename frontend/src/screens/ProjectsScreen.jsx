import { card, btnGhostBlue } from '../styles/common.js';

export default function ProjectsScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>โปรเจ็ก</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>ภาพรวมความคืบหน้าของงานในแต่ละโปรเจกต์ที่คุณเข้าร่วม</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {v.projectCards.map((p) => (
          <div key={p.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: p.tint, color: p.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{p.letter}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>รหัสวิชา {p.subjectCode}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11.5, color: '#6B7280' }}>ความคืบหน้า</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{p.pct}%</div>
            </div>
            <div style={{ height: 7, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: 4, width: p.pct + '%' }}></div>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>เสร็จแล้ว {p.doneCount} จาก {p.totalCount} งาน</div>
            <button onClick={p.onOpenTasks} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูงานของโปรเจกต์นี้</button>
          </div>
        ))}
      </div>
    </div>
  );
}
