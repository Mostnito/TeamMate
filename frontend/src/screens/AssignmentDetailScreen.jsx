import { textarea } from '../styles/common.js';
import { IoMdArrowBack, IoMdDocument, IoMdCloudUpload, IoMdTrash } from 'react-icons/io';

export default function AssignmentDetailScreen({ v }) {
  const a = v.selectedAssignment;
  return (
    <div style={{ padding: '22px 28px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 12, marginBottom: 6, cursor: 'pointer' }} onClick={v.goAssignment}>
        <IoMdArrowBack size={14} /><span>ตัวเลือก</span><span>|</span><span style={{ color: '#111827', fontWeight: 600 }}>{a.title}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginTop: 8 }}>{a.title}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{a.groupLabel} &nbsp;·&nbsp; กำหนดส่ง: {a.dueDate}</div>
      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: a.statusBg, color: a.statusColor, margin: '12px 0 4px' }}>{a.statusLabel}</span>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>คำอธิบาย</div>
      <div style={{ fontSize: 12.5, color: '#4B5A6E', lineHeight: 1.7, marginBottom: 18 }}>{a.description}</div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>ไฟล์ที่เกี่ยวข้อง</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {a.attachments.map((att) => (
          <div key={att.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 9, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111827', fontWeight: 600 }}><IoMdDocument size={15} /><span>{att.name}</span></div>
            <span style={{ color: '#2563EB', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>ดาวน์โหลด</span>
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>ส่งงาน</div>
      <div onClick={v.simulateUpload} style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 26, textAlign: 'center', background: '#F7FAFD', cursor: 'pointer', marginBottom: 12 }}>
        <div style={{ color: '#6B7280', display: 'flex', justifyContent: 'center' }}><IoMdCloudUpload size={20} /></div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>วางไฟล์ที่นี่ หรือ <span style={{ color: '#2563EB', fontWeight: 600 }}>เลือกไฟล์</span></div>
        <div style={{ fontSize: 10.5, color: '#AEB9C6', marginTop: 3 }}>รองรับ PDF, DOCX, ZIP, Figma</div>
      </div>
      {a.submissions.map((sub) => (
        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 9, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111827', fontWeight: 600 }}><IoMdDocument size={15} /><span>{sub.name}</span></div>
          <span onClick={sub.onRemove} style={{ color: '#DC2626', cursor: 'pointer', display: 'flex' }}><IoMdTrash size={14} /></span>
        </div>
      ))}
      <textarea value={v.submitNote} onChange={v.onSubmitNoteChange} placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)" style={{ ...textarea, marginBottom: 14 }}></textarea>
      <button onClick={v.handleSubmitAssignment} style={{ width: '100%', background: '#0F9B8E', color: '#fff', border: 'none', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>{v.submitButtonLabel}</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>บันทึกร่าง</div>
    </div>
  );
}
