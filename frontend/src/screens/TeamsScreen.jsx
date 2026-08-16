import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnPrimary, btnGhostBlue } from '../styles/common.js';

const PALETTE = [
  { tint: '#EFF6FF', accent: '#2563EB' },
  { tint: '#F3E8FD', accent: '#8B5CF6' },
  { tint: '#FEF3C7', accent: '#D97706' },
  { tint: '#E8F8EE', accent: '#16A34A' }
];

export default function TeamsScreen({ v }) {
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
        toast.error(err.response?.data?.error || 'โหลดรายชื่อทีมไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: '26px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>ทีมของฉัน</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={v.goJoinGroup} style={btnGhostBlue}>เข้าร่วมทีม</button>
          <button onClick={v.goCreateGroup} style={btnPrimary}>+ สร้างทีมใหม่</button>
        </div>
      </div>
      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : groups.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีทีม สร้างหรือเข้าร่วมทีมได้ที่ปุ่มด้านบน</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {groups.map((g, i) => {
            const { tint, accent } = PALETTE[g.groupId % PALETTE.length];
            const letter = (g.subjectName || '?').trim().charAt(0).toUpperCase();
            return (
              <div key={g.groupId} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: tint, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{letter}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{g.subjectName}</div>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>{g.subjectCode}</div>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 12 }}>👥 {g.memberCount} สมาชิก &nbsp;·&nbsp; ☑ 0 งาน</div>
                <button onClick={v.openTeam(g.groupId)} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูและเลือกทีม</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
