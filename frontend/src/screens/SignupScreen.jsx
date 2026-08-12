import { label, input, btnPrimary } from '../styles/common.js';

export default function SignupScreen({ v }) {
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ height: 56, background: '#2563EB', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 10, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={v.goLogin}>
        <span>←</span><span>สมัครสมาชิก TeamMate</span>
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
              {v.genderOptions.map((g) => (
                <div key={g.label} onClick={g.onClick} style={{ padding: '9px 16px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: g.bg, color: g.color, fontWeight: 600 }}>{g.label}</div>
              ))}
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
            {v.skillOptions.map((s) => (
              <div key={s.label} onClick={s.onClick} style={{ padding: '8px 15px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</div>
            ))}
          </div>
          {v.showSkillOtherInput && (
            <input value={v.su.skillOther} onChange={v.onSuSkillOther} placeholder="โปรดระบุความถนัดอื่น ๆ" style={{ ...input, marginTop: 8 }} />
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

        {v.signupError && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 14, textAlign: 'center' }}>{v.signupError}</div>}

        <button onClick={v.handleSignup} style={{ ...btnPrimary, width: '100%', padding: 13, borderRadius: 10, fontSize: 14, marginTop: 20 }}>สมัครสมาชิก</button>
      </div>
    </div>
  );
}
