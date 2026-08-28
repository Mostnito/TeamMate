import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import logo from '../assets/teammate-logo.png';
import { label, input, btnPrimary } from '../styles/common.js';
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// login/register pages are scaled ~120% up from the shared base styles for extra readability
const labelLg = { ...label, fontSize: 14.5 };
const inputLg = { ...input, fontSize: 15.5, padding: '13px 16px', borderRadius: 11 };

export default function LoginScreen({ v }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const onKeyDownSubmit = (e) => {
    if (e.key === 'Enter' && !isSubmitting) handleSubmit();
  };

  const handleSubmit = async () => {
    const { loginEmail, loginPassword } = v;
    if (!EMAIL_PATTERN.test(loginEmail)) {
      toast.error('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    if (!loginPassword) {
      toast.error('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/login', { email: loginEmail, password: loginPassword });
      localStorage.setItem('token', res.data.token);

      const isAdminMode = res.data.role === 'admin';
      const currentUser = {
        name: res.data.nickname,
        firstName: res.data.nickname,
        studentId: res.data.studentId || '',
        userId: res.data.userId,
        avatarUrl: res.data.avatarUrl || '',
        title: res.data.title || '',
        publicId: res.data.publicId
      };

      v.completeLogin(currentUser, isAdminMode);

      const groupsRes = await axios.get('/api/group/data', { headers: { Authorization: `Bearer ${res.data.token}` } });
      v.setMyTeamCount(groupsRes.data.length);

      toast.success(res.data.message || 'เข้าสู่ระบบสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-panes" style={{ minHeight: '100%' }}>
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
      <div style={{ flex: 1, background: 'linear-gradient(160deg,#2563EB,#1D4ED8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, color: '#fff' }}>
        <img src={logo} style={{ width: 115, height: 115, objectFit: 'contain', background: '#fff', borderRadius: 24, padding: 17, marginBottom: 26 }} alt="TeamMate logo" />
        <div style={{ fontSize: 31, fontWeight: 700, letterSpacing: 0.6 }}>TeamMate</div>
        <div style={{ fontSize: 16, color: '#DBEAFE', marginTop: 12, textAlign: 'center', maxWidth: 336, lineHeight: 1.7 }}>จัดการงานกลุ่ม ทีม และไทม์ไลน์ของคุณในที่เดียว</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 432, maxWidth: 'calc(100vw - 32px)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 7 }}>เข้าสู่ระบบ</div>
          <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 31 }}>กรอกข้อมูลบัญชีของคุณเพื่อดำเนินการต่อ</div>
          <div style={{ marginBottom: 19 }}>
            <div style={labelLg}>อีเมล</div>
            <input value={v.loginEmail} onChange={v.onLoginEmailChange} onKeyDown={onKeyDownSubmit} placeholder="email@example.com" style={inputLg} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={labelLg}>รหัสผ่าน</div>
            <div style={{ position: 'relative' }}>
              <input type={v.loginPwType} value={v.loginPassword} onChange={v.onLoginPasswordChange} onKeyDown={onKeyDownSubmit} placeholder="••••••" style={inputLg} />
              <span onClick={v.toggleLoginPw} style={{ position: 'absolute', right: 16, top: 13, cursor: 'pointer', color: '#6B7280', fontSize: 18 }}>{v.loginPwIcon}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 22 }}>
            <span onClick={() => setIsForgotPasswordOpen(true)} style={{ fontSize: 14, color: '#2563EB', cursor: 'pointer' }}>ลืมรหัสผ่าน</span>
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...btnPrimary, width: '100%', padding: 14, borderRadius: 12, fontSize: 17, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 19, fontSize: 15, color: '#6B7280' }}>หรือ</div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 15, color: '#6B7280' }}>
            ยังไม่มีบัญชี? <span onClick={v.goSignup} style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>สมัครสมาชิก</span>
          </div>
        </div>
      </div>
    </div>
  );
}
