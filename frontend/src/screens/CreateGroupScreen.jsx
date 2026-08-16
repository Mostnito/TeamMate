import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';

export default function CreateGroupScreen({ v }) {
  const [form, setForm] = useState({ subjectCode: '', subjectName: '', advisorName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onField = (field) => (e) => { const val = e.target.value; setForm((f) => ({ ...f, [field]: val })); };

  const handleSubmit = async () => {
    if (!form.subjectCode || !form.subjectName || !form.advisorName) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/group/create', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ subjectCode: '', subjectName: '', advisorName: '' });
      toast.success(res.data.message || 'สร้างกลุ่มสำเร็จ');
      v.onGroupCreated(res.data.groupCode);
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <input value={form.subjectCode} onChange={onField('subjectCode')} placeholder="เช่น 264991" style={input} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={label}>ชื่อวิชา</div>
            <input value={form.subjectName} onChange={onField('subjectName')} placeholder="เช่น Software Engineering" style={input} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={label}>อาจารย์ผู้สอน</div>
            <input value={form.advisorName} onChange={onField('advisorName')} placeholder="ชื่ออาจารย์" style={input} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={v.goDashboard} style={{ ...btnSecondary, flex: 1, padding: 12, borderRadius: 10, fontSize: 13.5 }}>ย้อนกลับ</button>
            <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 12, borderRadius: 10, fontSize: 13.5, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
