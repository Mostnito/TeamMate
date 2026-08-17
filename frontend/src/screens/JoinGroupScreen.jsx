import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { btnPrimary } from '../styles/common.js';
import JoinCodeInput from '../components/JoinCodeInput.jsx';
import { IoMdArrowBack, IoMdArrowForward } from 'react-icons/io';

export default function JoinGroupScreen({ v }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 14 }} onClick={v.goTeams}>
        <IoMdArrowBack size={15} /><span>เข้าร่วมทีม</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, background: '#fff', borderRadius: 16, padding: '34px 28px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><IoMdArrowForward size={24} /></div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 8 }}>เข้าร่วมทีม</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18, lineHeight: 1.6 }}>ใส่รหัสทีม 6 หลักที่ได้รับ<br />จากหัวหน้ากลุ่มเพื่อเข้าร่วม</div>
          <JoinCodeInput digits={v.joinDigits} />
          <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...btnPrimary, width: '100%', padding: 11, borderRadius: 10, fontSize: 13.5, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังเข้าร่วม...' : 'เข้าร่วมทีม'}
          </button>
        </div>
      </div>
    </div>
  );
}
