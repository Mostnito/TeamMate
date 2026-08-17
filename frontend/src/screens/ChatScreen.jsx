import { IoMdArrowBack, IoMdAttach, IoMdHappy, IoMdSend } from 'react-icons/io';

export default function ChatScreen({ v }) {
  const g = v.selectedGroup;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
        <span style={{ cursor: 'pointer', color: '#374151', display: 'flex' }} onClick={v.goTeamDetail}><IoMdArrowBack size={16} /></span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}># กลุ่ม {g.code}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{g.memberCount} สมาชิก · 3 ผู้ใช้งาน</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {v.chatMessages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.align }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: msg.rowDir, maxWidth: '60%' }}>
              <div style={{ background: msg.bubbleBg, color: msg.bubbleColor, padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5 }}>{msg.text}</div>
            </div>
            <div style={{ fontSize: 10, color: '#AEB9C6', marginTop: 4 }}>{msg.author} · {msg.time}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
        <span style={{ color: '#6B7280', cursor: 'pointer', display: 'flex' }}><IoMdAttach size={18} /></span>
        <span style={{ color: '#6B7280', cursor: 'pointer', display: 'flex' }}><IoMdHappy size={18} /></span>
        <input value={v.chatInput} onChange={v.onChatInputChange} onKeyDown={v.onChatKeyDown} placeholder="พิมพ์ข้อความ..." style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 20, padding: '10px 16px', fontSize: 13, background: '#F9FAFB' }} />
        <button onClick={v.sendChat} style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IoMdSend size={16} /></button>
      </div>
    </div>
  );
}
