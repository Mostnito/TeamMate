import { IoMdSearch, IoMdMenu } from 'react-icons/io';

export default function Header({ v, onToggleDrawer }) {
  return (
    <div className="app-header" style={{ height: 64, minHeight: 64, background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="hamburger-btn" onClick={onToggleDrawer} style={{ alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: '#F3F4F6', cursor: 'pointer' }}>
          <IoMdMenu size={17} color="#374151" />
        </div>
        <div className="header-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F3F4F6', borderRadius: 9, padding: '8px 14px', width: 340 }}>
          <IoMdSearch size={14} color="#6B7280" />
          <input placeholder="ค้นหาโปรเจกต์ ทีม หรือไฟล์..." style={{ border: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#374151' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            position: 'relative', width: 34, height: 34, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13,
            background: v.currentUserAvatarUrl ? `#2563EB url(${v.currentUserAvatarUrl}) center/cover no-repeat` : '#2563EB'
          }}>
            {!v.currentUserAvatarUrl && v.currentUserInitials}
            <span style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: '50%', background: '#22C55E', border: '2px solid #fff' }}></span>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{v.currentUserName}</div>
            <div style={{ fontSize: 10.5, color: '#6B7280' }}>{v.currentUserRoleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
