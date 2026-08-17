import { card, inputSm, btnPrimary, toggle, toggleKnob } from '../styles/common.js';
import AvatarSlot from '../components/AvatarSlot.jsx';
import { IoMdAdd } from 'react-icons/io';

export default function AdminSettingsScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px', maxWidth: 640 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>การตั้งค่าผู้ดูแลระบบ</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>จัดการบัญชี สิทธิ์การเข้าถึง และการแจ้งเตือน</div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>ข้อมูลผู้ดูแล</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <AvatarSlot />
          <div style={{ fontSize: 11.5, color: '#6B7280' }}>คลิกหรือลากรูปมาวางเพื่อเปลี่ยนรูปโปรไฟล์<br />แนะนำขนาด 200×200px</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>ชื่อ</div>
            <input value={v.adminProfile.name} onChange={v.onAdminProfileName} style={inputSm} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 5 }}>อีเมล</div>
            <input value={v.adminProfile.email} disabled style={{ ...inputSm, background: '#EEF1F5', color: '#6B7280', cursor: 'not-allowed' }} />
          </div>
          <div>
            <button style={{ background: '#F3F4F6', color: '#374151', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>เปลี่ยนรหัสผ่าน</button>
          </div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>สิทธิ์การเข้าถึง</div>
          <button onClick={v.addAdminUser} style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={13} /> เพิ่มผู้ดูแล</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {v.adminUsers.map((au, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{au.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{au.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, background: au.roleBg, color: au.roleColor }}>{au.roleLabel}</span>
                <span onClick={au.onToggleRole} style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>สลับสิทธิ์</span>
              </div>
            </div>
          ))}
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
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>การแจ้งเตือนผู้ดูแล</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {v.adminNotifToggles.map((tg) => (
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
