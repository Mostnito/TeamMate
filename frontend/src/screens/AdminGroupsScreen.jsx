import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, cardSm, label, input, btnSecondary, avatar } from '../styles/common.js';
import { IoMdSearch, IoMdTrash } from 'react-icons/io';

export default function AdminGroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchGroups = () => {
    axios.get('/api/admin/groups', authHeaders())
      .then((res) => setGroups(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายชื่อกลุ่มไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchGroups(); }, []);

  const openDetail = (groupId) => {
    setSelectedGroupId(groupId);
    setDetail(null);
    setIsLoadingDetail(true);
    axios.get(`/api/admin/groups/${groupId}`, authHeaders())
      .then((res) => setDetail(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายละเอียดกลุ่มไม่สำเร็จ'))
      .finally(() => setIsLoadingDetail(false));
  };

  const closeDetail = () => { setSelectedGroupId(null); setDetail(null); };

  const handleKickMember = (member) => {
    if (!window.confirm(`ต้องการเตะ ${member.firstName} ${member.lastName} ออกจากกลุ่มใช่หรือไม่?`)) return;
    axios.delete(`/api/group/${selectedGroupId}/members/${member.userId}`, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'เตะสมาชิกออกจากกลุ่มสำเร็จ');
        openDetail(selectedGroupId);
        fetchGroups();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const openDeleteModal = (g) => { setDeleteTarget(g); setDeleteConfirmInput(''); };
  const closeDeleteModal = () => { setDeleteTarget(null); setDeleteConfirmInput(''); };

  const handleDelete = () => {
    setIsDeleting(true);
    axios.delete(`/api/group/${deleteTarget.groupId}`, { data: { confirmCode: deleteConfirmInput }, ...authHeaders() })
      .then((res) => {
        toast.success(res.data.message || 'ลบกลุ่มสำเร็จ');
        closeDeleteModal();
        fetchGroups();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsDeleting(false));
  };

  const q = search.trim().toLowerCase();
  const filteredGroups = q === '' ? groups : groups.filter((g) =>
    g.subjectCode.toLowerCase().includes(q) ||
    g.subjectName.toLowerCase().includes(q) ||
    g.advisorName.toLowerCase().includes(q)
  );

  return (
    <div style={{ padding: '22px 28px' }}>
      {selectedGroupId != null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeDetail}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: 'calc(100vw - 32px)', maxHeight: '85vh', overflowY: 'auto', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            {isLoadingDetail || !detail ? (
              <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{detail.subjectName}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>{detail.subjectCode} &nbsp;·&nbsp; อาจารย์ผู้สอน: {detail.advisorName}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginBottom: 16 }}>รหัสกลุ่ม: {detail.groupCode}</div>

                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>สมาชิก ({detail.members.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detail.members.map((m) => (
                    <div key={m.userId} style={{ ...cardSm, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                      <div style={avatar('#EFF6FF', '#2563EB', 30)}>{(m.firstName.charAt(0) + m.lastName.charAt(0)).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{m.firstName} {m.lastName} ({m.nickname})</div>
                        <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{m.studentId || 'ไม่มีรหัสนิสิต'}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: m.role === 'leader' ? '#2563EB' : '#6B7280' }}>{m.role === 'leader' ? 'หัวหน้าทีม' : 'สมาชิก'}</span>
                      {m.role !== 'leader' && (
                        <span onClick={() => handleKickMember(m)} style={{ fontSize: 10.5, color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}>เตะออก</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={closeDeleteModal}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#DC2626', marginBottom: 10 }}>ลบกลุ่ม {deleteTarget.subjectName}</div>
            <div style={{ fontSize: 12.5, color: '#4B5A6E', lineHeight: 1.7, marginBottom: 16 }}>
              การลบกลุ่มจะลบงาน ไฟล์แนบ และการส่งงานทั้งหมดในกลุ่มนี้อย่างถาวร <b>ไม่สามารถกู้คืนได้</b>
            </div>
            <div style={label}>พิมพ์รหัสวิชา "{deleteTarget.subjectCode}" เพื่อยืนยัน</div>
            <input value={deleteConfirmInput} onChange={(e) => setDeleteConfirmInput(e.target.value)} placeholder={deleteTarget.subjectCode} style={input} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={closeDeleteModal} disabled={isDeleting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmInput !== deleteTarget.subjectCode}
                style={{
                  flex: 2, padding: 11, border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: deleteConfirmInput === deleteTarget.subjectCode ? '#DC2626' : '#F3F4F6',
                  color: deleteConfirmInput === deleteTarget.subjectCode ? '#fff' : '#9CA3AF',
                  cursor: isDeleting || deleteConfirmInput !== deleteTarget.subjectCode ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'กำลังลบ...' : 'ลบกลุ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>กลุ่มทั้งหมด</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>ภาพรวมกลุ่มเรียนทั้งหมดในระบบ คลิกเพื่อดูสมาชิก หรือกดไอคอนถังขยะเพื่อลบกลุ่ม</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9, padding: '9px 14px', marginBottom: 18, maxWidth: 360, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <IoMdSearch size={14} color="#6B7280" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหารหัสวิชา ชื่อวิชา หรืออาจารย์" style={{ border: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#374151' }} />
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่พบกลุ่มที่ค้นหา</div>
      ) : (
        <div className="grid-3" style={{ gap: 16 }}>
          {filteredGroups.map((g) => (
            <div key={g.groupId} onClick={() => openDetail(g.groupId)} style={{ ...card, cursor: 'pointer', position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); openDeleteModal(g); }}
                title="ลบกลุ่ม"
                style={{ position: 'absolute', top: 12, right: 12, background: '#FEE2E2', color: '#DC2626', border: 'none', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <IoMdTrash size={13} />
              </button>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', paddingRight: 30 }}>{g.subjectName}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 10 }}>{g.subjectCode}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 4 }}>อาจารย์ผู้สอน: {g.advisorName}</div>
              <div style={{ fontSize: 11.5, color: '#6B7280' }}>{g.memberCount} สมาชิก &nbsp;·&nbsp; {g.taskCount} งาน</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
