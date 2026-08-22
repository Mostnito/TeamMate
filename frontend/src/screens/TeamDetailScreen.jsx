import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, cardSm, btnGhostBlue, btnPrimary, btnSecondary, label, input } from '../styles/common.js';
import { IoMdArrowBack, IoMdAdd } from 'react-icons/io';
import CreateTaskModal from '../components/CreateTaskModal.jsx';
import ReportModal from '../components/ReportModal.jsx';

const BOARD_COLUMNS = [
  { key: 'pending', label: 'สิ่งที่ต้องทำ', color: '#6B7280' },
  { key: 'in_progress', label: 'กำลังดำเนินการ', color: '#F59E0B' },
  { key: 'under_review', label: 'รอตรวจ', color: '#2563EB' },
  { key: 'completed', label: 'เสร็จสิ้น', color: '#16A34A' }
];

export default function TeamDetailScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardModalColumn, setBoardModalColumn] = useState('pending');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (v.teamId == null) {
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    let cancelled = false;

    Promise.all([
      axios.get('/api/group/data', { headers }),
      axios.get(`/api/group/${v.teamId}/members`, { headers }),
      axios.get(`/api/group/${v.teamId}/tasks`, { headers })
    ])
      .then(([groupsRes, membersRes, tasksRes]) => {
        if (cancelled) return;
        setGroupInfo(groupsRes.data.find((g) => g.groupId === v.teamId) || null);
        setMembers(membersRes.data);
        setTasks(tasksRes.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดข้อมูลทีมไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [v.teamId]);

  const refetchTasks = () => {
    const token = localStorage.getItem('token');
    axios.get(`/api/group/${v.teamId}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTasks(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายการงานไม่สำเร็จ'));
  };

  const isLeader = members.some((m) => m.userId === v.currentUserId && m.role === 'leader');

  const handleKickMember = (userId, name) => {
    if (!window.confirm(`ต้องการเตะ ${name} ออกจากกลุ่มใช่หรือไม่? งานที่มอบหมายให้จะถูกยกเลิกการมอบหมาย`)) return;
    const token = localStorage.getItem('token');
    axios.delete(`/api/group/${v.teamId}/members/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'เตะสมาชิกออกจากกลุ่มสำเร็จ');
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        refetchTasks();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const handleSubmitReport = (detail) => {
    const token = localStorage.getItem('token');
    setIsReporting(true);
    axios.post(`/api/group/${v.teamId}/reports`, { type: 'user', targetId: reportTarget.userId, detail }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'ส่งรายงานสำเร็จ');
        setReportTarget(null);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsReporting(false));
  };

  const handleDeleteGroup = () => {
    const token = localStorage.getItem('token');
    setIsDeletingGroup(true);
    axios.delete(`/api/group/${v.teamId}`, {
      data: { confirmCode: deleteConfirmInput },
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        toast.success(res.data.message || 'ลบกลุ่มสำเร็จ');
        v.goTeams();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsDeletingGroup(false));
  };

  const handleLeaveGroup = () => {
    if (!window.confirm('ต้องการออกจากกลุ่มนี้ใช่หรือไม่? งานที่มอบหมายให้คุณจะถูกยกเลิกการมอบหมาย')) return;
    const token = localStorage.getItem('token');
    axios.delete(`/api/group/${v.teamId}/members/${v.currentUserId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'ออกจากกลุ่มสำเร็จ');
        v.goTeams();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const handleMoveTask = (task, newStatus) => {
    if (task.status === newStatus) return;
    const token = localStorage.getItem('token');
    axios.patch(`/api/task/${task.taskId}`, {
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      status: newStatus
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        refetchTasks();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const openBoardModal = (columnKey) => { setBoardModalColumn(columnKey); setBoardModalOpen(true); };

  const handleSubmitBoardTask = (form) => {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่องาน'); return; }
    const token = localStorage.getItem('token');
    setIsCreatingTask(true);
    axios.post(`/api/group/${v.teamId}/tasks`, {
      title: form.title.trim(),
      description: form.description || '',
      status: boardModalColumn
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'เพิ่มงานสำเร็จ');
        setBoardModalOpen(false);
        refetchTasks();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsCreatingTask(false));
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }
  if (!groupInfo) {
    return (
      <div style={{ padding: '22px 28px' }}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>ไม่พบทีมนี้</div>
        <button onClick={v.goTeams} style={btnGhostBlue}>กลับไปหน้าทีมของฉัน</button>
      </div>
    );
  }

  const boardColumns = BOARD_COLUMNS.map((col) => ({ ...col, tasks: tasks.filter((t) => t.status === col.key) }));

  return (
    <div style={{ padding: '22px 28px' }}>
      <CreateTaskModal
        isOpen={boardModalOpen}
        mode="board"
        assigneeOptions={[]}
        isSubmitting={isCreatingTask}
        onClose={() => setBoardModalOpen(false)}
        onSubmit={handleSubmitBoardTask}
      />
      <ReportModal
        isOpen={!!reportTarget}
        title="รายงานสมาชิก"
        isSubmitting={isReporting}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />
      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#DC2626', marginBottom: 10 }}>ลบกลุ่ม {groupInfo.subjectName}</div>
            <div style={{ fontSize: 12.5, color: '#4B5A6E', lineHeight: 1.7, marginBottom: 16 }}>
              การลบกลุ่มจะลบงาน ไฟล์แนบ และการส่งงานทั้งหมดในกลุ่มนี้อย่างถาวร <b>ไม่สามารถกู้คืนได้</b>
            </div>
            <div style={label}>พิมพ์รหัสวิชา "{groupInfo.subjectCode}" เพื่อยืนยัน</div>
            <input value={deleteConfirmInput} onChange={(e) => setDeleteConfirmInput(e.target.value)} placeholder={groupInfo.subjectCode} style={input} />
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => { setDeleteModalOpen(false); setDeleteConfirmInput(''); }} disabled={isDeletingGroup} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
              <button
                onClick={handleDeleteGroup}
                disabled={isDeletingGroup || deleteConfirmInput !== groupInfo.subjectCode}
                style={{
                  flex: 2, padding: 11, border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: deleteConfirmInput === groupInfo.subjectCode ? '#DC2626' : '#F3F4F6',
                  color: deleteConfirmInput === groupInfo.subjectCode ? '#fff' : '#9CA3AF',
                  cursor: isDeletingGroup || deleteConfirmInput !== groupInfo.subjectCode ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeletingGroup ? 'กำลังลบ...' : 'ลบกลุ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 600, fontSize: 13.5, marginBottom: 14, cursor: 'pointer' }} onClick={v.goTeams}>
        <IoMdArrowBack size={16} /><span>{groupInfo.subjectName}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{groupInfo.subjectCode} &nbsp;{groupInfo.subjectName}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{groupInfo.advisorName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>{groupInfo.memberCount} สมาชิก</div>
          {isLeader ? (
            <button onClick={() => setDeleteModalOpen(true)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ลบกลุ่ม</button>
          ) : (
            <button onClick={handleLeaveGroup} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ออกจากกลุ่ม</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 11, padding: 5, marginBottom: 18, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        {v.teamTabs.map((t) => (
          <div key={t.label} onClick={t.onClick} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: t.bg, color: t.color }}>{t.label}</div>
        ))}
      </div>

      {v.teamTabOverview && (
        <div className="grid-3" style={{ gap: 16 }}>
          {members.map((m) => (
            <div key={m.userId} style={cardSm}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    {(m.firstName.charAt(0) + m.lastName.charAt(0)).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{m.firstName} {m.lastName}</div>
                    <div style={{ fontSize: 10.5, color: '#6B7280' }}>{m.studentId}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {m.userId !== v.currentUserId && (
                    <span onClick={() => setReportTarget(m)} style={{ fontSize: 10.5, color: '#9CA3AF', fontWeight: 600, cursor: 'pointer' }}>รายงาน</span>
                  )}
                  {isLeader && m.role !== 'leader' && (
                    <span onClick={() => handleKickMember(m.userId, `${m.firstName} ${m.lastName}`)} style={{ fontSize: 10.5, color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}>เตะออก</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {m.skills.map((sk) => (
                  <span key={sk} style={{ fontSize: 10, background: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{sk}</span>
                ))}
              </div>
              {m.role === 'leader' ? (
                <span style={{ fontSize: 10.5, background: '#1a569e', color: '#fffffe', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>หัวหน้ากลุ่ม</span>
              ) : (
                <span style={{ fontSize: 10.5, background: '#dfebf5', color: '#1a569e', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>สมาชิก</span>
              )}
            </div>
          ))}
        </div>
      )}

      {v.teamTabBoard && (
        <div className="grid-4" style={{ gap: 18 }}>
          {boardColumns.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = Number(e.dataTransfer.getData('text/plain'));
                const task = tasks.find((t) => t.taskId === taskId);
                if (task) handleMoveTask(task, col.key);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{col.label}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{col.tasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.tasks.map((t) => (
                  <div
                    key={t.taskId}
                    draggable={isLeader}
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', String(t.taskId))}
                    style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', cursor: isLeader ? 'grab' : 'default' }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, lineHeight: 1.5 }}>{t.description}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>{t.dueDate || ''}</span>
                    </div>
                  </div>
                ))}
                {isLeader && (
                  <div onClick={() => openBoardModal(col.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1.5px dashed #E5E7EB', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 11.5, color: '#9CA3AF', cursor: 'pointer' }}><IoMdAdd size={13} /> เพิ่ม Task</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
