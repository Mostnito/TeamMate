import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const STATUS_META = {
  pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
  overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
};

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

export default function TaskDetailScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchTask = () => {
    const token = localStorage.getItem('token');
    return axios.get(`/api/task/${v.selectedTaskId}`, { headers: { Authorization: `Bearer ${token}` } });
  };

  useEffect(() => {
    if (v.selectedTaskId == null) { setIsLoading(false); return; }
    const token = localStorage.getItem('token');
    let cancelled = false;

    fetchTask()
      .then((taskRes) => {
        if (cancelled) return;
        setTask(taskRes.data);
        return axios.get(`/api/group/${taskRes.data.groupId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((membersRes) => {
        if (cancelled || !membersRes) return;
        setIsLeader(membersRes.data.some((m) => m.userId === v.currentUserId && m.role === 'leader'));
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดข้อมูลงานไม่สำเร็จ');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [v.selectedTaskId]);

  const handleDeleteAttachment = (attachmentId) => {
    const token = localStorage.getItem('token');
    axios.delete(`/api/task/${v.selectedTaskId}/attachments/${attachmentId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'ลบไฟล์สำเร็จ');
        setTask((t) => ({ ...t, attachments: t.attachments.filter((a) => a.taskAttachmentId !== attachmentId) }));
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error('ไฟล์ต้องมีขนาดไม่เกิน 20MB');
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    axios.post(`/api/task/${v.selectedTaskId}/attachments`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        toast.success(res.data.message || 'แนบไฟล์สำเร็จ');
        return fetchTask();
      })
      .then((taskRes) => setTask(taskRes.data))
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsUploading(false));
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }
  if (!task) {
    return (
      <div style={{ padding: '22px 28px' }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่พบงานนี้</div>
      </div>
    );
  }

  const meta = STATUS_META[task.status] || STATUS_META.pending;

  return (
    <div style={{ padding: '22px 28px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 12, marginBottom: 6, cursor: 'pointer' }} onClick={v.goTeamTasks}>
        <span>←</span><span>งานที่ได้รับมอบหมาย</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginTop: 8 }}>{task.title}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
        {task.assigneeName && <>มอบหมายให้: {task.assigneeName} &nbsp;·&nbsp; </>}
        กำหนดส่ง: {task.dueDate || 'ไม่ระบุ'}
      </div>
      <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: meta.bg, color: meta.color, margin: '12px 0 4px' }}>{meta.label}</span>

      {task.description && (
        <>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8, marginTop: 14 }}>คำอธิบาย</div>
          <div style={{ fontSize: 12.5, color: '#4B5A6E', lineHeight: 1.7, marginBottom: 18 }}>{task.description}</div>
        </>
      )}

      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>ไฟล์ที่เกี่ยวข้อง</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {task.attachments.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF' }}>ยังไม่มีไฟล์แนบ</div>}
        {task.attachments.map((att) => (
          <div key={att.taskAttachmentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 9, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111827', fontWeight: 600 }}><span>📄</span><span>{att.fileName}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <a href={att.filePath} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>ดาวน์โหลด</a>
              {isLeader && (
                <span onClick={() => handleDeleteAttachment(att.taskAttachmentId)} style={{ color: '#DC2626', fontSize: 13, cursor: 'pointer' }}>✕</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {isLeader && (
        <div style={{ marginBottom: 20 }}>
          <input ref={fileInputRef} type="file" onChange={handleFileChange} disabled={isUploading} style={{ display: 'none' }} />
          <div onClick={() => !isUploading && fileInputRef.current.click()} style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 18, textAlign: 'center', background: '#F7FAFD', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{isUploading ? 'กำลังอัพโหลด...' : 'แนบไฟล์อ้างอิงเพิ่มเติม (สูงสุด 20MB)'}</div>
          </div>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>ส่งงาน</div>
      <div style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 20, textAlign: 'center', background: '#F7FAFD', color: '#9CA3AF', fontSize: 12.5 }}>
        ฟีเจอร์ส่งงานยังไม่เปิดใช้งาน
      </div>
    </div>
  );
}
