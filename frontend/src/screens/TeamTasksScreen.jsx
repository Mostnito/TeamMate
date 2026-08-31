import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { btnPrimary, statusPill } from '../styles/common.js';
import CreateTaskModal from '../components/CreateTaskModal.jsx';
import { IoMdArrowBack, IoMdAdd } from 'react-icons/io';

const STATUS_META = {
  pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  under_review: { label: 'รอตรวจ', bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
  overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
};

export default function TeamTasksScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchAll = () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return Promise.all([
      axios.get(`/api/group/${v.teamId}/members`, { headers }),
      axios.get(`/api/group/${v.teamId}/tasks`, { headers })
    ]);
  };

  useEffect(() => {
    if (v.teamId == null) { setIsLoading(false); return; }
    let cancelled = false;
    fetchAll()
      .then(([membersRes, tasksRes]) => {
        if (cancelled) return;
        setMembers(membersRes.data);
        setTasks(tasksRes.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดรายการงานไม่สำเร็จ');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [v.teamId]);

  const refetchTasks = () => {
    const token = localStorage.getItem('token');
    axios.get(`/api/group/${v.teamId}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTasks(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายการงานไม่สำเร็จ'));
  };

  const isLeader = members.some((m) => m.userId === v.currentUserId && m.role === 'leader');
  const assigneeOptions = members.map((m) => ({ value: m.userId, label: `${m.firstName} ${m.lastName}` }));

  const handleSubmitTask = (form) => {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่องาน'); return; }
    const token = localStorage.getItem('token');
    setIsCreatingTask(true);
    axios.post(`/api/group/${v.teamId}/tasks`, {
      title: form.title.trim(),
      description: form.description || '',
      assignedTo: form.assigneeIdx || null,
      dueDate: form.dueDate || null,
      status: 'pending'
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'เพิ่มงานสำเร็จ');
        setModalOpen(false);
        refetchTasks();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsCreatingTask(false));
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '22px 28px' }}>
      <CreateTaskModal
        isOpen={modalOpen}
        mode="timeline"
        assigneeOptions={assigneeOptions}
        isSubmitting={isCreatingTask}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitTask}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer' }} onClick={v.goBack}>
          <IoMdArrowBack size={16} /><span>งานที่ได้รับมอบหมาย</span>
        </div>
        {isLeader && <button onClick={() => setModalOpen(true)} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> เพิ่มงาน</button>}
      </div>
      {tasks.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีงานในทีมนี้</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map((task) => {
            const meta = STATUS_META[task.status] || STATUS_META.pending;
            return (
              <div key={task.taskId} onClick={v.openTaskDetail(task.taskId)} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{task.title}</div>
                  <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 4 }}>
                    {task.assigneeName && <>มอบหมายให้: {task.assigneeName} &nbsp;·&nbsp; </>}
                    กำหนดส่ง: {task.dueDate || 'ไม่ระบุ'}
                  </div>
                </div>
                <span style={statusPill(meta.bg, meta.color)}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
