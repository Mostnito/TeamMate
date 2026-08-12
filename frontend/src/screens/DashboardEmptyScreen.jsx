import { btnPrimary } from '../styles/common.js';

export default function DashboardEmptyScreen({ v }) {
  return (
    <div style={{ padding: '26px 28px', minHeight: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2563EB', borderRadius: 14, padding: '18px 22px', color: '#fff', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>ยินดีต้อนรับ, {v.firstNameShort}</div>
        <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 3 }}>เริ่มต้นสร้างหรือเข้าร่วมทีมเพื่อทำงานร่วมกัน</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 920, width: '100%' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '34px 28px', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>+</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 8 }}>สร้างทีมใหม่</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 22, lineHeight: 1.6 }}>สำหรับหัวหน้ากลุ่ม<br />สร้างทีมใหม่และเชิญเพื่อนเข้าร่วม</div>
            <button onClick={v.goCreateGroup} style={{ ...btnPrimary, padding: '10px 26px' }}>สร้างทีม</button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '34px 28px', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>→</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 8 }}>เข้าร่วมทีม</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>ใส่รหัสทีม 6 หลักที่ได้รับ<br />จากหัวหน้ากลุ่มเพื่อเข้าร่วม</div>
            <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 14 }}>
              {v.joinDigits.map((d, i) => (
                <input key={i} value={d.val} onChange={d.onChange} maxLength={1} style={{ width: 34, height: 40, textAlign: 'center', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', fontSize: 15, fontWeight: 600 }} />
              ))}
            </div>
            {v.joinError && <div style={{ color: '#DC2626', fontSize: 11, marginBottom: 10 }}>{v.joinError}</div>}
            <button onClick={v.handleJoinGroup} style={{ ...btnPrimary, padding: '10px 26px' }}>เข้าร่วมทีม</button>
          </div>
        </div>
      </div>
    </div>
  );
}
