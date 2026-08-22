import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdSearch } from 'react-icons/io';

const ROLE_LABELS = { student: 'นักเรียน', advisor: 'อาจารย์', admin: 'แอดมิน' };
const EMPTY_FORM = { firstName: '', lastName: '', nickname: '', studentId: '' };

export default function AdminUsersScreen({ v }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
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
  const filteredUsers = q === '' ? users : users.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
    u.nickname.toLowerCase().includes(q) ||
    (u.studentId || '').toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  );

  return (
    <div style={{ padding: '22px 28px' }}>
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingUser(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 380, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
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
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>จัดการข้อมูล บทบาท และสถานะการใช้งานของสมาชิก</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9, padding: '9px 14px', marginBottom: 18, maxWidth: 360, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <IoMdSearch size={14} color="#6B7280" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อ ชื่อเล่น รหัสนิสิต หรืออีเมล" style={{ border: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#374151' }} />
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
              <div key={u.userId} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14, opacity: u.isActive ? 1 : 0.55 }}>
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
