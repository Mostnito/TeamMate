import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, inputSm, btnPrimary, btnSecondary, toggle, toggleKnob } from '../styles/common.js';
import AvatarSlot from '../components/AvatarSlot.jsx';

const SKILL_NAME_PATTERN = /^[a-zA-Z฀-๿0-9\s/+#.-]+$/;
function validateSkillOther(raw) {
  const name = (raw || '').trim();
  if (!name) return 'กรุณาระบุชื่อทักษะ';
  if (name.length > 40) return 'ชื่อทักษะยาวเกินไป (ไม่เกิน 40 ตัวอักษร)';
  if (name.split(/\s+/).filter(Boolean).length > 3) return 'ระบุได้ไม่เกิน 3 คำ เช่น "Machine Learning"';
  if (!SKILL_NAME_PATTERN.test(name)) return 'ใช้ได้เฉพาะตัวอักษร ตัวเลข และสัญลักษณ์ / + # . -';
  return '';
}

const emptyForm = { firstName: '', lastName: '', nickname: '', studentId: '', gender: '', birthdate: '', phone: '', skills: [], skillOther: '' };

export default function SettingsScreen({ v }) {
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [genders, setGenders] = useState([]);
  const [skillList, setSkillList] = useState([]);
  const [skillOtherError, setSkillOtherError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get('/api/gender', { signal: controller.signal }),
      axios.get('/api/skill', { signal: controller.signal }),
      axios.get('/api/user/' + v.currentUserId, { headers, signal: controller.signal })
    ]).then(([genderRes, skillRes, userRes]) => {
      setGenders(genderRes.data);
      setSkillList(skillRes.data);
      const u = userRes.data;
      const genderLabel = genderRes.data.find((g) => g.gender_id === u.genderId)?.gender_type || '';
      const loaded = {
        firstName: u.firstName || '', lastName: u.lastName || '', nickname: u.nickname || '',
        studentId: u.studentId || '', gender: genderLabel, birthdate: u.birthdate || '',
        phone: u.phone || '', skills: u.skills || [], skillOther: ''
      };
      setForm(loaded);
      setOriginalForm(loaded);
    }).catch((err) => {
      if (axios.isCancel(err)) return;
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });

    return () => controller.abort();
  }, [v.currentUserId]);

  const showSkillOtherInput = form.skills.includes('อื่น ๆ');

  const toggleGender = (label) => () => setForm((f) => ({ ...f, gender: label }));
  const toggleSkill = (skill) => () => setForm((f) => {
    const has = f.skills.includes(skill);
    return { ...f, skills: has ? f.skills.filter((x) => x !== skill) : [...f.skills, skill] };
  });
  const onSkillOtherChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, skillOther: val }));
    setSkillOtherError(val.trim() ? validateSkillOther(val) : '');
  };
  const onField = (field) => (e) => { const val = e.target.value; setForm((f) => ({ ...f, [field]: val })); };

  const handleCancel = () => {
    setForm(originalForm);
    setSkillOtherError('');
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.nickname) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!form.gender) {
      toast.error('กรุณาเลือกเพศ');
      return;
    }
    if (!form.birthdate) {
      toast.error('กรุณาเลือกวันเกิด');
      return;
    }
    if (!/^[0-9]+$/.test((form.phone || '').trim())) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น');
      return;
    }
    let finalSkills = form.skills;
    if (showSkillOtherInput) {
      const err = validateSkillOther(form.skillOther);
      if (err) { setSkillOtherError(err); toast.error(err); return; }
      finalSkills = form.skills.map((s) => (s === 'อื่น ๆ' ? form.skillOther.trim() : s));
    }

    const genderId = genders.find((g) => g.gender_type === form.gender)?.gender_id || null;
    const token = localStorage.getItem('token');

    setIsSubmitting(true);
    try {
      await axios.put('/api/user/' + v.currentUserId, {
        firstName: form.firstName,
        lastName: form.lastName,
        nickname: form.nickname,
        studentId: form.studentId || null,
        genderId,
        birthdate: form.birthdate,
        phone: form.phone,
        skills: finalSkills
      }, { headers: { Authorization: `Bearer ${token}` } });

      const saved = { ...form, skills: finalSkills, skillOther: '' };
      setForm(saved);
      setOriginalForm(saved);
      v.updateCurrentUser({ name: form.nickname, firstName: form.nickname, studentId: form.studentId || '' });
      toast.success('บันทึกการตั้งค่าแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', color: '#6B7280', fontSize: 13 }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '22px 28px', maxWidth: 640 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>การตั้งค่า</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>จัดการข้อมูลส่วนตัวและการแจ้งเตือน</div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>ข้อมูลส่วนตัว</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <AvatarSlot
            userId={v.currentUserId}
            imageUrl={v.currentUserAvatarUrl}
            onUploaded={(url) => v.updateCurrentUser({ avatarUrl: url })}
          />
          <div style={{ fontSize: 11.5, color: '#6B7280' }}>คลิกหรือลากรูปมาวงเพื่อเปลี่ยนรูปโปรไฟล์<br />แนะนำขนาด 200×200px</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>ชื่อจริง</div>
            <input value={form.firstName} onChange={onField('firstName')} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>นามสกุล</div>
            <input value={form.lastName} onChange={onField('lastName')} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>ชื่อเล่น</div>
            <input value={form.nickname} onChange={onField('nickname')} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>รหัสนิสิต</div>
            <input value={form.studentId} onChange={onField('studentId')} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>วันเกิด</div>
            <input type="date" value={form.birthdate} onChange={onField('birthdate')} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>เบอร์โทรศัพท์</div>
            <input value={form.phone} onChange={onField('phone')} style={inputSm} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>เพศ</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {genders.map((g) => {
              const selected = form.gender === g.gender_type;
              return (
                <div key={g.gender_id} onClick={toggleGender(g.gender_type)} style={{ padding: '9px 16px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: selected ? '#2563EB' : '#F3F4F6', color: selected ? '#fff' : '#6B7280', fontWeight: 600 }}>{g.gender_type}</div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 10 }}>ทักษะของฉัน</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[...skillList.map((s) => s.skill_name), 'อื่น ๆ'].map((label) => {
            const selected = form.skills.includes(label);
            return (
              <div key={label} onClick={toggleSkill(label)} style={{ padding: '8px 15px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: selected ? '#2563EB' : '#F3F4F6', color: selected ? '#fff' : '#6B7280', fontWeight: 600 }}>{label}</div>
            );
          })}
        </div>
        {showSkillOtherInput && (
          <>
            <input value={form.skillOther} onChange={onSkillOtherChange} placeholder="โปรดระบุความถนัดอื่น ๆ" style={{ ...inputSm, borderRadius: 9, padding: '10px 13px', marginTop: 10 }} />
            {skillOtherError && <div style={{ color: '#DC2626', fontSize: 11.5, marginTop: 6 }}>{skillOtherError}</div>}
          </>
        )}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>การแจ้งเตือน</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {v.notificationToggles.map((tg) => (
            <div key={tg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{tg.label}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{tg.desc}</div>
              </div>
              <div onClick={tg.onToggle} style={toggle(tg.knobLeft === '21px')}>
                <div style={toggleKnob(tg.knobLeft === '21px')}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={handleCancel} style={btnSecondary}>ยกเลิก</button>
        <button onClick={handleSave} disabled={isSubmitting} style={{ ...btnPrimary, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );
}
