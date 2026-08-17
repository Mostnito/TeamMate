import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary } from '../styles/common.js';
import { IoMdArrowBack } from 'react-icons/io';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// keeps free-text "อื่น ๆ" skill entries shaped like a skill name (e.g. "Machine Learning"),
// not a sentence (e.g. "I love my job") -- checked before it's ever sent anywhere
const SKILL_NAME_PATTERN = /^[a-zA-Z฀-๿0-9\s/+#.-]+$/;
function validateSkillOther(raw) {
  const name = (raw || '').trim();
  if (!name) return 'กรุณาระบุชื่อทักษะ';
  if (name.length > 40) return 'ชื่อทักษะยาวเกินไป (ไม่เกิน 40 ตัวอักษร)';
  if (name.split(/\s+/).filter(Boolean).length > 3) return 'ระบุได้ไม่เกิน 3 คำ เช่น "Machine Learning"';
  if (!SKILL_NAME_PATTERN.test(name)) return 'ใช้ได้เฉพาะตัวอักษร ตัวเลข และสัญลักษณ์ / + # . -';
  return '';
}

export default function SignupScreen({ v }) {
  const [genders, setGenders] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillOtherError, setSkillOtherError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/gender', { signal: controller.signal })
      .then((res) => setGenders(res.data))
      .catch((err) => { if (!axios.isCancel(err)) setGenders([]); });
    axios.get('/api/skill', { signal: controller.signal })
      .then((res) => setSkills(res.data))
      .catch((err) => { if (!axios.isCancel(err)) setSkills([]); });
    return () => controller.abort();
  }, []);

  const onSkillOtherChange = (e) => {
    v.onSuSkillOther(e);
    setSkillOtherError(e.target.value.trim() ? validateSkillOther(e.target.value) : '');
  };

  const handleSubmit = async () => {
    const su = v.su;

    // 1) frontend validation -- checked before we ever call the api
    if (!su.firstName || !su.lastName || !su.nickname || !su.email) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!su.gender) {
      toast.error('กรุณาเลือกเพศ');
      return;
    }
    if (!su.birthdate) {
      toast.error('กรุณาเลือกวันเกิด');
      return;
    }
    if (!/^[0-9]+$/.test((su.phone || '').trim())) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น');
      return;
    }
    if (!EMAIL_PATTERN.test(su.email)) {
      toast.error('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    if (!su.password || su.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (su.password !== su.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }
    let finalSkills = su.skills;
    if (v.showSkillOtherInput) {
      const err = validateSkillOther(su.skillOther);
      if (err) { setSkillOtherError(err); toast.error(err); return; }
      finalSkills = su.skills.map((s) => (s === 'อื่น ๆ' ? su.skillOther.trim() : s));
    }

    const genderId = genders.find((g) => g.gender_type === su.gender)?.gender_id || null;

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/register', {
        firstName: su.firstName,
        lastName: su.lastName,
        nickname: su.nickname,
        studentId: su.studentId || null,
        genderId,
        birthdate: su.birthdate || null,
        email: su.email,
        phone: su.phone || null,
        skills: finalSkills,
        password: su.password
      });
      toast.success(res.data.message || 'สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
      v.resetSu();
      v.goLogin();
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ height: 56, background: '#2563EB', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={v.goLogin}>
        <IoMdArrowBack size={16} /><span>สมัครสมาชิก TeamMate</span>
      </div>
      <div style={{ maxWidth: 760, margin: '28px auto', background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
          <div>
            <div style={label}>ชื่อจริง</div>
            <input value={v.su.firstName} onChange={v.onSuFirstName} placeholder="ชื่อจริง" style={input} />
          </div>
          <div>
            <div style={label}>นามสกุล</div>
            <input value={v.su.lastName} onChange={v.onSuLastName} placeholder="นามสกุล" style={input} />
          </div>
          <div>
            <div style={label}>ชื่อเล่น</div>
            <input value={v.su.nickname} onChange={v.onSuNickname} placeholder="ชื่อเล่น" style={input} />
          </div>
          <div>
            <div style={label}>รหัสนิสิต</div>
            <input value={v.su.studentId} onChange={v.onSuStudentId} placeholder="65x xxxxxx" style={input} />
          </div>
          <div>
            <div style={label}>เพศ</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {genders.map((g) => {
                const selected = v.su.gender === g.gender_type;
                return (
                  <div key={g.gender_id} onClick={v.toggleGender(g.gender_type)} style={{ padding: '9px 16px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: selected ? '#2563EB' : '#F3F4F6', color: selected ? '#fff' : '#6B7280', fontWeight: 600 }}>{g.gender_type}</div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={label}>วันเกิด</div>
            <input type="date" value={v.su.birthdate} onChange={v.onSuBirthdate} style={{ ...input, padding: '10.5px 13px' }} />
          </div>
          <div>
            <div style={label}>อีเมล</div>
            <input value={v.su.email} onChange={v.onSuEmail} placeholder="username@gmail.com" style={input} />
          </div>
          <div>
            <div style={label}>เบอร์โทรศัพท์</div>
            <input value={v.su.phone} onChange={v.onSuPhone} placeholder="0xx-xxx-xxxx" style={input} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ ...label, marginBottom: 8 }}>ความถนัด / ประสบการณ์</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[...skills.map((s) => s.skill_name), 'อื่น ๆ'].map((label) => {
              const selected = v.su.skills.includes(label);
              return (
                <div key={label} onClick={v.toggleSkill(label)} style={{ padding: '8px 15px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: selected ? '#2563EB' : '#F3F4F6', color: selected ? '#fff' : '#6B7280', fontWeight: 600 }}>{label}</div>
              );
            })}
          </div>
          {v.showSkillOtherInput && (
            <>
              <input value={v.su.skillOther} onChange={onSkillOtherChange} placeholder="โปรดระบุความถนัดอื่น ๆ" style={{ ...input, marginTop: 8 }} />
              {skillOtherError && <div style={{ color: '#DC2626', fontSize: 11.5, marginTop: 6 }}>{skillOtherError}</div>}
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginTop: 18 }}>
          <div>
            <div style={label}>รหัสผ่าน</div>
            <input type="password" value={v.su.password} onChange={v.onSuPassword} placeholder="••••••" style={input} />
          </div>
          <div>
            <div style={label}>ยืนยันรหัสผ่าน</div>
            <input type="password" value={v.su.confirmPassword} onChange={v.onSuConfirmPassword} placeholder="••••••" style={input} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...btnPrimary, width: '100%', padding: 13, borderRadius: 10, fontSize: 14, marginTop: 20, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
        </button>
      </div>
    </div>
  );
}
