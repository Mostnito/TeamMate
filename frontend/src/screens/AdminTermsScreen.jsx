import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, textarea, btnPrimary } from '../styles/common.js';

export default function AdminTermsScreen() {
  const [termsOfService, setTermsOfService] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/terms-of-service', { signal: controller.signal })
      .then((res) => setTermsOfService(res.data.termsOfService || ''))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        toast.error('ไม่สามารถโหลดข้อกำหนดการใช้งานได้');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    try {
      await axios.put('/api/admin/settings/terms-of-service', { termsOfService }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('บันทึกข้อกำหนดการใช้งานแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', color: '#6B7280', fontSize: 13 }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '22px 28px', maxWidth: 720 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>ข้อกำหนดการใช้งาน</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>
        ข้อความนี้จะแสดงให้ผู้สมัครอ่านและต้องเลื่อนจนจบก่อนติ๊กยอมรับจึงจะสมัครสมาชิกได้ — หากเว้นว่างไว้ จะไม่มีการบังคับให้ยอมรับข้อกำหนดใด ๆ
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>เนื้อหาข้อกำหนด</div>
        <textarea
          value={termsOfService}
          onChange={(e) => setTermsOfService(e.target.value)}
          placeholder="พิมพ์ข้อกำหนดการใช้งานที่นี่..."
          style={{ ...textarea, minHeight: 320 }}
        ></textarea>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={handleSave} disabled={isSubmitting} style={{ ...btnPrimary, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อกำหนด'}
          </button>
        </div>
      </div>
    </div>
  );
}
