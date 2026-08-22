import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, inputSm, btnPrimary, btnSecondary } from '../styles/common.js';
import AvatarSlot from '../components/AvatarSlot.jsx';

const emptyForm = { firstName: '', lastName: '', nickname: '', studentId: '', gender: '', birthdate: '', phone: '' };

export default function AdminSettingsScreen({ v }) {
  const [form, setForm] = useState(emptyForm);
  const [originalForm, setOriginalForm] = useState(emptyForm);
  const [genders, setGenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get('/api/gender', { signal: controller.signal }),
      axios.get('/api/user/' + v.currentUserId, { headers, signal: controller.signal })
    ]).then(([genderRes, userRes]) => {
      setGenders(genderRes.data);
      const u = userRes.data;
      const genderLabel = genderRes.data.find((g) => g.gender_id === u.genderId)?.gender_type || '';
      const loaded = {
        firstName: u.firstName || '', lastName: u.lastName || '', nickname: u.nickname || '',
        studentId: u.studentId || '', gender: genderLabel, birthdate: u.birthdate || '', phone: u.phone || ''
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

  const toggleGender = (label) => () => setForm((f) => ({ ...f, gender: label }));
  const onField = (field) => (e) => { const val = e.target.value; setForm((f) => ({ ...f, [field]: val })); };

  const handleCancel = () => setForm(originalForm);

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
        skills: []
      }, { headers: { Authorization: `Bearer ${token}` } });

      setOriginalForm(form);
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
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>การตั้งค่าผู้ดูแลระบบ</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>จัดการข้อมูลส่วนตัวและนโยบายการคัดกรอง</div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>ข้อมูลผู้ดูแล</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <AvatarSlot
            userId={v.currentUserId}
            imageUrl={v.currentUserAvatarUrl}
            onUploaded={(url) => v.updateCurrentUser({ avatarUrl: url })}
          />
          <div style={{ fontSize: 11.5, color: '#6B7280' }}>คลิกหรือลากรูปมาวางเพื่อเปลี่ยนรูปโปรไฟล์<br />แนะนำขนาด 200×200px</div>
        </div>
        <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
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
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>รหัสนิสิต/พนักงาน</div>
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
        <div style={{ marginBottom: 16 }}>
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
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={handleCancel} style={btnSecondary}>ยกเลิก</button>
          <button onClick={handleSave} disabled={isSubmitting} style={{ ...btnPrimary, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}
          </button>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>นโยบายการคัดกรอง</div>
        <div>
          <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>คำต้องห้ามในแชท (คั่นด้วยเครื่องหมายจุลภาค)</div>
          <input value={v.policy.bannedWords} onChange={v.onPolicyBannedWords} style={inputSm} />
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 6 }}>Log retention</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10 }}>ระยะเวลาเก็บ error log และ security log (วัน)</div>
        <input type="number" value={v.policy.logRetentionDays} onChange={v.onPolicyLogRetention} style={{ ...inputSm, width: 160 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={v.saveAdminSettings} style={btnPrimary}>{v.saveAdminSettingsLabel}</button>
      </div>
    </div>
  );
}
