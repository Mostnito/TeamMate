import { useEffect, useState } from 'react';
import { label, input, textarea, btnPrimary, btnSecondary } from '../styles/common.js';

const EMPTY_FORM = { name: '', description: '', type: 'title', cost: 10 };

const TYPE_OPTIONS = [
  { value: 'title', label: 'ฉายา' }
];

export default function ShopItemModal({ isOpen, item, isSubmitting, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;
    setForm(item ? {
      name: item.name, description: item.description || '', type: item.type, cost: item.cost
    } : EMPTY_FORM);
  }, [isOpen, item?.itemId]);

  if (!isOpen) return null;

  const stopPropagation = (e) => e.stopPropagation();
  const onField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={stopPropagation} style={{ width: 420, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>
          {item ? 'แก้ไขไอเทมร้านค้า' : 'เพิ่มไอเทมร้านค้าใหม่'}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={label}>ชื่อไอเทม</div>
          <input value={form.name} onChange={onField('name')} placeholder="เช่น นักสู้ตัวยง" style={input} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>คำอธิบาย</div>
          <textarea value={form.description} onChange={onField('description')} placeholder="อธิบายไอเทมนี้" style={textarea}></textarea>
        </div>
        <div className="grid-2" style={{ gap: 12, marginBottom: 6 }}>
          <div>
            <div style={label}>ชนิด</div>
            <select value={form.type} onChange={onField('type')} style={input}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={label}>ราคา (คะแนน)</div>
            <input type="number" min="1" value={form.cost} onChange={onField('cost')} style={input} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
          <button onClick={() => onSubmit(form)} disabled={isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
            {isSubmitting ? 'กำลังบันทึก...' : item ? 'บันทึกการแก้ไข' : 'สร้างไอเทม'}
          </button>
        </div>
      </div>
    </div>
  );
}
