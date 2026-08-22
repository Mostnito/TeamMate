import { useEffect, useState } from 'react';
import { label, textarea, btnPrimary, btnSecondary } from '../styles/common.js';

export default function ReportModal({ isOpen, title, isSubmitting, onClose, onSubmit }) {
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (isOpen) setDetail('');
  }, [isOpen]);

  if (!isOpen) return null;

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={stopPropagation} style={{ width: 400, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>ทีมงานผู้ดูแลระบบจะตรวจสอบรายงานนี้</div>
        <div style={label}>รายละเอียด (ไม่บังคับ)</div>
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="อธิบายเหตุผลที่รายงาน..." style={textarea}></textarea>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
          <button onClick={() => onSubmit(detail)} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
          </button>
        </div>
      </div>
    </div>
  );
}
