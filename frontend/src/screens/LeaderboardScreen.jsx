import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IoMdTrophy } from 'react-icons/io';

const PERIODS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'monthly', label: 'รายเดือน' },
  { key: 'weekly', label: 'รายสัปดาห์' },
  { key: 'daily', label: 'รายวัน' }
];

const PALETTE = [
  { tint: '#EFF6FF', accent: '#2563EB' },
  { tint: '#F3E8FD', accent: '#8B5CF6' },
  { tint: '#FEF3C7', accent: '#D97706' },
  { tint: '#E8F8EE', accent: '#16A34A' }
];

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState('all');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let cancelled = false;
    setIsLoading(true);

    axios.get(`/api/leaderboard?period=${period}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.map((r, i) => {
          const { tint, accent } = PALETTE[r.userId % PALETTE.length];
          return {
            ...r,
            rank: i + 1,
            name: `${r.firstName} ${r.lastName}`,
            initials: (r.firstName.charAt(0) + r.lastName.charAt(0)).toUpperCase(),
            tint, accent
          };
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดอันดับคะแนนไม่สำเร็จ');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [period]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>อันดับคะแนน</div>
        <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 9, padding: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          {PERIODS.map((p) => (
            <div key={p.key} onClick={() => setPeriod(p.key)} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: period === p.key ? '#2563EB' : 'transparent', color: period === p.key ? '#fff' : '#6B7280' }}>{p.label}</div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>กำลังโหลด...</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>ยังไม่มีข้อมูลอันดับคะแนน</div>
      ) : (
        <>
          <div className="grid-3" style={{ gap: 16, marginBottom: 22, maxWidth: 920, marginLeft: 'auto', marginRight: 'auto' }}>
            {podium.map((row) => (
              <div key={row.userId} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: row.rank === 1 ? '1.5px solid #2563EB' : '1px solid #F3F4F6', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      position: 'relative', width: 38, height: 38, borderRadius: '50%', color: row.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                      background: row.avatarUrl ? `${row.tint} url(${row.avatarUrl}) center/cover no-repeat` : row.tint
                    }}>
                      {!row.avatarUrl && row.initials}
                      {row.rank === 1 && <span style={{ position: 'absolute', top: -8, right: -6, color: '#D97706' }}><IoMdTrophy size={16} /></span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{row.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{row.studentId}</div>
                    </div>
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#F3F4F6', color: '#374151', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{row.rank}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.3 }}>คะแนน</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>{row.points}</div>
                </div>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 6px 18px rgba(0,0,0,0.05)', overflow: 'hidden', maxWidth: 920, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px 2fr 1fr', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.4, borderBottom: '1px solid #F3F4F6' }}>
                <div>อันดับ</div><div>ชื่อ</div><div>คะแนน</div>
              </div>
              {rest.map((row) => (
                <div key={row.userId} style={{ display: 'grid', gridTemplateColumns: '56px 2fr 1fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F9FAFB' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280' }}>{row.rank}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', color: row.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11.5,
                      background: row.avatarUrl ? `${row.tint} url(${row.avatarUrl}) center/cover no-repeat` : row.tint
                    }}>{!row.avatarUrl && row.initials}</div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{row.name}</div>
                      <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{row.studentId}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#2563EB' }}>{row.points}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
