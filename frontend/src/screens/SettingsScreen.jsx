import { card, inputSm, btnPrimary, btnSecondary, toggle, toggleKnob } from '../styles/common.js';
import AvatarSlot from '../components/AvatarSlot.jsx';

export default function SettingsScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px', maxWidth: 640 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>การตั้งค่า</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>จัดการข้อมูลส่วนตัวและการแจ้งเตือน</div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>ข้อมูลส่วนตัว</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <AvatarSlot />
          <div style={{ fontSize: 11.5, color: '#6B7280' }}>คลิกหรือลากรูปมาวงเพื่อเปลี่ยนรูปโปรไฟล์<br />แนะนำขนาด 200×200px</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>ชื่อ-นามสกุล</div>
            <input value={v.settingsProfile.fullName} onChange={v.onSettingsFullName} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>ชื่อเล่น</div>
            <input value={v.settingsProfile.nickname} onChange={v.onSettingsNickname} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>อีเมล</div>
            <input value={v.settingsProfile.email} onChange={v.onSettingsEmail} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>รหัสผ่าน</div>
            <input type="password" value={v.settingsProfile.password} onChange={v.onSettingsPassword} style={inputSm} />
          </div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 10 }}>ทักษะของฉัน</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {v.settingsSkillOptions.map((s) => (
            <div key={s.label} onClick={s.onClick} style={{ padding: '8px 15px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</div>
          ))}
        </div>
        {v.showSettingsSkillOtherInput && (
          <input value={v.settingsProfile.skillOther} onChange={v.onSettingsSkillOther} placeholder="โปรดระบุความถนัดอื่น ๆ" style={{ ...inputSm, borderRadius: 9, padding: '10px 13px', marginTop: 10 }} />
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
        <button style={btnSecondary}>ยกเลิก</button>
        <button onClick={v.saveSettings} style={btnPrimary}>{v.saveSettingsLabel}</button>
      </div>
    </div>
  );
}
