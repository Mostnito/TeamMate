import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { btnPrimary } from '../styles/common.js';
import JoinCodeInput from '../components/JoinCodeInput.jsx';
import { IoMdAdd, IoMdArrowForward } from 'react-icons/io';

export default function DashboardEmptyScreen({ v }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const groupCode = v.joinDigits.map((d) => d.val).join('');
    if (groupCode.length < 6) {
      toast.error('กรุณากรอกรหัสให้ครบ 6 หลัก');
      return;
    }

    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/group/join', { groupCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || 'เข้าร่วมกลุ่มสำเร็จ');
      v.onGroupJoined();
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '26px 28px', minHeight: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#2563EB', borderRadius: 14, padding: '18px 22px', color: '#fff', marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>ยินดีต้อนรับ, {v.firstNameShort}</div>
        <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 3 }}>เริ่มต้นสร้างหรือเข้าร่วมทีมเพื่อทำงานร่วมกัน</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, maxWidth: 920, width: '100%' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '34px 28px', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><IoMdAdd size={24} /></div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 8 }}>สร้างทีมใหม่</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 22, lineHeight: 1.6 }}>สำหรับหัวหน้ากลุ่ม<br />สร้างทีมใหม่และเชิญเพื่อนเข้าร่วม</div>
            <button onClick={v.goCreateGroup} style={{ ...btnPrimary, padding: '10px 26px' }}>สร้างทีม</button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '34px 28px', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><IoMdArrowForward size={24} /></div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 8 }}>เข้าร่วมทีม</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 1.6 }}>ใส่รหัสทีม 6 หลักที่ได้รับ<br />จากหัวหน้ากลุ่มเพื่อเข้าร่วม</div>
            <JoinCodeInput digits={v.joinDigits} />
            <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...btnPrimary, padding: '10px 26px', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'กำลังเข้าร่วม...' : 'เข้าร่วมทีม'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
