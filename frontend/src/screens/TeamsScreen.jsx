import { card, btnPrimary, btnGhostBlue } from '../styles/common.js';

export default function TeamsScreen({ v }) {
  return (
    <div style={{ padding: '26px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>ทีมของฉัน</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={v.goJoinGroup} style={btnGhostBlue}>เข้าร่วมทีม</button>
          <button onClick={v.goCreateGroup} style={btnPrimary}>+ สร้างทีมใหม่</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {v.groups.map((g) => (
          <div key={g.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: g.tint, color: g.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{g.letter}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>ทีม {g.letter}</div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>{g.subtitle}</div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 12 }}>👥 {g.memberCount} สมาชิก &nbsp;·&nbsp; ☑ {g.taskCount} งาน</div>
            <button onClick={g.onOpen} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูและเลือกทีม</button>
          </div>
        ))}
      </div>
    </div>
  );
}
