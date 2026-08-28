import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdPricetag } from 'react-icons/io';

export default function ShopScreen() {
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingItemId, setPendingItemId] = useState(null);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchItems = () => {
    axios.get('/api/shop/items', authHeaders())
      .then((res) => { setItems(res.data.items); setBalance(res.data.balance); })
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดร้านค้าไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handlePurchase = (item) => {
    setPendingItemId(item.itemId);
    axios.post(`/api/shop/items/${item.itemId}/purchase`, {}, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'ซื้อสำเร็จ');
        fetchItems();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setPendingItemId(null));
  };

  const handleEquipToggle = (item) => {
    setPendingItemId(item.itemId);
    axios.put('/api/shop/equipped', { itemId: item.isEquipped ? null : item.itemId }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'สำเร็จ');
        fetchItems();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setPendingItemId(null));
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', color: '#6B7280', fontSize: 13 }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>ร้านค้า</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>ใช้คะแนนที่สะสมแลกฉายาและของรางวัลอื่น ๆ</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '9px 18px', borderRadius: 10, whiteSpace: 'nowrap' }}>
          คะแนนที่ใช้ได้: {balance}
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ยังไม่มีไอเทมในร้านค้า</div>
      ) : (
        <div className="grid-3" style={{ gap: 16 }}>
          {items.map((item) => {
            const canAfford = balance >= item.cost;
            const isPending = pendingItemId === item.itemId;
            return (
              <div key={item.itemId} style={{ ...card, opacity: item.isActive ? 1 : 0.55 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: item.isEquipped ? '#E8F8EE' : '#FEF3C7', color: item.isEquipped ? '#16A34A' : '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IoMdPricetag size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{item.name}</div>
                  </div>
                  {item.isEquipped && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#16A34A', background: '#E8F8EE', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>สวมใส่อยู่</span>}
                  {!item.isActive && !item.isOwned && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>ปิดจำหน่าย</span>}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 14, minHeight: 18 }}>{item.description || '(ไม่มีคำอธิบาย)'}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#D97706' }}>{item.cost} คะแนน</span>
                </div>

                {item.isOwned ? (
                  <button
                    onClick={() => handleEquipToggle(item)}
                    disabled={isPending}
                    style={item.isEquipped
                      ? { ...btnSecondary, width: '100%', padding: 10, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }
                      : { ...btnPrimary, width: '100%', padding: 10, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
                  >
                    {isPending ? 'กำลังดำเนินการ...' : item.isEquipped ? 'ถอด' : 'สวมใส่'}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={isPending || !canAfford || !item.isActive}
                    style={{
                      ...btnPrimary, width: '100%', padding: 10,
                      opacity: isPending || !canAfford || !item.isActive ? 0.5 : 1,
                      cursor: isPending || !canAfford || !item.isActive ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isPending ? 'กำลังซื้อ...' : !item.isActive ? 'ปิดจำหน่าย' : canAfford ? 'ซื้อ' : 'คะแนนไม่พอ'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
