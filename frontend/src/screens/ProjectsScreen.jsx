import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnGhostBlue } from '../styles/common.js';

const PALETTE = [
  { tint: '#EFF6FF', accent: '#2563EB' },
  { tint: '#F3E8FD', accent: '#8B5CF6' },
  { tint: '#FEF3C7', accent: '#D97706' },
  { tint: '#E8F8EE', accent: '#16A34A' }
];

export default function ProjectsScreen({ v }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cancelled = false;

    axios.get('/api/group/data', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (cancelled) return;
        setGroups(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดข้อมูลโปรเจกต์ไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>โปรเจ็ก</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>ภาพรวมความคืบหน้าของงานในแต่ละโปรเจกต์ที่คุณเข้าร่วม</div>
      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : groups.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีทีม</div>
      ) : (
        <div className="grid-2" style={{ gap: 18 }}>
          {groups.map((g) => {
            const { tint, accent } = PALETTE[g.groupId % PALETTE.length];
            const letter = (g.subjectName || '?').trim().charAt(0).toUpperCase();
            const pct = g.taskCount > 0 ? Math.round((g.completedTaskCount / g.taskCount) * 100) : 0;
            return (
              <div key={g.groupId} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: tint, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{letter}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{g.subjectName}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>รหัสวิชา {g.subjectCode}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11.5, color: '#6B7280' }}>ความคืบหน้า</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{pct}%</div>
                </div>
                <div style={{ height: 7, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', background: '#2563EB', borderRadius: 4, width: pct + '%' }}></div>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>เสร็จแล้ว {g.completedTaskCount} จาก {g.taskCount} งาน</div>
                <button onClick={v.openTeamTasks(g.groupId)} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูงานของโปรเจกต์นี้</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
