import { IoMdCheckmarkCircle, IoMdCopy, IoMdShare, IoMdArrowForward } from 'react-icons/io';

export default function GroupCreatedScreen({ v }) {
  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 360, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: '34px 28px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8F8EE', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><IoMdCheckmarkCircle size={24} /></div>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>สร้างกลุ่มสำเร็จ!</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>แชร์โค้ดนี้ให้เพื่อนเข้ากลุ่ม</div>
        <div style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 22, letterSpacing: 3, borderRadius: 10, padding: 14, margin: '18px 0' }}>{v.newGroupCode}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
          <button onClick={v.copyCode} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F3F4F6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><IoMdCopy size={13} /> {v.copyLabel}</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F3F4F6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><IoMdShare size={13} /> แชร์</button>
        </div>
        <div onClick={v.goTeams} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#2563EB', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>ไปยังหน้ากลุ่ม <IoMdArrowForward size={14} /></div>
      </div>
    </div>
  );
}
