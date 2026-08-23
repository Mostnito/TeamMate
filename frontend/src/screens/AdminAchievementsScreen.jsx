import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, avatar, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdAdd, IoMdRibbon } from 'react-icons/io';
import AchievementModal from '../components/AchievementModal.jsx';

const METRIC_LABELS = {
  groups_created: 'กลุ่มที่สร้าง',
  groups_joined: 'กลุ่มที่เข้าร่วม',
  tasks_submitted: 'งานที่ส่ง',
  tasks_reviewed: 'งานที่ตรวจ',
  evaluations_submitted: 'การประเมินเพื่อนร่วมทีม',
  calendar_events_created: 'กิจกรรมที่สร้าง'
};

export default function AdminAchievementsScreen() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metricFilter, setMetricFilter] = useState('all');
  const [countSort, setCountSort] = useState(null);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchAchievements = () => {
    axios.get('/api/admin/achievements', authHeaders())
      .then((res) => setAchievements(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายการความสำเร็จไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchAchievements(); }, []);

  const openCreate = () => { setModalTarget(null); setModalOpen(true); };
  const openEdit = (a) => { setModalTarget(a); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); fetchAchievements(); };

  const handleSubmit = (form) => {
    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      metric: form.metric, threshold: parseInt(form.threshold, 10), pointsReward: parseInt(form.pointsReward, 10)
    };
    if (!payload.name) {
      toast.error('กรุณากรอกชื่อความสำเร็จ');
      return;
    }
    setIsSubmitting(true);
    const request = modalTarget?.achievementId
      ? axios.put(`/api/admin/achievements/${modalTarget.achievementId}`, payload, authHeaders())
      : axios.post('/api/admin/achievements', payload, authHeaders());

    request
      .then((res) => {
        toast.success(res.data.message || (modalTarget?.achievementId ? 'บันทึกการแก้ไขสำเร็จ' : 'สร้างความสำเร็จสำเร็จ'));
        setModalTarget(res.data);
        fetchAchievements();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSubmitting(false));
  };

  const handleIconUploaded = (imgPath) => {
    setModalTarget((t) => (t ? { ...t, imgPath } : t));
    fetchAchievements();
  };

  const handleToggleActive = (a) => {
    axios.put(`/api/admin/achievements/${a.achievementId}`, { isActive: !a.isActive }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || (a.isActive ? 'ปิดใช้งานความสำเร็จสำเร็จ' : 'เปิดใช้งานความสำเร็จสำเร็จ'));
        fetchAchievements();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const filteredAchievements = (metricFilter === 'all' ? achievements : achievements.filter((a) => a.metric === metricFilter)).slice();
  if (countSort === 'most') filteredAchievements.sort((a, b) => b.earnedCount - a.earnedCount);
  else if (countSort === 'least') filteredAchievements.sort((a, b) => a.earnedCount - b.earnedCount);

  return (
    <div style={{ padding: '22px 28px' }}>
      <AchievementModal
        isOpen={modalOpen}
        achievement={modalTarget}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onIconUploaded={handleIconUploaded}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>จัดการความสำเร็จ</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>สร้าง แก้ไข และปิด/เปิดใช้งาน achievement badge</div>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> เพิ่มความสำเร็จ</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9, padding: '6px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>ประเภท</span>
          <select value={metricFilter} onChange={(e) => setMetricFilter(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none' }}>
            <option value="all">ทั้งหมด</option>
            {Object.entries(METRIC_LABELS).map(([key, l]) => (
              <option key={key} value={key}>{l}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9, padding: '6px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>จำนวนคนที่ได้รับ</span>
          <select value={countSort || ''} onChange={(e) => setCountSort(e.target.value || null)} style={{ border: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none' }}>
            <option value="">ไม่เรียง</option>
            <option value="most">มากที่สุด</option>
            <option value="least">น้อยที่สุด</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : achievements.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีความสำเร็จ กดปุ่มด้านบนเพื่อเพิ่ม</div>
      ) : filteredAchievements.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่พบความสำเร็จที่ตรงกับตัวกรอง</div>
      ) : (
        <div className="grid-3" style={{ gap: 16 }}>
          {filteredAchievements.map((a) => {
            const tint = a.isActive ? '#FEF3C7' : '#F3F4F6';
            const accent = a.isActive ? '#D97706' : '#9CA3AF';
            return (
              <div key={a.achievementId} style={{ ...card, opacity: a.isActive ? 1 : 0.55 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  {a.imgPath ? (
                    <img src={a.imgPath} alt={a.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={avatar(tint, accent, 44)}><IoMdRibbon size={22} /></div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{a.name}</div>
                  </div>
                  {!a.isActive && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>ปิดใช้งาน</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, minHeight: 18 }}>{a.description || '(ไม่มีคำอธิบาย)'}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{METRIC_LABELS[a.metric] || a.metric} ≥ {a.threshold}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '4px 10px', borderRadius: 6 }}>+{a.pointsReward} คะแนน</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 6 }}>ได้รับแล้ว {a.earnedCount} คน</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(a)} style={{ ...btnSecondary, flex: 1, padding: 9 }}>แก้ไข</button>
                  <button
                    onClick={() => handleToggleActive(a)}
                    style={{
                      flex: 1, background: a.isActive ? '#FEE2E2' : '#E8F8EE', color: a.isActive ? '#DC2626' : '#16A34A',
                      border: 'none', padding: 9, borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {a.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
