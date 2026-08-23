import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IoMdRibbon } from 'react-icons/io';
import { card, avatar } from '../styles/common.js';

export default function AchievementsScreen({ v }) {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');

    axios.get(`/api/user/${v.currentUserId}/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    }).then((res) => {
      setAchievements(res.data);
    }).catch((err) => {
      if (axios.isCancel(err)) return;
      toast.error('ไม่สามารถโหลดความสำเร็จได้');
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });

    return () => controller.abort();
  }, [v.currentUserId]);

  if (isLoading) {
    return <div style={{ padding: '22px 28px', color: '#6B7280', fontSize: 13 }}>กำลังโหลด...</div>;
  }

  const earnedCount = achievements.filter((a) => a.isEarned).length;

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>ความสำเร็จ</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>ปลดล็อกแล้ว {earnedCount} จาก {achievements.length} รายการ</div>

      {achievements.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>ยังไม่มีความสำเร็จให้ปลดล็อก</div>
      ) : (
        <div className="grid-3" style={{ gap: 16 }}>
          {achievements.map((a) => {
            const tint = a.isEarned ? '#FEF3C7' : '#F3F4F6';
            const accent = a.isEarned ? '#D97706' : '#9CA3AF';
            return (
              <div key={a.achievementId} style={{ ...card, opacity: a.isEarned ? 1 : 0.75 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {a.imgPath ? (
                    <img src={a.imgPath} alt={a.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={avatar(tint, accent, 44)}>
                      <IoMdRibbon size={22} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>+{a.pointsReward} คะแนน</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>{a.description}</div>
                {a.isEarned ? (
                  <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                    ได้รับเมื่อ {new Date(a.earnedAt).toLocaleDateString('th-TH')}
                  </div>
                ) : (
                  <div>
                    <div style={{ height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden', marginBottom: 5 }}>
                      <div style={{ height: '100%', width: `${a.progressPercent}%`, background: '#2563EB', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{a.currentValue} / {a.threshold}</div>
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
