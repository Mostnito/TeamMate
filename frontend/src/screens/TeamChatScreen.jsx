import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { IoMdArrowBack, IoMdSend } from 'react-icons/io';

export default function TeamChatScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (v.teamId == null) { setIsLoading(false); return; }
    const token = localStorage.getItem('token');
    let cancelled = false;

    axios.get(`/api/group/${v.teamId}/messages`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (!cancelled) setMessages(res.data); })
      .catch((err) => { if (!cancelled) toast.error(err.response?.data?.error || 'โหลดประวัติแชทไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    const socket = io('/', { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_group', v.teamId));
    socket.on('message_received', (msg) => {
      if (msg.groupId === v.teamId) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [v.teamId]);

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

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
        <span style={{ cursor: 'pointer', color: '#374151', display: 'flex' }} onClick={v.backToTeamDetail}><IoMdArrowBack size={16} /></span>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>แชททีม</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>ยังไม่มีข้อความ เริ่มการสนทนาได้เลย</div>}
        {messages.map((msg) => {
          const mine = msg.senderId === v.currentUserId;
          return (
            <div key={msg.messageId} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: mine ? 'row-reverse' : 'row', maxWidth: '60%' }}>
                <div style={{ background: mine ? '#2563EB' : '#F3F4F6', color: mine ? '#fff' : '#111827', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5 }}>{msg.content}</div>
              </div>
              <div style={{ fontSize: 10, color: '#AEB9C6', marginTop: 4 }}>{msg.senderName} · {new Date(msg.sentAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="พิมพ์ข้อความ..." style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 20, padding: '10px 16px', fontSize: 13, background: '#F9FAFB' }} />
        <button onClick={handleSend} style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IoMdSend size={16} /></button>
      </div>
    </div>
  );
}
