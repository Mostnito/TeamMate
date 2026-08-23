import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, textarea, btnPrimary, btnSecondary } from '../styles/common.js';

const EMPTY_FORM = { name: '', description: '', metric: 'groups_created', threshold: 1, pointsReward: 0 };

const METRIC_OPTIONS = [
  { value: 'groups_created', label: 'กลุ่มที่สร้าง' },
  { value: 'groups_joined', label: 'กลุ่มที่เข้าร่วม' },
  { value: 'tasks_submitted', label: 'งานที่ส่ง' },
  { value: 'tasks_reviewed', label: 'งานที่ตรวจ' },
  { value: 'evaluations_submitted', label: 'การประเมินเพื่อนร่วมทีม' },
  { value: 'calendar_events_created', label: 'กิจกรรมที่สร้าง' }
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function AchievementModal({ isOpen, achievement, isSubmitting, onClose, onSubmit, onIconUploaded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(achievement ? {
      name: achievement.name, description: achievement.description || '',
      metric: achievement.metric, threshold: achievement.threshold, pointsReward: achievement.pointsReward
    } : EMPTY_FORM);
  }, [isOpen, achievement?.achievementId]);

  if (!isOpen) return null;

  const stopPropagation = (e) => e.stopPropagation();
  const onField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const uploadIcon = async (file) => {
    if (!file || !achievement?.achievementId) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('ไฟล์ต้องมีขนาดไม่เกิน 2MB');
      return;
    }
    const formData = new FormData();
    formData.append('icon', file);
    const token = localStorage.getItem('token');

    setIsUploadingIcon(true);
    try {
      const res = await axios.post(`/api/admin/achievements/${achievement.achievementId}/icon`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onIconUploaded(res.data.imgPath);
      toast.success(res.data.message || 'อัปโหลดไอคอนสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploadingIcon(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={stopPropagation} style={{ width: 440, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>
          {achievement ? 'แก้ไขความสำเร็จ' : 'เพิ่มความสำเร็จใหม่'}
        </div>

        {achievement?.achievementId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div
              onClick={() => document.getElementById('achievement-icon-input')?.click()}
              style={{
                width: 60, height: 60, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                background: achievement.imgPath ? `#F3F4F6 url(${achievement.imgPath}) center/cover no-repeat` : '#F3F4F6',
                border: '1.5px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9CA3AF', fontSize: 10, textAlign: 'center', position: 'relative', overflow: 'hidden'
              }}
            >
              {!achievement.imgPath && !isUploadingIcon && 'ไอคอน'}
              {isUploadingIcon && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>กำลังอัปโหลด...</div>
              )}
              <input id="achievement-icon-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { uploadIcon(e.target.files[0]); e.target.value = ''; }} style={{ display: 'none' }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#6B7280' }}>คลิกเพื่ออัปโหลดไอคอน<br />JPG, PNG, WEBP ไม่เกิน 2MB</div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={label}>ชื่อความสำเร็จ</div>
          <input value={form.name} onChange={onField('name')} placeholder="เช่น ผู้ก่อตั้ง" style={input} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>คำอธิบาย</div>
          <textarea value={form.description} onChange={onField('description')} placeholder="อธิบายเงื่อนไขการได้รับความสำเร็จนี้" style={textarea}></textarea>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>ประเภท</div>
          <select value={form.metric} onChange={onField('metric')} style={input}>
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="grid-2" style={{ gap: 12, marginBottom: 6 }}>
          <div>
            <div style={label}>จำนวน</div>
            <input type="number" min="1" value={form.threshold} onChange={onField('threshold')} style={input} />
          </div>
          <div>
            <div style={label}>คะแนน</div>
            <input type="number" min="0" value={form.pointsReward} onChange={onField('pointsReward')} style={input} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>
            {achievement?.achievementId ? 'เสร็จสิ้น' : 'ยกเลิก'}
          </button>
          <button onClick={() => onSubmit(form)} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังบันทึก...' : achievement?.achievementId ? 'บันทึกการแก้ไข' : 'สร้างความสำเร็จ'}
          </button>
        </div>
      </div>
    </div>
  );
}
