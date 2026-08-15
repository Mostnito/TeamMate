import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import logo from '../assets/teammate-logo.svg';
import { label, input, btnPrimary } from '../styles/common.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function LoginScreen({ v }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        avatarUrl: res.data.avatarUrl || ''
      };

      v.completeLogin(currentUser, isAdminMode);
      toast.success(res.data.message || 'เข้าสู่ระบบสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex' }}>
      <div style={{ flex: 1, background: 'linear-gradient(160deg,#2563EB,#1D4ED8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#fff' }}>
        <img src={logo} style={{ width: 96, height: 96, objectFit: 'contain', background: '#fff', borderRadius: 20, padding: 14, marginBottom: 22 }} alt="TeamMate logo" />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>TeamMate</div>
        <div style={{ fontSize: 13.5, color: '#DBEAFE', marginTop: 10, textAlign: 'center', maxWidth: 280, lineHeight: 1.7 }}>จัดการงานกลุ่ม ทีม และไทม์ไลน์ของคุณในที่เดียว</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 360 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>เข้าสู่ระบบ</div>
          <div style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 26 }}>กรอกข้อมูลบัญชีของคุณเพื่อดำเนินการต่อ</div>
          <div style={{ marginBottom: 16 }}>
            <div style={label}>อีเมล</div>
            <input value={v.loginEmail} onChange={v.onLoginEmailChange} placeholder="email@example.com" style={input} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={label}>รหัสผ่าน</div>
            <div style={{ position: 'relative' }}>
              <input type={v.loginPwType} value={v.loginPassword} onChange={v.onLoginPasswordChange} placeholder="••••••" style={input} />
              <span onClick={v.toggleLoginPw} style={{ position: 'absolute', right: 13, top: 11, cursor: 'pointer', color: '#6B7280', fontSize: 15 }}>{v.loginPwIcon}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 18 }}>
            <span style={{ fontSize: 11.5, color: '#2563EB', cursor: 'pointer' }}>ลืมรหัสผ่าน?</span>
          </div>
          <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...btnPrimary, width: '100%', padding: 12, borderRadius: 10, fontSize: 14, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: '#6B7280' }}>หรือ</div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12.5, color: '#6B7280' }}>
            ยังไม่มีบัญชี? <span onClick={v.goSignup} style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>สมัครสมาชิก</span>
          </div>
        </div>
      </div>
    </div>
  );
}
