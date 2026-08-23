import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnPrimary, btnGhostBlue } from '../styles/common.js';
import { IoMdAdd, IoMdCopy, IoMdCheckmark } from 'react-icons/io';

const PALETTE = [
  { tint: '#EFF6FF', accent: '#2563EB' },
  { tint: '#F3E8FD', accent: '#8B5CF6' },
  { tint: '#FEF3C7', accent: '#D97706' },
  { tint: '#E8F8EE', accent: '#16A34A' }
];

export default function TeamsScreen({ v }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (groupId, code) => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(groupId);
    setTimeout(() => setCopiedId((id) => (id === groupId ? null : id)), 1500);
  };

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
          <button onClick={v.goCreateGroup} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> สร้างทีมใหม่</button>
        </div>
      </div>
      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : groups.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีทีม สร้างหรือเข้าร่วมทีมได้ที่ปุ่มด้านบน</div>
      ) : (
        <div className="grid-2" style={{ gap: 18 }}>
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
                <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 12 }}>{g.memberCount} สมาชิก &nbsp;·&nbsp; {g.taskCount} งาน</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10.5, color: '#9CA3AF', marginBottom: 4 }}>รหัสเชิญทีม (ให้เพื่อนใช้รหัสนี้เพื่อเข้าร่วมทีมนี้)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: 1.5, color: '#1D4ED8', background: '#EFF6FF', padding: '4px 10px', borderRadius: 6 }}>{g.groupCode}</span>
                    <span onClick={() => handleCopyCode(g.groupId, g.groupCode)} style={{ cursor: 'pointer', color: copiedId === g.groupId ? '#16A34A' : '#6B7280', display: 'flex', alignItems: 'center' }}>
                      {copiedId === g.groupId ? <IoMdCheckmark size={15} /> : <IoMdCopy size={15} />}
                    </span>
                  </div>
                </div>
                <button onClick={v.openTeam(g.groupId)} style={{ ...btnGhostBlue, width: '100%', padding: 9 }}>ดูและเลือกทีม</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
