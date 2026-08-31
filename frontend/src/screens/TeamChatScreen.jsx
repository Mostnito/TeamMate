import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { IoMdArrowBack, IoMdSend, IoMdFlag, IoMdImage, IoMdDownload } from 'react-icons/io';
import ReportModal from '../components/ReportModal.jsx';

const IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'วันนี้';
  if (isSameDay(date, yesterday)) return 'เมื่อวาน';
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function TeamChatScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [reads, setReads] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (v.teamId == null) { setIsLoading(false); return; }
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    let cancelled = false;

    axios.get(`/api/group/${v.teamId}/messages`, authHeaders)
      .then((res) => { if (!cancelled) setMessages(res.data); })
      .catch((err) => { if (!cancelled) toast.error(err.response?.data?.error || 'โหลดประวัติแชทไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    axios.get(`/api/group/${v.teamId}/members`, authHeaders)
      .then((res) => { if (!cancelled) setMembers(res.data); })
      .catch(() => {});

    axios.get(`/api/group/${v.teamId}/message-reads`, authHeaders)
      .then((res) => {
        if (cancelled) return;
        const map = {};
        res.data.forEach((r) => { map[r.userId] = r.lastReadMessageId; });
        setReads(map);
      })
      .catch(() => {});

    const socket = io('/', { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_group', v.teamId));
    socket.on('message_received', (msg) => {
      if (msg.groupId !== v.teamId) return;
      setMessages((prev) => [...prev, msg]);
      // chat screen is open and the new message just rendered - mark it read immediately
      // instead of waiting for the user to leave and re-enter the chat
      socket.emit('join_group', v.teamId);
    });
    socket.on('read_receipt_updated', (data) => {
      if (data.groupId !== v.teamId) return;
      setReads((prev) => ({ ...prev, [data.userId]: data.lastReadMessageId }));
      // members who join the group after this screen already fetched its member list
      // are missing from `members`, so their read markers would never render - refetch when that happens
      setMembers((prev) => {
        if (!prev.some((m) => m.userId === data.userId)) {
          axios.get(`/api/group/${v.teamId}/members`, authHeaders)
            .then((res) => { if (!cancelled) setMembers(res.data); })
            .catch(() => {});
        }
        return prev;
      });
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [v.teamId]);

  const readMarkersByMessageId = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      if (member.userId === v.currentUserId) return;
      const lastReadMessageId = reads[member.userId];
      if (lastReadMessageId == null) return;
      // find the latest message this member has read that they didn't send themselves -
      // a "read by them" chip on their own message is redundant and confusing; it belongs
      // on the last message from someone else (usually us) that they've actually read
      let readMessage = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.messageId > lastReadMessageId) continue;
        if (msg.senderId === member.userId) continue;
        readMessage = msg;
        break;
      }
      if (!readMessage) return;
      if (!map[readMessage.messageId]) map[readMessage.messageId] = [];
      map[readMessage.messageId].push(member);
    });
    return map;
  }, [messages, reads, members, v.currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('send_message', { groupId: v.teamId, content: text });
    setChatInput('');
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSend(); };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');

    setIsUploadingImage(true);
    try {
      await axios.post(`/api/group/${v.teamId}/messages/image`, formData, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitReport = (detail) => {
    const token = localStorage.getItem('token');
    setIsReporting(true);
    axios.post(`/api/group/${v.teamId}/reports`, { type: 'chat_message', targetId: reportTarget.messageId, detail }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'ส่งรายงานสำเร็จ');
        setReportTarget(null);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsReporting(false));
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReportModal
        isOpen={!!reportTarget}
        title="รายงานข้อความ"
        isSubmitting={isReporting}
        onClose={() => setReportTarget(null)}
        onSubmit={handleSubmitReport}
      />
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
        <span style={{ cursor: 'pointer', color: '#374151', display: 'flex' }} onClick={v.goBack}><IoMdArrowBack size={16} /></span>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>แชททีม</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>ยังไม่มีข้อความ เริ่มการสนทนาได้เลย</div>}
        {messages.map((msg, idx) => {
          const mine = msg.senderId === v.currentUserId;
          const readers = readMarkersByMessageId[msg.messageId];
          const prevMsg = messages[idx - 1];
          const showDateDivider = !prevMsg || !isSameDay(new Date(msg.sentAt), new Date(prevMsg.sentAt));
          return (
            <Fragment key={msg.messageId}>
              {showDateDivider && (
                <div style={{ textAlign: 'center', margin: '4px 0' }}>
                  <span style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '4px 14px', borderRadius: 12 }}>
                    {formatDateLabel(msg.sentAt)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: mine ? 'row-reverse' : 'row', maxWidth: '60%' }}>
                {!mine && (
                  <div
                    onClick={v.openUserProfile(msg.senderPublicId)}
                    title={`ดูโปรไฟล์ของ ${msg.senderName}`}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0, color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, cursor: 'pointer',
                      background: msg.senderAvatarUrl ? `#EFF6FF url(${msg.senderAvatarUrl}) center/cover no-repeat` : '#EFF6FF'
                    }}
                  >
                    {!msg.senderAvatarUrl && msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                {msg.imageUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={msg.imageUrl}
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                      style={{ maxWidth: 220, maxHeight: 220, borderRadius: 12, cursor: 'pointer', display: 'block', objectFit: 'cover' }}
                      alt="รูปภาพในแชท"
                    />
                    <a
                      href={msg.imageUrl}
                      download
                      onClick={(e) => e.stopPropagation()}
                      title="ดาวน์โหลดรูปภาพ"
                      style={{
                        position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                        background: 'rgba(17,24,39,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <IoMdDownload size={13} />
                    </a>
                  </div>
                ) : (
                  <div style={{ background: mine ? '#2563EB' : '#F3F4F6', color: mine ? '#fff' : '#111827', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5 }}>{msg.content}</div>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#AEB9C6', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{msg.senderName} · {new Date(msg.sentAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                {!mine && (
                  <span onClick={() => setReportTarget(msg)} title="รายงานข้อความนี้" style={{ cursor: 'pointer', color: '#AEB9C6', display: 'flex' }}>
                    <IoMdFlag size={11} />
                  </span>
                )}
              </div>
              {readers && readers.length > 0 && (
                <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                  {readers.map((reader) => (
                    <div
                      key={reader.userId}
                      title={`อ่านแล้วโดย ${reader.nickname || reader.firstName}`}
                      style={{
                        width: 14, height: 14, borderRadius: '50%', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 7, border: '1px solid #fff',
                        background: reader.avatarUrl ? `#EFF6FF url(${reader.avatarUrl}) center/cover no-repeat` : '#EFF6FF'
                      }}
                    >
                      {!reader.avatarUrl && (reader.nickname || reader.firstName).charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              )}
            </div>
            </Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} style={{ display: 'none' }} />
        <span
          onClick={() => !isUploadingImage && imageInputRef.current?.click()}
          title="ส่งรูปภาพ"
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploadingImage ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: isUploadingImage ? 0.6 : 1 }}
        >
          <IoMdImage size={17} />
        </span>
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="พิมพ์ข้อความ..." style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 20, padding: '10px 16px', fontSize: 13, background: '#F9FAFB' }} />
        <button onClick={handleSend} style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IoMdSend size={16} /></button>
      </div>
    </div>
  );
}
