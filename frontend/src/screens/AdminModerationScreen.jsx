import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, inputSm, btnPrimary, btnSecondary } from '../styles/common.js';

export default function AdminModerationScreen() {
  const [bannedWordsList, setBannedWordsList] = useState([]);
  const [newBannedWord, setNewBannedWord] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('/api/admin/settings/banned-words', { headers, signal: controller.signal })
      .then((res) => {
        setBannedWordsList((res.data.bannedWords || '').split(',').map((w) => w.trim()).filter(Boolean));
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        toast.error('ไม่สามารถโหลดการคัดกรองได้');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleAddBannedWord = () => {
    const word = newBannedWord.trim();
    if (!word) return;
    if (bannedWordsList.includes(word)) { toast.error('มีคำนี้อยู่แล้ว'); return; }
    setBannedWordsList((list) => [...list, word]);
    setNewBannedWord('');
  };
  const handleRemoveBannedWord = (word) => setBannedWordsList((list) => list.filter((w) => w !== word));
  const onNewBannedWordKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddBannedWord(); }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setIsSubmitting(true);
    try {
      await axios.put('/api/admin/settings/banned-words', { bannedWords: bannedWordsList.join(',') }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('บันทึกการคัดกรองแล้ว');
    } catch (err) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', color: '#6B7280', fontSize: 13 }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '22px 28px', maxWidth: 640 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>การคัดกรอง</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>จัดการคำต้องห้ามในแชท ระบบจะเซ็นเซอร์และแจ้งรายงานให้อัตโนมัติ</div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 14 }}>คำต้องห้ามในแชท</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <input
            value={newBannedWord}
            onChange={(e) => setNewBannedWord(e.target.value)}
            onKeyDown={onNewBannedWordKeyDown}
            placeholder="พิมพ์คำต้องห้ามแล้วกด Enter หรือเพิ่ม"
            style={inputSm}
          />
          <button onClick={handleAddBannedWord} style={btnSecondary}>เพิ่ม</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {bannedWordsList.length === 0 ? (
            <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>ยังไม่มีคำต้องห้าม</div>
          ) : bannedWordsList.map((word) => (
            <div key={word} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 6px 14px', borderRadius: 20, fontSize: 12.5, background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>
              {word}
              <span onClick={() => handleRemoveBannedWord(word)} style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1, padding: '0 2px' }}>×</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={isSubmitting} style={{ ...btnPrimary, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกนโยบาย'}
          </button>
        </div>
      </div>
    </div>
  );
}
