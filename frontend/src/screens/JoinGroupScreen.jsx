import { btnPrimary } from '../styles/common.js';
import JoinCodeInput from '../components/JoinCodeInput.jsx';

export default function JoinGroupScreen({ v }) {
  return (
    <div style={{ padding: '26px 28px', minHeight: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 14 }} onClick={v.goTeams}>
        <span>←</span><span>เข้าร่วมทีม</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, background: '#fff', borderRadius: 16, padding: '34px 28px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>→</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 8 }}>เข้าร่วมทีม</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18, lineHeight: 1.6 }}>ใส่รหัสทีม 6 หลักที่ได้รับ<br />จากหัวหน้ากลุ่มเพื่อเข้าร่วม</div>
          <JoinCodeInput digits={v.joinDigits} />
          {v.joinError && <div style={{ color: '#DC2626', fontSize: 11, marginBottom: 10 }}>{v.joinError}</div>}
          <button onClick={v.handleJoinGroup} style={{ ...btnPrimary, width: '100%', padding: 11, borderRadius: 10, fontSize: 13.5 }}>เข้าร่วมทีม</button>
        </div>
      </div>
    </div>
  );
}
