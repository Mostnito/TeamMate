import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, textarea, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdArrowBack, IoMdTrash, IoMdDocument } from 'react-icons/io';

const STATUS_META = {
  pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
  in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
  under_review: { label: 'รอตรวจ', bg: '#EFF6FF', color: '#1D4ED8' },
  completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
  overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
  cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
};

const REVIEW_STATUS_META = {
  approved: { label: 'อนุมัติ', bg: '#E8F8EE', color: '#16A34A' },
  rejected: { label: 'ไม่ผ่าน', bg: '#FEE2E2', color: '#DC2626' },
  revision_requested: { label: 'ขอแก้ไข', bg: '#FEF3C7', color: '#D97706' }
};

const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const EMPTY_EDIT_FORM = { title: '', description: '', assignedTo: '', dueDate: '', status: 'pending' };

export default function TaskDetailScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [isSavingSubmission, setIsSavingSubmission] = useState(false);
  const [isUploadingSubmission, setIsUploadingSubmission] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewStatus: 'approved', comment: '' });
  const [isSavingReview, setIsSavingReview] = useState(false);
  const fileInputRef = useRef(null);
  const submissionFileInputRef = useRef(null);

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
        setSubmissionNote(taskRes.data.submission?.note || '');
        return axios.get(`/api/group/${taskRes.data.groupId}/members`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then((membersRes) => {
        if (cancelled || !membersRes) return;
        setMembers(membersRes.data);
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

  const uploadAttachment = (file, setUploadingState) => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error('ไฟล์ต้องมีขนาดไม่เกิน 20MB');
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    setUploadingState(true);
    axios.post(`/api/task/${v.selectedTaskId}/attachments`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        toast.success(res.data.message || 'แนบไฟล์สำเร็จ');
        return fetchTask();
      })
      .then((taskRes) => setTask(taskRes.data))
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setUploadingState(false));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    uploadAttachment(file, setIsUploading);
  };

  const handleSubmissionFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    uploadAttachment(file, setIsUploadingSubmission);
  };

  const openEditModal = () => {
    setEditForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo || '',
      dueDate: task.dueDate || '',
      status: task.status
    });
    setEditModalOpen(true);
  };

  const onEditField = (field) => (e) => setEditForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) { toast.error('กรุณากรอกชื่องาน'); return; }
    const token = localStorage.getItem('token');
    setIsSaving(true);
    axios.patch(`/api/task/${v.selectedTaskId}`, {
      title: editForm.title.trim(),
      description: editForm.description || '',
      assignedTo: editForm.assignedTo || null,
      dueDate: editForm.dueDate || null,
      status: editForm.status
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'บันทึกการแก้ไขงานสำเร็จ');
        setEditModalOpen(false);
        return fetchTask();
      })
      .then((taskRes) => setTask(taskRes.data))
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSaving(false));
  };

  const handleDeleteTask = () => {
    if (!window.confirm('ต้องการลบงานนี้ใช่หรือไม่? ไฟล์แนบทั้งหมดจะถูกลบไปด้วย')) return;
    const token = localStorage.getItem('token');
    setIsDeleting(true);
    axios.delete(`/api/task/${v.selectedTaskId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'ลบงานสำเร็จ');
        v.goTeamTasks();
      })
      .catch((err) => {
        toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        setIsDeleting(false);
      });
  };

  const handleStartTask = () => {
    const token = localStorage.getItem('token');
    setIsStarting(true);
    axios.patch(`/api/task/${v.selectedTaskId}/start`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'เริ่มดำเนินการงานแล้ว');
        return fetchTask();
      })
      .then((taskRes) => setTask(taskRes.data))
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsStarting(false));
  };

  const handleSaveSubmission = () => {
    const token = localStorage.getItem('token');
    setIsSavingSubmission(true);
    axios.post(`/api/task/${v.selectedTaskId}/submission`, { note: submissionNote }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'บันทึกการส่งงานสำเร็จ');
        return fetchTask();
      })
      .then((taskRes) => { setTask(taskRes.data); setSubmissionNote(taskRes.data.submission?.note || ''); })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSavingSubmission(false));
  };

  const onReviewField = (field) => (e) => setReviewForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveReview = () => {
    const token = localStorage.getItem('token');
    setIsSavingReview(true);
    axios.post(`/api/task/${v.selectedTaskId}/review`, reviewForm, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'บันทึกผลการตรวจสำเร็จ');
        setReviewForm({ reviewStatus: 'approved', comment: '' });
        return fetchTask();
      })
      .then((taskRes) => setTask(taskRes.data))
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSavingReview(false));
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
  const referenceAttachments = task.attachments.filter((a) => a.uploadedBy === task.assignedBy);
  const submissionAttachments = task.attachments.filter((a) => a.uploadedBy === task.assignedTo);
  const isAssignee = task.assignedTo != null && task.assignedTo === v.currentUserId;

  return (
    <div style={{ padding: '22px 28px', maxWidth: 760 }}>
      {editModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>แก้ไขงาน</div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>ชื่องาน</div>
              <input value={editForm.title} onChange={onEditField('title')} style={input} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>รายละเอียด / เกี่ยวกับอะไร</div>
              <textarea value={editForm.description} onChange={onEditField('description')} style={textarea}></textarea>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>มอบหมายให้</div>
              <select value={editForm.assignedTo} onChange={onEditField('assignedTo')} style={input}>
                <option value="">ทั้งทีม (ไม่ระบุ)</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>กำหนดส่ง</div>
              <input type="date" value={editForm.dueDate} onChange={onEditField('dueDate')} style={input} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={label}>สถานะ</div>
              <select value={editForm.status} onChange={onEditField('status')} style={input}>
                {Object.entries(STATUS_META).map(([key, m]) => (
                  <option key={key} value={key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditModalOpen(false)} disabled={isSaving} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
              <button onClick={handleSaveEdit} disabled={isSaving} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 12, marginBottom: 6, cursor: 'pointer' }} onClick={v.goTeamTasks}>
        <IoMdArrowBack size={14} /><span>งานที่ได้รับมอบหมาย</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginTop: 8 }}>{task.title}</div>
        {isLeader && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={openEditModal} style={{ ...btnSecondary, padding: '7px 14px', fontSize: 12 }}>แก้ไขงาน</button>
            <button onClick={handleDeleteTask} disabled={isDeleting} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer' }}>
              {isDeleting ? 'กำลังลบ...' : 'ลบงาน'}
            </button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
        {task.assigneeName && <>มอบหมายให้: {task.assigneeName} &nbsp;·&nbsp; </>}
        กำหนดส่ง: {task.dueDate || 'ไม่ระบุ'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 4px' }}>
        <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: meta.bg, color: meta.color }}>{meta.label}</span>
        {isAssignee && task.status === 'pending' && (
          <button onClick={handleStartTask} disabled={isStarting} style={{ ...btnPrimary, padding: '8px 18px', fontSize: 12.5, boxShadow: '0 2px 8px rgba(37,99,235,0.35)', opacity: isStarting ? 0.7 : 1, cursor: isStarting ? 'not-allowed' : 'pointer' }}>
            {isStarting ? 'กำลังเริ่ม...' : '▶ เริ่มดำเนินการ'}
          </button>
        )}
      </div>

      {task.description && (
        <>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8, marginTop: 14 }}>คำอธิบาย</div>
          <div style={{ fontSize: 12.5, color: '#4B5A6E', lineHeight: 1.7, marginBottom: 18 }}>{task.description}</div>
        </>
      )}

      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>ไฟล์ที่เกี่ยวข้อง</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {referenceAttachments.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF' }}>ยังไม่มีไฟล์แนบ</div>}
        {referenceAttachments.map((att) => (
          <div key={att.taskAttachmentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 9, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111827', fontWeight: 600 }}><IoMdDocument size={15} /><span>{att.fileName}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <a href={att.filePath} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>ดาวน์โหลด</a>
              {(isLeader || att.uploadedBy === v.currentUserId) && (
                <span onClick={() => handleDeleteAttachment(att.taskAttachmentId)} style={{ color: '#DC2626', cursor: 'pointer', display: 'flex' }}><IoMdTrash size={14} /></span>
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
      {task.assignedTo == null ? (
        <div style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 20, textAlign: 'center', background: '#F7FAFD', color: '#9CA3AF', fontSize: 12.5, marginBottom: 20 }}>
          งานนี้ยังไม่ได้มอบหมายให้ใคร รอหัวหน้ามอบหมายก่อนจึงจะส่งงานได้
        </div>
      ) : isAssignee && task.status === 'pending' ? (
        <div style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 20, textAlign: 'center', background: '#F7FAFD', color: '#9CA3AF', fontSize: 12.5, marginBottom: 20 }}>
          กรุณากดเริ่มดำเนินการก่อนจึงจะส่งงานได้
        </div>
      ) : isAssignee ? (
        <div style={{ marginBottom: 20 }}>
          <textarea value={submissionNote} onChange={(e) => setSubmissionNote(e.target.value)} placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)" style={{ ...textarea, marginBottom: 10 }}></textarea>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {submissionAttachments.map((att) => (
              <div key={att.taskAttachmentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 9, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111827', fontWeight: 600 }}><IoMdDocument size={15} /><span>{att.fileName}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <a href={att.filePath} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>ดาวน์โหลด</a>
                  <span onClick={() => handleDeleteAttachment(att.taskAttachmentId)} style={{ color: '#DC2626', cursor: 'pointer', display: 'flex' }}><IoMdTrash size={14} /></span>
                </div>
              </div>
            ))}
          </div>
          <input ref={submissionFileInputRef} type="file" onChange={handleSubmissionFileChange} disabled={isUploadingSubmission} style={{ display: 'none' }} />
          <div onClick={() => !isUploadingSubmission && submissionFileInputRef.current.click()} style={{ border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 14, textAlign: 'center', background: '#F7FAFD', cursor: isUploadingSubmission ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{isUploadingSubmission ? 'กำลังอัพโหลด...' : 'แนบไฟล์งานที่ส่ง (สูงสุด 20MB)'}</div>
          </div>
          <button onClick={handleSaveSubmission} disabled={isSavingSubmission} style={{ width: '100%', background: '#0F9B8E', color: '#fff', border: 'none', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: isSavingSubmission ? 'not-allowed' : 'pointer', opacity: isSavingSubmission ? 0.7 : 1 }}>
            {isSavingSubmission ? 'กำลังบันทึก...' : 'บันทึกการส่งงาน'}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {task.submission ? (
            <div style={{ background: '#fff', borderRadius: 9, padding: '12px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              {task.submission.note && <div style={{ fontSize: 12.5, color: '#4B5A6E', marginBottom: 8, lineHeight: 1.6 }}>{task.submission.note}</div>}
              {submissionAttachments.map((att) => (
                <div key={att.taskAttachmentId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#111827', fontWeight: 600, marginTop: 6 }}>
                  <IoMdDocument size={15} /><a href={att.filePath} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'none' }}>{att.fileName}</a>
                </div>
              ))}
              <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 8 }}>ส่งเมื่อ {new Date(task.submission.submittedAt).toLocaleString('th-TH')}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>ยังไม่มีการส่งงาน</div>
          )}
        </div>
      )}

      {task.assignedTo != null && (task.reviews.length > 0 || isLeader) && (
        <>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 8 }}>การตรวจงาน</div>
          {task.reviews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {task.reviews.map((r) => {
                const rMeta = REVIEW_STATUS_META[r.reviewStatus];
                return (
                  <div key={r.reviewId} style={{ background: '#fff', borderRadius: 9, padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.comment ? 6 : 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: rMeta.bg, color: rMeta.color }}>{rMeta.label}</span>
                      <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>{new Date(r.reviewedAt).toLocaleString('th-TH')}</span>
                    </div>
                    {r.comment && <div style={{ fontSize: 12, color: '#4B5A6E' }}>{r.comment}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {isLeader && (
            task.submission ? (
              <div style={{ marginBottom: 20 }}>
                <select value={reviewForm.reviewStatus} onChange={onReviewField('reviewStatus')} style={{ ...input, marginBottom: 10 }}>
                  <option value="approved">อนุมัติ</option>
                  <option value="rejected">ไม่ผ่าน</option>
                  <option value="revision_requested">ขอแก้ไข</option>
                </select>
                <textarea value={reviewForm.comment} onChange={onReviewField('comment')} placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)" style={{ ...textarea, marginBottom: 10 }}></textarea>
                <button onClick={handleSaveReview} disabled={isSavingReview} style={{ ...btnPrimary, width: '100%', padding: 12, opacity: isSavingReview ? 0.7 : 1, cursor: isSavingReview ? 'not-allowed' : 'pointer' }}>
                  {isSavingReview ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจ'}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>ยังไม่มีการส่งงาน จึงยังตรวจไม่ได้</div>
            )
          )}
        </>
      )}
    </div>
  );
}
