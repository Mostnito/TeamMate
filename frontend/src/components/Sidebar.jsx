import logo from '../assets/teammate-logo.png';

export default function Sidebar({ v }) {
  return (
    <div style={{ width: 220, minWidth: 220, background: '#FFFFFF', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 18px', borderBottom: '1px solid #F3F4F6' }}>
        <img src={logo} style={{ width: 34, height: 34, objectFit: 'contain' }} alt="TeamMate logo" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>TeamMate</div>
          <div style={{ fontSize: 10.5, color: '#6B7280' }}>แพลตฟอร์มทำงานกลุ่ม</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {v.navItems.map((item) => (
          <div
            key={item.key}
            onClick={item.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, background: item.active ? '#F3F8FF' : 'transparent' }}
          >
            <span style={{ width: 20, textAlign: 'center', fontSize: 15, color: item.iconColor }}>{item.icon}</span>
            <span style={{ color: item.textColor }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 10, borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          onClick={v.goSettings}
          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: v.settingsTextColor }}
        >
          <span style={{ width: 20, textAlign: 'center', fontSize: 15, color: v.settingsIconColor }}>⚙</span>
          <span>ตั้งค่า</span>
        </div>
        <div
          onClick={v.handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#DC2626' }}
        >
          <span style={{ width: 20, textAlign: 'center', fontSize: 15 }}>⎋</span>
          <span>ออกจากระบบ</span>
        </div>
      </div>
    </div>
  );
}
