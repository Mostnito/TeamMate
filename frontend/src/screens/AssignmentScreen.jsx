import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { statusPill } from '../styles/common.js';

const STATUS_META = {
  pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  under_review: { label: 'รอตรวจ', bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
  overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
};

export default function AssignmentScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cancelled = false;

    axios.get('/api/user/me/assigned-tasks', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (cancelled) return;
        setTasks(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดงานที่มอบหมายไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>งานที่มอบหมาย</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>งานที่คุณได้รับมอบหมายในทุกทีม</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        <div
          onClick={() => setFilter('all')}
          style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === 'all' ? '#2563EB' : '#fff', color: filter === 'all' ? '#fff' : '#6B7280', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          ทั้งหมด
        </div>
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div
            key={key}
            onClick={() => setFilter(key)}
            style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === key ? '#2563EB' : '#fff', color: filter === key ? '#fff' : '#6B7280', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            {meta.label}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>{tasks.length === 0 ? 'ไม่มีงานที่ได้รับมอบหมาย' : 'ไม่มีงานในสถานะนี้'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.map((t) => {
            const meta = STATUS_META[t.status] || STATUS_META.pending;
            return (
              <div key={t.taskId} onClick={v.openTaskDetail(t.taskId, t.groupId)} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{t.title}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 4 }}>{t.groupLabel}{t.dueDate ? ` · กำหนดส่ง ${t.dueDate}` : ''}</div>
                </div>
                <span style={statusPill(meta.bg, meta.color)}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
