import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setStep(0); setEmail(''); setCode(''); setNewPassword(''); setConfirmPassword('');
    onClose();
  };

  if (!isOpen) return null;
  const stopPropagation = (e) => e.stopPropagation();

  const handleRequestCode = async () => {
    if (!EMAIL_PATTERN.test(email)) {
      toast.error('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/forgot-password', { email });
      toast.success(res.data.message || 'ส่งรหัสยืนยันแล้ว');
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      toast.error('กรุณากรอกรหัสยืนยัน');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/reset-password', { email, code: code.trim(), newPassword });
      toast.success(res.data.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleClose}>
      <div onClick={stopPropagation} style={{ width: 380, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>ลืมรหัสผ่าน</div>

        {step === 0 ? (
          <>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>กรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน</div>
            <div style={{ marginBottom: 18 }}>
              <div style={label}>อีเมล</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" style={input} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleClose} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
              <button onClick={handleRequestCode} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งรหัสยืนยัน'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>ส่งรหัสยืนยันแล้วไปที่ {email}</div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>รหัสยืนยัน (6 หลัก)</div>
              <input value={code} onChange={(e) => setCode(e.target.value)} type="text" placeholder="000000" style={input} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>รหัสผ่านใหม่</div>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" style={input} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={label}>ยืนยันรหัสผ่านใหม่</div>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" style={input} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ย้อนกลับ</button>
              <button onClick={handleResetPassword} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
