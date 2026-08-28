import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdAdd, IoMdPricetag } from 'react-icons/io';
import ShopItemModal from '../components/ShopItemModal.jsx';

const TYPE_LABELS = { title: 'ฉายา' };

export default function AdminShopScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchItems = () => {
    axios.get('/api/admin/shop-items', authHeaders())
      .then((res) => setItems(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดรายการไอเทมไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setModalTarget(null); setModalOpen(true); };
  const openEdit = (i) => { setModalTarget(i); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); fetchItems(); };

  const handleSubmit = (form) => {
    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      type: form.type, cost: parseInt(form.cost, 10)
    };
    if (!payload.name) {
      toast.error('กรุณากรอกชื่อไอเทม');
      return;
    }
    setIsSubmitting(true);
    const request = modalTarget?.itemId
      ? axios.put(`/api/admin/shop-items/${modalTarget.itemId}`, payload, authHeaders())
      : axios.post('/api/admin/shop-items', payload, authHeaders());

    request
      .then((res) => {
        toast.success(res.data.message || (modalTarget?.itemId ? 'บันทึกการแก้ไขสำเร็จ' : 'สร้างไอเทมสำเร็จ'));
        setModalOpen(false);
        fetchItems();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSubmitting(false));
  };

  const handleToggleActive = (i) => {
    axios.put(`/api/admin/shop-items/${i.itemId}`, { isActive: !i.isActive }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || (i.isActive ? 'ปิดใช้งานไอเทมสำเร็จ' : 'เปิดใช้งานไอเทมสำเร็จ'));
        fetchItems();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
  };

  return (
    <div style={{ padding: '22px 28px' }}>
      <ShopItemModal
        isOpen={modalOpen}
        item={modalTarget}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>จัดการร้านค้า</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>จัดการร้านค้า</div>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> เพิ่มไอเทม</button>
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีไอเทม กดปุ่มด้านบนเพื่อเพิ่ม</div>
      ) : (
        <div className="grid-3" style={{ gap: 16 }}>
          {items.map((i) => (
            <div key={i.itemId} style={{ ...card, opacity: i.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IoMdPricetag size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{i.name}</div>
                  <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{TYPE_LABELS[i.type] || i.type}</div>
                </div>
                {!i.isActive && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>ปิดใช้งาน</span>}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, minHeight: 18 }}>{i.description || '(ไม่มีคำอธิบาย)'}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '4px 10px', borderRadius: 6 }}>{i.cost} คะแนน</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 6 }}>ซื้อแล้ว {i.purchaseCount} คน</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(i)} style={{ ...btnSecondary, flex: 1, padding: 9 }}>แก้ไข</button>
                <button
                  onClick={() => handleToggleActive(i)}
                  style={{
                    flex: 1, background: i.isActive ? '#FEE2E2' : '#E8F8EE', color: i.isActive ? '#DC2626' : '#16A34A',
                    border: 'none', padding: 9, borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {i.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
