import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IoMdArrowBack } from 'react-icons/io';

const STATUS_META = {
  pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  under_review: { label: 'รอตรวจ', bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
  overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
};

export default function TeamProgressScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (v.teamId == null) { setIsLoading(false); return; }
    const token = localStorage.getItem('token');
    let cancelled = false;

    axios.get(`/api/group/${v.teamId}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!cancelled) setTasks(res.data); })
      .catch((err) => { if (!cancelled) toast.error(err.response?.data?.error || 'โหลดข้อมูลความคืบหน้าไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [v.teamId]);

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overallProgress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 700, fontSize: 15, marginBottom: 18, cursor: 'pointer' }} onClick={v.backToTeamDetail}>
        <IoMdArrowBack size={16} /><span>ความคืบหน้า</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>ความคืบหน้าโดยรวม</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2563EB' }}>{overallProgress}%</div>
        </div>
        <div style={{ height: 8, background: '#EEF2F7', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#2563EB', borderRadius: 5, width: overallProgress + '%' }}></div>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>{completedCount} จาก {tasks.length} งานเสร็จแล้ว</div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ความคืบหน้างาน</div>
      {tasks.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีงานในทีมนี้</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((task) => {
            const meta = STATUS_META[task.status] || STATUS_META.pending;
            return (
              <div key={task.taskId} onClick={v.openTaskDetail(task.taskId)} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }}></span>
                  <span style={{ fontSize: 12.5, color: '#111827', fontWeight: 500 }}>{task.title}</span>
                  {task.assigneeName && <span style={{ fontSize: 11, color: '#9CA3AF' }}>&nbsp;· {task.assigneeName}</span>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: meta.bg, color: meta.color }}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
