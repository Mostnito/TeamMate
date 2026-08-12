import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';

export default function CreateGroupScreen({ v }) {
  return (
    <div style={{ padding: '26px 28px', minHeight: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 14 }} onClick={v.goDashboard}>
        <span>←</span><span>สร้างกลุ่มเรียน</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 460, width: '100%', background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>สร้างกลุ่มเรียน</div>
          <div style={{ marginBottom: 14 }}>
            <div style={label}>รหัสวิชา</div>
            <input value={v.cg.code} onChange={v.onCgCode} placeholder="เช่น 264991" style={input} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={label}>ชื่อวิชา</div>
            <input value={v.cg.name} onChange={v.onCgName} placeholder="เช่น Software Engineering" style={input} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={label}>อาจารย์ผู้สอน</div>
            <input value={v.cg.teacher} onChange={v.onCgTeacher} placeholder="ชื่ออาจารย์" style={input} />
          </div>
          {v.cgError && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>{v.cgError}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={v.goDashboard} style={{ ...btnSecondary, flex: 1, padding: 12, borderRadius: 10, fontSize: 13.5 }}>ย้อนกลับ</button>
            <button onClick={v.handleCreateGroup} style={{ ...btnPrimary, flex: 2, padding: 12, borderRadius: 10, fontSize: 13.5 }}>สร้างกลุ่ม</button>
          </div>
        </div>
      </div>
    </div>
  );
}
