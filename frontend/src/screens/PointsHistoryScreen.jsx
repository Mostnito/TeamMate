import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IoMdArrowBack, IoMdAddCircle, IoMdRemoveCircle } from 'react-icons/io';
import { card, page } from '../styles/common.js';

export default function PointsHistoryScreen({ v }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    axios.get('/api/user/me/points/history', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((res) => setHistory(res.data))
      .catch((err) => { if (!axios.isCancel(err)) toast.error(err.response?.data?.error || 'โหลดประวัติคะแนนไม่สำเร็จ'); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <div style={page}>
      <div onClick={v.goBack} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 13.5, marginBottom: 18 }}>
        <IoMdArrowBack size={16} /><span>กลับ</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>ประวัติคะแนน</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>รายการคะแนนทั้งหมด</div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : history.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>ยังไม่มีประวัติคะแนน</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((h) => {
            const isPositive = h.pointsEarned >= 0;
            return (
              <div key={h.pointId} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                <span style={{ color: isPositive ? '#16A34A' : '#DC2626', display: 'flex', flexShrink: 0 }}>
                  {isPositive ? <IoMdAddCircle size={22} /> : <IoMdRemoveCircle size={22} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{h.reason}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {new Date(h.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {h.groupLabel ? ` · ${h.groupLabel}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: isPositive ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                  {isPositive ? '+' : ''}{h.pointsEarned}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
