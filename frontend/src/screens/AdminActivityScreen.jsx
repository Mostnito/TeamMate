import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { btnGhostBlue, btnPrimary, input as inputStyle } from '../styles/common.js';

const ACTION_LABELS = {
  register: 'สมัครสมาชิก',
  login: 'เข้าสู่ระบบ',
  update_profile: 'แก้ไขข้อมูลส่วนตัว',
  update_avatar: 'เปลี่ยนรูปโปรไฟล์',
  create_group: 'สร้างกลุ่ม',
  join_group: 'เข้าร่วมกลุ่ม',
  leave_group: 'ออกจากกลุ่ม',
  kick_member: 'เตะสมาชิกออกจากกลุ่ม',
  delete_group: 'ลบกลุ่ม',
  create_task: 'สร้างงาน',
  update_task: 'แก้ไขงาน',
  delete_task: 'ลบงาน',
  upload_attachment: 'แนบไฟล์',
  delete_attachment: 'ลบไฟล์แนบ',
  start_task: 'เริ่มดำเนินงาน',
  submit_task: 'ส่งงาน',
  review_task: 'ตรวจงาน',
  create_calendar_event: 'เพิ่มกิจกรรมในปฏิทิน',
  submit_peer_evaluation: 'ประเมินเพื่อนร่วมทีม',
  resolve_report: 'ตรวจสอบรายงาน',
  submit_report: 'ส่งรายงาน',
  activate_user: 'เปิดใช้งานบัญชี',
  deactivate_user: 'ปิดใช้งานบัญชี',
  change_user_role: 'เปลี่ยนบทบาทผู้ใช้',
  admin_update_user: 'แก้ไขข้อมูลผู้ใช้ (แอดมิน)'
};

const PAGE_SIZE = 50;

export default function AdminActivityScreen() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchLogs = (before) => {
    const params = new URLSearchParams({ limit: PAGE_SIZE });
    if (before) params.set('before', before);
    if (actionFilter) params.set('action', actionFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (userSearch) params.set('userSearch', userSearch);
    return axios.get(`/api/admin/activity-logs?${params.toString()}`, authHeaders());
  };

  const loadFirstPage = () => {
    setIsLoading(true);
    fetchLogs(null)
      .then((res) => {
        setLogs(res.data);
        setHasMore(res.data.length === PAGE_SIZE);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดบันทึกกิจกรรมไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadFirstPage, [actionFilter, startDate, endDate, userSearch]);

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    setUserSearch(userSearchInput.trim());
  };

  const loadMore = () => {
    if (logs.length === 0) return;
    setIsLoadingMore(true);
    fetchLogs(logs[logs.length - 1].activityLogId)
      .then((res) => {
        setLogs((prev) => [...prev, ...res.data]);
        setHasMore(res.data.length === PAGE_SIZE);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดบันทึกกิจกรรมไม่สำเร็จ'))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 4 }}>ประวัติการใช้งาน</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>ประวัติกิจกรรมของผู้ใช้ทั้งหมดในระบบ</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, color: '#374151', maxWidth: 260 }}>
          <option value="">ทั้งหมด</option>
          {Object.entries(ACTION_LABELS).map(([key, l]) => <option key={key} value={key}>{l}</option>)}
        </select>
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
        {(actionFilter || startDate || endDate || userSearch) && (
          <button
            onClick={() => { setActionFilter(''); setStartDate(''); setEndDate(''); setUserSearchInput(''); setUserSearch(''); }}
            style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>
      ) : logs.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280' }}>ไม่มีบันทึกกิจกรรม</div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {logs.map((log) => (
              <div key={log.activityLogId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid #F9FAFB' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#111827' }}>
                    <span style={{ fontWeight: 600 }}>{log.actorName}</span>
                    <span style={{ color: '#6B7280' }}> {ACTION_LABELS[log.action] || log.action}</span>
                    {log.targetLabel && <span style={{ color: '#6B7280' }}> — {log.targetLabel}</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 2 }}>{new Date(log.createdAt).toLocaleString('th-TH')} {log.ipAddress ? `· ${log.ipAddress}` : ''}</div>
                </div>
              </div>
            ))}
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
