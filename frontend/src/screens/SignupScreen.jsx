import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary } from '../styles/common.js';
import { IoMdArrowBack } from 'react-icons/io';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// major heading ("1. คำนิยาม") gets emphasis; numbered sub-items ("5.1", "6.3") stay plain body text
const MAJOR_HEADING_PATTERN = /^\d+\.\s/;
function renderTermsContent(text) {
  return (text || '').split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: 12 }} />;
    if (MAJOR_HEADING_PATTERN.test(trimmed)) {
      return (
        <div key={i} style={{ fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.6, marginTop: 22, paddingBottom: 6, borderBottom: '1px solid #F3F4F6' }}>
          {trimmed}
        </div>
      );
    }
    return (
      <div key={i} style={{ fontSize: 12.5, fontWeight: 400, color: '#4B5A6E', lineHeight: 1.8 }}>
        {trimmed}
      </div>
    );
  });
}

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
  const [termsOfService, setTermsOfService] = useState('');
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/gender', { signal: controller.signal })
      .then((res) => setGenders(res.data))
      .catch((err) => { if (!axios.isCancel(err)) setGenders([]); });
    axios.get('/api/skill', { signal: controller.signal })
      .then((res) => setSkills(res.data))
      .catch((err) => { if (!axios.isCancel(err)) setSkills([]); });
    axios.get('/api/terms-of-service', { signal: controller.signal })
      .then((res) => setTermsOfService(res.data.termsOfService || ''))
      .catch((err) => { if (!axios.isCancel(err)) setTermsOfService(''); });
    return () => controller.abort();
  }, []);

  const requiresTerms = !!termsOfService.trim();
  const handleTermsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 4) setHasScrolledTerms(true);
  };

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
    if (requiresTerms && !agreedToTerms) {
      toast.error('กรุณาอ่านและยอมรับข้อกำหนดการใช้งานก่อนสมัครสมาชิก');
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
        <div className="grid-2" style={{ gap: '18px 24px' }}>
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

        <div className="grid-2" style={{ gap: '18px 24px', marginTop: 18 }}>
          <div>
            <div style={label}>รหัสผ่าน</div>
            <input type="password" value={v.su.password} onChange={v.onSuPassword} placeholder="••••••" style={input} />
          </div>
          <div>
            <div style={label}>ยืนยันรหัสผ่าน</div>
            <input type="password" value={v.su.confirmPassword} onChange={v.onSuConfirmPassword} placeholder="••••••" style={input} />
          </div>
        </div>

        {requiresTerms && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 20 }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              disabled={!hasScrolledTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={{ marginTop: 3, width: 15, height: 15, flexShrink: 0, cursor: hasScrolledTerms ? 'pointer' : 'not-allowed' }}
            />
            <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7 }}>
              ฉันได้อ่านและยอมรับ{' '}
              <span onClick={() => setIsTermsModalOpen(true)} style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
                ข้อกำหนดการใช้งาน
              </span>
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={isSubmitting || (requiresTerms && !agreedToTerms)} style={{ ...btnPrimary, width: '100%', padding: 13, borderRadius: 10, fontSize: 14, marginTop: 20, opacity: isSubmitting || (requiresTerms && !agreedToTerms) ? 0.7 : 1, cursor: isSubmitting || (requiresTerms && !agreedToTerms) ? 'not-allowed' : 'pointer' }}>
          {isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
        </button>
      </div>

      {isTermsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setIsTermsModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 60px)', background: '#fff', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 26px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>ข้อกำหนดการใช้งาน</div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>เลื่อนอ่านจนจบเพื่อเปิดใช้งานช่องยอมรับ</div>
            </div>
            <div onScroll={handleTermsScroll} style={{ flex: 1, overflowY: 'auto', padding: '18px 26px' }}>
              {renderTermsContent(termsOfService)}
            </div>
            <div style={{ padding: '14px 26px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsTermsModalOpen(false)} style={{ ...btnPrimary, padding: '10px 24px' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
