import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IoMdCheckmark, IoMdCloseCircle } from 'react-icons/io';

const TYPE_STYLE = {
  chat_message: { bg: '#EFF6FF', color: '#2563EB' },
  user: { bg: '#FEE2E2', color: '#DC2626' },
  file: { bg: '#F3E8FD', color: '#8B5CF6' }
};

const STATUS_LABELS = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ปฏิเสธแล้ว' };

export default function AdminScreen() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchReports = () => {
    axios.get('/api/admin/reports', authHeaders())
      .then((res) => setReports(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายการรายงานไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleResolve = (reportId, status) => {
    axios.patch(`/api/admin/reports/${reportId}`, { status }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'บันทึกผลการตรวจสอบสำเร็จ');
        fetchReports();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const filteredReports = reports.filter((r) => r.status === filter);

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 6 }}>รายงาน</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>ตรวจสอบรายงานจากผู้ใช้</div>

      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', width: 200, boxShadow: '0 4px 14px rgba(0,0,0,0.04)', marginBottom: 20 }}>
        <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>รอตรวจสอบ</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#D97706', marginTop: 4 }}>{isLoading ? '-' : pendingCount}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 11, padding: 5, marginBottom: 18, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} onClick={() => setFilter(key)} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: filter === key ? '#2563EB' : 'transparent', color: filter === key ? '#fff' : '#6B7280' }}>{label}</div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280', fontSize: 13 }}>กำลังโหลด...</div>
      ) : filteredReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280', fontSize: 13 }}>ไม่มีรายการในสถานะนี้</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredReports.map((item) => {
            const typeStyle = TYPE_STYLE[item.type] || TYPE_STYLE.file;
            return (
              <div key={item.reportId} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: typeStyle.bg, color: typeStyle.color }}>{item.typeLabel}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{new Date(item.createdAt).toLocaleString('th-TH')}</span>
                </div>
                {item.type === 'chat_message' && (
                  <div style={{ background: '#F9FAFB', borderLeft: '3px solid #D1D5DB', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 10.5, color: '#9CA3AF', marginBottom: 3 }}>ข้อความที่ถูกรายงาน — จาก {item.targetUserName}</div>
                    <div style={{ fontSize: 12.5, color: '#111827' }}>{item.targetMessageContent}</div>
                  </div>
                )}
                {item.type === 'user' && (
                  <div style={{ fontSize: 12.5, color: '#111827', fontWeight: 600, marginBottom: 6 }}>ผู้ถูกรายงาน: {item.targetUserName}</div>
                )}
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>เหตุผลจากผู้แจ้ง: {item.detail || '(ไม่มีรายละเอียดเพิ่มเติม)'}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: item.status === 'pending' ? 12 : 0 }}>ผู้ยื่นคำขอ: {item.reporterName} &nbsp;·&nbsp; กลุ่ม: {item.groupLabel}</div>
                {item.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleResolve(item.reportId, 'approved')} style={{ background: '#E8F8EE', color: '#16A34A', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdCheckmark size={14} /> อนุมัติ</button>
                    <button onClick={() => handleResolve(item.reportId, 'rejected')} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdCloseCircle size={14} /> ปฏิเสธ</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
