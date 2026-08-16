import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, cardSm, btnGhostBlue } from '../styles/common.js';
import CreateTaskModal from '../components/CreateTaskModal.jsx';

const BOARD_COLUMNS = [
  { key: 'pending', label: 'To Do', color: '#6B7280' },
  { key: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { key: 'completed', label: 'Done', color: '#16A34A' }
];

export default function TeamDetailScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardModalColumn, setBoardModalColumn] = useState('pending');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 600, fontSize: 13.5, marginBottom: 14, cursor: 'pointer' }} onClick={v.goTeams}>
        <span>←</span><span>{groupInfo.subjectName}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{groupInfo.subjectCode} &nbsp;{groupInfo.subjectName}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{groupInfo.advisorName}</div>
        </div>
        <div style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>👥 {groupInfo.memberCount} สมาชิก</div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 11, padding: 5, marginBottom: 18, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        {v.teamTabs.map((t) => (
          <div key={t.label} onClick={t.onClick} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: t.bg, color: t.color }}>{t.label}</div>
        ))}
      </div>

      {v.teamTabOverview && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {members.map((m) => (
            <div key={m.userId} style={cardSm}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {(m.firstName.charAt(0) + m.lastName.charAt(0)).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize: 10.5, color: '#6B7280' }}>{m.studentId}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {m.skills.map((sk) => (
                  <span key={sk} style={{ fontSize: 10, background: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{sk}</span>
                ))}
              </div>
              {m.role === 'leader' ? (
                <span style={{ fontSize: 10.5, background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>★ หัวหน้ากลุ่ม</span>
              ) : (
                <span style={{ fontSize: 10.5, background: '#F3F4F6', color: '#6B7280', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>สมาชิก</span>
              )}
            </div>
          ))}
        </div>
      )}

      {v.teamTabBoard && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
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
                  <div onClick={() => openBoardModal(col.key)} style={{ border: '1.5px dashed #E5E7EB', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 11.5, color: '#9CA3AF', cursor: 'pointer' }}>+ เพิ่ม Task</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {v.teamTabEvaluation && (
        <div style={card}>
          <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>ฟีเจอร์นี้ยังไม่เปิดใช้งาน</div>
        </div>
      )}
    </div>
  );
}
