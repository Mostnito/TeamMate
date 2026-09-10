import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { IoMdAdd, IoMdAddCircle, IoMdRemoveCircle } from 'react-icons/io';
import { btnGhostBlue, btnPrimary, btnSecondary, input as inputStyle, label } from '../styles/common.js';

const PAGE_SIZE = 50;
const EMPTY_ADJUST_FORM = { amount: '', reason: '' };

export default function AdminPointsScreen() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustForm, setAdjustForm] = useState(EMPTY_ADJUST_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchRows = (before) => {
    const params = new URLSearchParams({ limit: PAGE_SIZE });
    if (before) params.set('before', before);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (userSearch) params.set('userSearch', userSearch);
    return axios.get(`/api/admin/points?${params.toString()}`, authHeaders());
  };

  const loadFirstPage = () => {
    setIsLoading(true);
    fetchRows(null)
      .then((res) => {
        setRows(res.data);
        setHasMore(res.data.length === PAGE_SIZE);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดประวัติคะแนนไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadFirstPage, [startDate, endDate, userSearch]);

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    setUserSearch(userSearchInput.trim());
  };

  const loadMore = () => {
    if (rows.length === 0) return;
    setIsLoadingMore(true);
    fetchRows(rows[rows.length - 1].pointId)
      .then((res) => {
        setRows((prev) => [...prev, ...res.data]);
        setHasMore(res.data.length === PAGE_SIZE);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดประวัติคะแนนไม่สำเร็จ'))
      .finally(() => setIsLoadingMore(false));
  };

  const openModal = () => {
    setModalOpen(true);
    setSelectedUser(null);
    setUserQuery('');
    setAdjustForm(EMPTY_ADJUST_FORM);
    if (allUsers.length === 0) {
      axios.get('/api/admin/users', authHeaders())
        .then((res) => setAllUsers(res.data))
        .catch(() => toast.error('โหลดรายชื่อผู้ใช้ไม่สำเร็จ'));
    }
  };
  const closeModal = () => setModalOpen(false);

  const q = userQuery.trim().toLowerCase();
  const filteredUsers = q === '' ? [] : allUsers.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
    u.nickname.toLowerCase().includes(q) ||
    (u.studentId || '').toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  ).slice(0, 8);

  const amountNum = Number(adjustForm.amount);
  const canSubmit = selectedUser && adjustForm.amount.trim() !== '' && Number.isFinite(amountNum) && amountNum !== 0 && adjustForm.reason.trim();

  const handleSubmitAdjust = () => {
    if (!canSubmit) { toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    setIsSubmitting(true);
    axios.post('/api/admin/points/adjust', { userId: selectedUser.userId, amount: amountNum, reason: adjustForm.reason.trim() }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'บันทึกสำเร็จ');
        closeModal();
        loadFirstPage();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div style={{ padding: '22px 28px' }}>
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>ปรับคะแนนผู้ใช้</div>

            {!selectedUser ? (
              <>
                <div style={label}>ค้นหาผู้ใช้</div>
                <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="ชื่อ ชื่อเล่น รหัสนิสิต หรืออีเมล" style={inputStyle} autoFocus />
                <div style={{ marginTop: 10, maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q !== '' && filteredUsers.length === 0 && (
                    <div style={{ fontSize: 12.5, color: '#9CA3AF', padding: '8px 4px' }}>ไม่พบผู้ใช้</div>
                  )}
                  {filteredUsers.map((u) => (
                    <div
                      key={u.userId}
                      onClick={() => setSelectedUser(u)}
                      style={{ padding: '10px 12px', borderRadius: 9, background: '#F9FAFB', cursor: 'pointer', fontSize: 12.5 }}
                    >
                      <div style={{ fontWeight: 600, color: '#111827' }}>{u.firstName} {u.lastName} ({u.nickname})</div>
                      <div style={{ color: '#6B7280', fontSize: 11 }}>{u.studentId || 'ไม่มีรหัสนิสิต'} · {u.email}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                  <button onClick={closeModal} style={{ ...btnSecondary, padding: '10px 20px' }}>ยกเลิก</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF6FF', borderRadius: 9, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{selectedUser.firstName} {selectedUser.lastName} ({selectedUser.nickname})</div>
                  <span onClick={() => setSelectedUser(null)} style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>เปลี่ยน</span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={label}>จำนวนคะแนน</div>
                  <input type="number" value={adjustForm.amount} onChange={(e) => setAdjustForm((f) => ({ ...f, amount: e.target.value }))} placeholder="เช่น 10 หรือ -5" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={label}>เหตุผล</div>
                  <input value={adjustForm.reason} onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))} placeholder="เช่น ให้รางวัลกิจกรรมพิเศษ" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button onClick={closeModal} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
                  <button onClick={handleSubmitAdjust} disabled={!canSubmit || isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: !canSubmit || isSubmitting ? 0.7 : 1, cursor: !canSubmit || isSubmitting ? 'not-allowed' : 'pointer' }}>
                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>จัดการคะแนน</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>ประวัติคะแนนของผู้ใช้ทั้งหมดใ</div>
        </div>
        <button onClick={openModal} style={{ ...btnPrimary, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
          จัดการคะแนน
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, width: 150 }} title="ตั้งแต่วันที่" />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>ถึง</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, width: 150 }} title="ถึงวันที่" />
        <form onSubmit={handleUserSearchSubmit} style={{ display: 'flex', gap: 6 }}>
          <input
            value={userSearchInput}
            onChange={(e) => setUserSearchInput(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้"
            style={{ ...inputStyle, width: 180 }}
          />
          <button type="submit" style={{ ...btnPrimary, padding: '9px 18px' }}>ค้นหา</button>
        </form>
        {(startDate || endDate || userSearch) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setUserSearchInput(''); setUserSearch(''); }}
            style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่มีประวัติคะแนน</div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {rows.map((r) => {
              const isPositive = r.pointsEarned >= 0;
              return (
                <div key={r.pointId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid #F9FAFB' }}>
                  <span style={{ color: isPositive ? '#16A34A' : '#DC2626', display: 'flex', flexShrink: 0 }}>
                    {isPositive ? <IoMdAddCircle size={18} /> : <IoMdRemoveCircle size={18} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#111827' }}>
                      <span style={{ fontWeight: 600 }}>{r.userName}</span>
                      <span style={{ color: '#6B7280' }}> — {r.reason}</span>
                      {r.groupLabel && <span style={{ color: '#6B7280' }}> ({r.groupLabel})</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2 }}>{new Date(r.createdAt).toLocaleString('th-TH')}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: isPositive ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                    {isPositive ? '+' : ''}{r.pointsEarned}
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={loadMore} disabled={isLoadingMore} style={{ ...btnGhostBlue, opacity: isLoadingMore ? 0.6 : 1, cursor: isLoadingMore ? 'not-allowed' : 'pointer' }}>
                {isLoadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
