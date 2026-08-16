import { useEffect, useState } from 'react';
import { label, input, textarea, btnPrimary, btnSecondary } from '../styles/common.js';

const EMPTY_FORM = { title: '', description: '', assigneeIdx: 0, dueDate: '' };

export default function CreateTaskModal({ isOpen, mode, assigneeOptions, isSubmitting, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) setForm(EMPTY_FORM);
  }, [isOpen]);

  if (!isOpen) return null;

  const isTimeline = mode === 'timeline';
  const stopPropagation = (e) => e.stopPropagation();
  const onField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={stopPropagation} style={{ width: 420, background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>เพิ่มงานใหม่</div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>ชื่องาน</div>
          <input value={form.title} onChange={onField('title')} placeholder="เช่น ออกแบบหน้า Login" style={input} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>รายละเอียด / เกี่ยวกับอะไร</div>
          <textarea value={form.description} onChange={onField('description')} placeholder="อธิบายว่างานนี้เกี่ยวกับอะไร ต้องทำอะไรบ้าง" style={textarea}></textarea>
        </div>
        {isTimeline && (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>มอบหมายให้</div>
              <select value={form.assigneeIdx} onChange={onField('assigneeIdx')} style={input}>
                <option value="">ทั้งทีม (ไม่ระบุ)</option>
                {assigneeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={label}>กำหนดส่ง</div>
              <input type="date" value={form.dueDate} onChange={onField('dueDate')} style={input} />
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
          <button onClick={() => onSubmit(form)} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มงาน'}
          </button>
        </div>
      </div>
    </div>
  );
}
