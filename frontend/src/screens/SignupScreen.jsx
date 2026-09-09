import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdArrowBack } from 'react-icons/io';

// stricter than a bare "text@text.text" shape - rejects non-ASCII local parts (e.g. Thai characters)
// and single-letter TLDs like the ".c" in "หดด@fgchbfgc.c"
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Thai mobile numbers only: 10 digits starting with 06, 08, or 09
const PHONE_PATTERN = /^0[689][0-9]{8}$/;

// su.phone always stores raw digits only (matches PHONE_PATTERN / what the backend expects) -
// the XXX-XXX-XXXX dashes are purely a display transform applied in the input's value
function formatPhoneDisplay(digits) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}
// \p{M} is required alongside \p{L} - Thai tone marks and vowel signs (e.g. the ้ in "ก้อง") are
// combining marks, not letters on their own, so \p{L} alone would reject ordinary Thai names
const LETTERS_ONLY_PATTERN = /^[\p{L}\p{M}\s]+$/u;

// login/register pages are scaled ~120% up from the shared base styles for extra readability
const labelLg = { ...label, fontSize: 14.5 };
const inputLg = { ...input, fontSize: 15.5, padding: '13px 16px', borderRadius: 11 };

// major heading ("1. คำนิยาม") gets emphasis; numbered sub-items ("5.1", "6.3") stay plain body text
const MAJOR_HEADING_PATTERN = /^\d+\.\s/;
function renderTermsContent(text) {
  return (text || '').split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{ height: 14 }} />;
    if (MAJOR_HEADING_PATTERN.test(trimmed)) {
      return (
        <div key={i} style={{ fontSize: 18, fontWeight: 800, color: '#111827', lineHeight: 1.6, marginTop: 26, paddingBottom: 7, borderBottom: '1px solid #F3F4F6' }}>
          {trimmed}
        </div>
      );
    }
    return (
      <div key={i} style={{ fontSize: 15, fontWeight: 400, color: '#4B5A6E', lineHeight: 1.8 }}>
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

const STEPS = [
  { title: 'ข้อมูลส่วนตัว' },
  { title: 'เพศและวันเกิด' },
  { title: 'ความถนัด' },
  { title: 'ข้อมูลติดต่อ' },
  { title: 'ตั้งรหัสผ่าน' },
  { title: 'ข้อกำหนดการใช้งาน' }
];

export default function SignupScreen({ v }) {
  const [step, setStep] = useState(0);
  const [genders, setGenders] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillOtherError, setSkillOtherError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsOfService, setTermsOfService] = useState('');
  const [hasScrolledTerms, setHasScrolledTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  // each step is only ever visible after every step before it already passed, so this only
  // needs to check the fields that step itself owns -- earlier fields are guaranteed valid already
  const validateStep = (stepIndex) => {
    const su = v.su;
    if (stepIndex === 0) {
      if (!su.firstName || !su.lastName || !su.nickname || !su.studentId) return 'กรุณากรอกข้อมูลให้ครบถ้วน';
      if (!LETTERS_ONLY_PATTERN.test(su.firstName) || !LETTERS_ONLY_PATTERN.test(su.lastName) || !LETTERS_ONLY_PATTERN.test(su.nickname)) {
        return 'กรุณากรอกชื่อจริง, นามสกุลและชื่อเล่นเป็นตัวอักษรเท่านั้น';
      }
      if (!/^[0-9]+$/.test(su.studentId.trim())) return 'กรุณากรอกรหัสนิสิตเป็นตัวเลขเท่านั้น';
      if (su.studentId.trim().length !== 8) return 'กรุณากรอกรหัสนิสิตให้ครบ 8 หลัก';
    }
    if (stepIndex === 1) {
      if (!su.gender) return 'กรุณาเลือกเพศ';
      if (!su.birthdate) return 'กรุณาเลือกวันเกิด';
      const birthDate = new Date(su.birthdate);
      const today = new Date();
      if (birthDate > today) return 'วันเกิดไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      let age = today.getFullYear() - birthDate.getFullYear();
      const hadBirthdayThisYear = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
      if (!hadBirthdayThisYear) age--;
      if (age < 10 || age > 100) return 'วันเกิดไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    }
    if (stepIndex === 2) {
      if (su.skills.length === 0) return 'กรุณาเลือกความถนัดอย่างน้อย 1 รายการ';
      if (v.showSkillOtherInput) {
        const err = validateSkillOther(su.skillOther);
        if (err) { setSkillOtherError(err); return err; }
      }
    }
    if (stepIndex === 3) {
      if (!su.email || !EMAIL_PATTERN.test(su.email)) return 'กรุณากรอกรูปแบบอีเมลให้ถูกต้อง';
      if (!PHONE_PATTERN.test((su.phone || '').trim())) return 'กรุณากรอกเบอร์โทรให้ถูกต้อง';
    }
    if (stepIndex === 4) {
      if (!su.password || su.password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      const hasLetter = /[a-zA-Z]/.test(su.password);
      const hasDigitOrSpecial = /[0-9]/.test(su.password) || /[^a-zA-Z0-9]/.test(su.password);
      if (!hasLetter || !hasDigitOrSpecial) return 'รหัสผ่านต้องมีตัวอักษร และมีตัวเลขหรืออักขระพิเศษอย่างน้อย 1 ตัว';
      if (su.password !== su.confirmPassword) return 'รหัสผ่านไม่ตรงกัน';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    const su = v.su;

    // full re-validation as a final safety net -- each step already gated its own fields,
    // this just guarantees nothing slipped through (e.g. state edited out of band)
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validateStep(i);
      if (err) { toast.error(err); setStep(i); return; }
    }
    if (requiresTerms && !agreedToTerms) {
      toast.error('กรุณาอ่านและยอมรับข้อกำหนดการใช้งานก่อนสมัครสมาชิก');
      return;
    }

    let finalSkills = su.skills;
    if (v.showSkillOtherInput) {
      const err = validateSkillOther(su.skillOther);
      if (err) { setSkillOtherError(err); toast.error(err); setStep(2); return; }
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

  const isLastStep = step === STEPS.length - 1;

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ height: 67, background: '#2563EB', display: 'flex', alignItems: 'center', padding: '0 29px', gap: 12, color: '#fff', fontWeight: 600, fontSize: 17, cursor: 'pointer' }} onClick={v.goBack}>
        <IoMdArrowBack size={19} /><span>สมัครสมาชิก TeamMate</span>
      </div>
      <div style={{ maxWidth: 640, margin: '34px auto', background: '#fff', borderRadius: 19, padding: 38, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 9 }}>ขั้นตอนที่ {step + 1} จาก {STEPS.length} · {STEPS[step].title}</div>
          <div style={{ height: 7, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: '#2563EB', borderRadius: 4, transition: 'width 0.2s ease' }} />
          </div>
        </div>

        {step === 0 && (
          <div className="grid-2" style={{ gap: '22px 29px' }}>
            <div>
              <div style={labelLg}>ชื่อจริง</div>
              <input value={v.su.firstName} onChange={v.onSuFirstName} placeholder="ชื่อจริง" style={inputLg} />
            </div>
            <div>
              <div style={labelLg}>นามสกุล</div>
              <input value={v.su.lastName} onChange={v.onSuLastName} placeholder="นามสกุล" style={inputLg} />
            </div>
            <div>
              <div style={labelLg}>ชื่อเล่น</div>
              <input value={v.su.nickname} onChange={v.onSuNickname} placeholder="ชื่อเล่น" style={inputLg} />
            </div>
            <div>
              <div style={labelLg}>รหัสนิสิต</div>
              <input value={v.su.studentId} onChange={v.onSuStudentId} placeholder="66xxxxxx" maxLength={8} style={inputLg} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={labelLg}>เพศ</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {genders.map((g) => {
                  const selected = v.su.gender === g.gender_type;
                  return (
                    <div key={g.gender_id} onClick={v.toggleGender(g.gender_type)} style={{ padding: '11px 19px', borderRadius: 24, fontSize: 15, cursor: 'pointer', background: selected ? '#2563EB' : '#F3F4F6', color: selected ? '#fff' : '#6B7280', fontWeight: 600 }}>{g.gender_type}</div>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={labelLg}>วันเกิด</div>
              {/* lang="th" nudges Chromium browsers (Chrome/Edge) to display day/month/year order;
                  Firefox/Safari may still fall back to their own OS locale - not fully controllable
                  cross-browser without giving up the native calendar picker, which was the tradeoff chosen */}
              <input type="date" lang="th" value={v.su.birthdate} onChange={v.onSuBirthdate} style={inputLg} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ ...labelLg, marginBottom: 10 }}>ความถนัด / ประสบการณ์</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[...skills.map((s) => s.skill_name), 'อื่น ๆ'].map((label) => {
                const selected = v.su.skills.includes(label);
                return (
                  <div key={label} onClick={v.toggleSkill(label)} style={{ padding: '10px 18px', borderRadius: 24, fontSize: 15, cursor: 'pointer', background: selected ? '#2563EB' : '#F3F4F6', color: selected ? '#fff' : '#6B7280', fontWeight: 600 }}>{label}</div>
                );
              })}
            </div>
            {v.showSkillOtherInput && (
              <>
                <input value={v.su.skillOther} onChange={onSkillOtherChange} placeholder="โปรดระบุความถนัดอื่น ๆ" style={{ ...inputLg, marginTop: 10 }} />
                {skillOtherError && <div style={{ color: '#DC2626', fontSize: 14, marginTop: 7 }}>{skillOtherError}</div>}
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid-2" style={{ gap: '22px 29px' }}>
            <div>
              <div style={labelLg}>อีเมล</div>
              <input value={v.su.email} onChange={v.onSuEmail} placeholder="username@gmail.com" style={inputLg} />
            </div>
            <div>
              <div style={labelLg}>เบอร์โทรศัพท์</div>
              <input
                value={formatPhoneDisplay(v.su.phone || '')}
                onChange={(e) => v.onSuPhone({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                placeholder="0xx-xxx-xxxx"
                maxLength={12}
                style={inputLg}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid-2" style={{ gap: '22px 29px' }}>
            <div>
              <div style={labelLg}>รหัสผ่าน</div>
              <input type="password" value={v.su.password} onChange={v.onSuPassword} placeholder="••••••" style={inputLg} />
            </div>
            <div>
              <div style={labelLg}>ยืนยันรหัสผ่าน</div>
              <input type="password" value={v.su.confirmPassword} onChange={v.onSuConfirmPassword} placeholder="••••••" style={inputLg} />
            </div>
          </div>
        )}

        {step === 5 && (
          requiresTerms ? (
            <div>
              <div
                onScroll={handleTermsScroll}
                style={{ height: 340, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 12, background: '#F9FAFB', padding: '20px 22px', marginBottom: 16 }}
              >
                {renderTermsContent(termsOfService)}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  disabled={!hasScrolledTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0, cursor: hasScrolledTerms ? 'pointer' : 'not-allowed' }}
                />
                <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.7 }}>
                  ฉันได้อ่านและยอมรับข้อกำหนดการใช้งาน
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: '#6B7280' }}>ตรวจสอบข้อมูลของคุณเรียบร้อยแล้ว กดสมัครสมาชิกเพื่อดำเนินการต่อ</div>
          )
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 30 }}>
          {step > 0 ? (
            <button onClick={handleBack} disabled={isSubmitting} style={{ ...btnSecondary, padding: '13px 26px', fontSize: 15, borderRadius: 12 }}>ย้อนกลับ</button>
          ) : <div />}
          {isLastStep ? (
            <button onClick={handleSubmit} disabled={isSubmitting || (requiresTerms && !agreedToTerms)} style={{ ...btnPrimary, padding: '13px 30px', fontSize: 15, borderRadius: 12, opacity: isSubmitting || (requiresTerms && !agreedToTerms) ? 0.7 : 1, cursor: isSubmitting || (requiresTerms && !agreedToTerms) ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </button>
          ) : (
            <button onClick={handleNext} style={{ ...btnPrimary, padding: '13px 30px', fontSize: 15, borderRadius: 12 }}>ถัดไป</button>
          )}
        </div>
      </div>
    </div>
  );
}
