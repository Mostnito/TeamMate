import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnGhostBlue, statusPill } from '../styles/common.js';

const STATUS_META = {
  pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  under_review: { label: 'รอตรวจ', bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
  overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
};

const PALETTE = [
  { tint: '#EFF6FF', accent: '#2563EB' },
  { tint: '#F3E8FD', accent: '#8B5CF6' },
  { tint: '#FEF3C7', accent: '#D97706' },
  { tint: '#E8F8EE', accent: '#16A34A' }
];

export default function DashboardScreen({ v }) {
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cancelled = false;

    Promise.all([
      axios.get('/api/group/data', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/user/me/tasks', { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([groupsRes, tasksRes]) => {
        if (cancelled) return;
        setTeams(groupsRes.data);
        setTasks(tasksRes.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดข้อมูลแดชบอร์ดไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const upcomingTasks = tasks.slice(0, 4);

  return (
    <div style={{ padding: '26px 28px' }}>
      <div style={{ background: '#2563EB', borderRadius: 14, padding: '18px 22px', color: '#fff', marginBottom: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>ยินดีต้อนรับ, {v.firstNameShort}</div>
        <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 3 }}>นี่คือภาพรวมงานและทีมของคุณวันนี้</div>
      </div>
      <div className="grid-3" style={{ gap: 16, marginBottom: 22 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>ทีมทั้งหมด</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginTop: 4 }}>{isLoading ? '-' : teams.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>งานที่ต้องทำ</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#B45309', marginTop: 4 }}>{isLoading ? '-' : tasks.length}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>คะแนนสะสม</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563EB', marginTop: 4 }}>0</div>
        </div>
      </div>
      <div className="grid-dashboard-split" style={{ gap: 18 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>งานที่ใกล้ครบกำหนด</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcomingTasks.map((t) => {
              const meta = STATUS_META[t.status] || STATUS_META.pending;
              return (
                <div key={t.taskId} onClick={v.openTaskDetail(t.taskId, t.groupId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 9, background: '#F9FAFB', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{t.groupLabel}{t.dueDate ? ` · กำหนดส่ง ${t.dueDate}` : ''}</div>
                  </div>
                  <span style={statusPill(meta.bg, meta.color)}>{meta.label}</span>
                </div>
              );
            })}
            {!isLoading && upcomingTasks.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12.5 }}>ไม่มีงานที่ใกล้ครบกำหนด</div>}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ทีมของฉัน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {teams.map((g) => {
              const { tint, accent } = PALETTE[g.groupId % PALETTE.length];
              const letter = (g.subjectName || '?').trim().charAt(0).toUpperCase();
              return (
                <div key={g.groupId} onClick={v.openTeam(g.groupId)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, cursor: 'pointer', background: '#F9FAFB' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: tint, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11.5 }}>{letter}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{g.subjectCode} · {g.subjectName}</div>
                </div>
              );
            })}
            {!isLoading && teams.length === 0 && <div style={{ textAlign: 'center', padding: '10px 0', color: '#9CA3AF', fontSize: 12.5 }}>ยังไม่มีทีม</div>}
          </div>
          <button onClick={v.goTeams} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูทีมทั้งหมด</button>
        </div>
      </div>
    </div>
  );
}
