import { useState } from 'react';
import { IoMdTrash } from 'react-icons/io';
import { card, page, btnSecondary, avatar } from '../styles/common.js';

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'unread', label: 'ยังไม่อ่าน' },
  { key: 'read', label: 'อ่านแล้ว' }
];

export default function NotificationsScreen({ v }) {
  const [filter, setFilter] = useState('all');

  const filteredItems = v.notificationItems.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  return (
    <div style={page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>การแจ้งเตือน</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {v.unreadNotificationCount > 0 ? `ยังไม่ได้อ่าน ${v.unreadNotificationCount} รายการ` : ''}
          </div>
        </div>
        {v.hasUnreadNotifications && (
          <button onClick={v.markAllNotificationsRead} style={{ ...btnSecondary, padding: '9px 16px', fontSize: 12.5 }}>
            ทำเครื่องหมายว่าอ่านแล้ว
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {FILTERS.map((f) => (
          <div
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === f.key ? '#2563EB' : 'transparent', color: filter === f.key ? '#fff' : '#6B7280' }}
          >
            {f.label}
          </div>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
          {filter === 'unread' ? 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน' : filter === 'read' ? 'ไม่มีการแจ้งเตือนที่อ่านแล้ว' : 'ยังไม่มีการแจ้งเตือน'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredItems.map((n) => (
            <div
              key={n.notificationId}
              onClick={n.onClick}
              style={{
                ...card, display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer', padding: 16,
                background: n.isRead ? '#fff' : '#EFF6FF', border: n.isRead ? '1px solid transparent' : '1px solid #BFDBFE'
              }}
            >
              <div style={avatar('#EFF6FF', '#2563EB', 38)}>
                <n.icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 13.5, color: '#111827', marginBottom: 3 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{n.message}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{n.timeAgo}</div>
              </div>
              {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', marginTop: 6, flexShrink: 0 }} />}
              <span onClick={n.onDelete} title="ลบการแจ้งเตือน" style={{ cursor: 'pointer', color: '#9CA3AF', display: 'flex', flexShrink: 0, padding: 2 }}>
                <IoMdTrash size={15} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
