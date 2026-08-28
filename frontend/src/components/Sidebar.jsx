import { useEffect } from 'react';
import logo from '../assets/teammate-logo.png';
import { IoMdSettings, IoMdLogOut } from 'react-icons/io';

export default function Sidebar({ v, isDrawerOpen, onCloseDrawer }) {
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onCloseDrawer(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, onCloseDrawer]);

  return (
    <div className={`app-sidebar${isDrawerOpen ? ' app-sidebar--open' : ''}`} style={{ width: 264, minWidth: 264, background: '#FFFFFF', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 22px', borderBottom: '1px solid #F3F4F6' }}>
        <img src={logo} style={{ width: 41, height: 41, objectFit: 'contain' }} alt="TeamMate logo" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>TeamMate</div>
          <div style={{ fontSize: 12.5, color: '#6B7280' }}>แพลตฟอร์มทำงานกลุ่ม</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '17px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {v.navItems.map((item) => (
          <div
            key={item.key}
            onClick={() => { item.onClick(); onCloseDrawer(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 11, cursor: 'pointer', fontSize: 16, fontWeight: 500, background: item.active ? '#F3F8FF' : 'transparent' }}
          >
            <span style={{ width: 24, textAlign: 'center', display: 'flex', justifyContent: 'center' }}><item.icon size={18} color={item.iconColor} /></span>
            <span style={{ color: item.textColor }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          onClick={() => { v.goSettings(); onCloseDrawer(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 11, cursor: 'pointer', fontSize: 16, fontWeight: 500, color: v.settingsTextColor }}
        >
          <span style={{ width: 24, textAlign: 'center', display: 'flex', justifyContent: 'center' }}><IoMdSettings size={18} color={v.settingsIconColor} /></span>
          <span>ตั้งค่า</span>
        </div>
        <div
          onClick={v.handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 11, cursor: 'pointer', fontSize: 16, fontWeight: 500, color: '#DC2626' }}
        >
          <span style={{ width: 24, textAlign: 'center', display: 'flex', justifyContent: 'center' }}><IoMdLogOut size={18} /></span>
          <span>ออกจากระบบ</span>
        </div>
      </div>
    </div>
  );
}
