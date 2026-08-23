import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdSearch } from 'react-icons/io';

const ROLE_LABELS = { student: 'นักเรียน', advisor: 'อาจารย์', admin: 'แอดมิน' };
const EMPTY_FORM = { firstName: '', lastName: '', nickname: '', studentId: '' };
const SORT_GROUPS = [
  {
    label: 'เวลาสร้าง',
    options: [
      { key: 'created_newest', label: 'ใหม่ล่าสุด', compare: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
      { key: 'created_oldest', label: 'เก่าที่สุด', compare: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) }
    ]
  },
  {
    label: 'คะแนน',
    options: [
      { key: 'points_most', label: 'มากที่สุด', compare: (a, b) => b.points - a.points },
      { key: 'points_least', label: 'น้อยที่สุด', compare: (a, b) => a.points - b.points }
    ]
  }
];
const SORT_OPTIONS = Object.fromEntries(SORT_GROUPS.flatMap((g) => g.options).map((o) => [o.key, o]));

export default function AdminUsersScreen({ v }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSorts, setActiveSorts] = useState(['created_newest', null]);
  const setSort = (groupIndex, key) => setActiveSorts((prev) => {
    const next = [...prev];
    next[groupIndex] = key || null;
    return next;
  });
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchUsers = () => {
    axios.get('/api/admin/users', authHeaders())
      .then((res) => setUsers(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายชื่อสมาชิกไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const patchUser = (userId, payload, successMessage) => {
    axios.patch(`/api/admin/users/${userId}`, payload, authHeaders())
      .then((res) => {
        toast.success(res.data.message || successMessage);
        fetchUsers();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const handleRoleChange = (u, role) => patchUser(u.userId, { role }, 'เปลี่ยนบทบาทสำเร็จ');
  const handleToggleActive = (u) => patchUser(u.userId, { isActive: !u.isActive }, u.isActive ? 'ปิดใช้งานบัญชีสำเร็จ' : 'เปิดใช้งานบัญชีสำเร็จ');

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, nickname: u.nickname, studentId: u.studentId || '' });
  };

  const handleSaveEdit = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.nickname.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setIsSaving(true);
    axios.patch(`/api/admin/users/${editingUser.userId}`, {
      firstName: form.firstName, lastName: form.lastName, nickname: form.nickname, studentId: form.studentId || null
    }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'บันทึกการแก้ไขสำเร็จ');
        setEditingUser(null);
        fetchUsers();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSaving(false));
  };

  const q = search.trim().toLowerCase();
  const filteredUsers = (q === '' ? users : users.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
    u.nickname.toLowerCase().includes(q) ||
    (u.studentId || '').toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )).slice();
  const activeComparators = activeSorts.filter(Boolean).map((k) => SORT_OPTIONS[k].compare);
  if (activeComparators.length > 0) {
    filteredUsers.sort((a, b) => {
      for (const cmp of activeComparators) {
        const result = cmp(a, b);
        if (result !== 0) return result;
      }
      return 0;
    });
  }

  return (
    <div style={{ padding: '22px 28px' }}>
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingUser(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>แก้ไขข้อมูลสมาชิก</div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>ชื่อจริง</div>
              <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} style={input} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>นามสกุล</div>
              <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} style={input} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>ชื่อเล่น</div>
              <input value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} style={input} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={label}>รหัสนิสิต</div>
              <input value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} style={input} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditingUser(null)} disabled={isSaving} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
              <button onClick={handleSaveEdit} disabled={isSaving} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>สมาชิกทั้งหมด</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>จัดการข้อมูลและสถานะของสมาชิก</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9, padding: '9px 14px', maxWidth: 360, flex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
          <IoMdSearch size={14} color="#6B7280" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ ชื่อเล่น รหัสนิสิต หรืออีเมล" style={{ border: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#374151' }} />
        </div>
        {SORT_GROUPS.map((group, groupIndex) => (
          <div key={group.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9, padding: '6px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>{group.label}</span>
            <select value={activeSorts[groupIndex] || ''} onChange={(e) => setSort(groupIndex, e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none' }}>
              <option value="">ไม่เรียง</option>
              {group.options.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่พบสมาชิกที่ค้นหา</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredUsers.map((u) => {
            const isSelf = u.userId === v.currentUserId;
            return (
              <div key={u.userId} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, opacity: u.isActive ? 1 : 0.55 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0, color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                  background: u.avatarUrl ? `#EFF6FF url(${u.avatarUrl}) center/cover no-repeat` : '#EFF6FF'
                }}>
                  {!u.avatarUrl && (u.firstName.charAt(0) + u.lastName.charAt(0)).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{u.firstName} {u.lastName} ({u.nickname})</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{u.studentId || 'ไม่มีรหัสนิสิต'} &nbsp;·&nbsp; {u.email}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>{u.points} คะแนน</span>
                {!u.isActive && <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '4px 10px', borderRadius: 6 }}>ปิดใช้งาน</span>}
                <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)} disabled={isSelf} style={{ ...input, width: 130, padding: '8px 10px', opacity: isSelf ? 0.6 : 1 }}>
                  {Object.entries(ROLE_LABELS).map(([key, l]) => <option key={key} value={key}>{l}</option>)}
                </select>
                <button onClick={() => openEdit(u)} style={{ ...btnSecondary, padding: '8px 16px' }}>แก้ไข</button>
                <button
                  onClick={() => handleToggleActive(u)}
                  disabled={isSelf}
                  style={{
                    background: u.isActive ? '#FEE2E2' : '#E8F8EE', color: u.isActive ? '#DC2626' : '#16A34A',
                    border: 'none', padding: '8px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                    cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.6 : 1
                  }}
                >
                  {u.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
