import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnSecondary } from '../styles/common.js';
import { IoMdArrowBack, IoMdLink, IoMdRibbon } from 'react-icons/io';

export default function UserProfileScreen({ v }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!v.viewedPublicId) return;
    const controller = new AbortController();
    setIsLoading(true);
    axios.get(`/api/profile/${v.viewedPublicId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      signal: controller.signal
    }).then((res) => setProfile(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        toast.error(err.response?.data?.error || 'โหลดโปรไฟล์ไม่สำเร็จ');
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [v.viewedPublicId]);

  return (
    <div style={{ padding: '22px 28px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div onClick={v.goBack} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#374151', fontWeight: 600, fontSize: 13.5 }}>
          <IoMdArrowBack size={16} /><span>กลับ</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : !profile ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่พบผู้ใช้งานนี้</div>
      ) : (
        <>
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>ข้อมูลผู้ใช้</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0, color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22,
                background: profile.avatarUrl ? `#EFF6FF url(${profile.avatarUrl}) center/cover no-repeat` : '#EFF6FF'
              }}>
                {!profile.avatarUrl && (profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{profile.firstName} {profile.lastName}</span>
                  {profile.title && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '3px 10px', borderRadius: 10 }}>{profile.title}</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 3 }}>{profile.nickname} {profile.studentId ? `· ${profile.studentId}` : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginTop: 16, fontSize: 12, color: '#6B7280' }}>
              {profile.email && <div>อีเมล: {profile.email}</div>}
              {profile.phone && <div>เบอร์: {profile.phone}</div>}
            </div>
            {profile.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                {profile.skills.map((sk) => (
                  <span key={sk} style={{ fontSize: 11.5, background: '#F3F4F6', color: '#374151', padding: '6px 14px', borderRadius: 20, fontWeight: 600 }}>{sk}</span>
                ))}
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>ความสำเร็จ ({profile.achievements.length})</div>
            {profile.achievements.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>ยังไม่มีความสำเร็จ</div>
            ) : (
              <div className="grid-3" style={{ gap: 14 }}>
                {profile.achievements.map((a) => (
                  <div key={a.achievementId} style={{ background: '#F9FAFB', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      {a.imgPath ? (
                        <img src={a.imgPath} alt={a.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IoMdRibbon size={18} />
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: '#111827' }}>{a.name}</div>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>ได้รับเมื่อ {new Date(a.earnedAt).toLocaleDateString('th-TH')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
