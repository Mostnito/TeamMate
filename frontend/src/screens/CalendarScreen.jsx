import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { label, input, btnPrimary, btnSecondary } from '../styles/common.js';
import { IoMdAdd, IoMdArrowBack, IoMdArrowForward, IoMdCalendar, IoMdTime, IoMdPeople } from 'react-icons/io';

const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const weekdayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const EMPTY_FORM = { title: '', groupId: '', eventTypeId: '', eventDate: '', endDate: '' };

const toDateStr = (d) => d.toISOString().slice(0, 10);

export default function CalendarScreen({ v }) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    let cancelled = false;
    const monthParam = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    setIsLoading(true);
    axios.get(`/api/user/me/calendar-events?month=${monthParam}`, authHeaders())
      .then((res) => { if (!cancelled) setItems(res.data); })
      .catch((err) => { if (!cancelled) toast.error(err.response?.data?.error || 'โหลดปฏิทินไม่สำเร็จ'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [calYear, calMonth]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      axios.get('/api/group/data', authHeaders()),
      axios.get('/api/event-types', authHeaders())
    ]).then(([teamsRes, typesRes]) => {
      if (cancelled) return;
      setTeams(teamsRes.data);
      setEventTypes(typesRes.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const prevMonth = () => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); };
  const nextMonth = () => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); };

  const openItem = (item) => {
    if (item.kind === 'deadline') v.openTaskDetail(item.taskId, item.groupId)();
    else v.openTeam(item.groupId)();
  };

  const todayStr = toDateStr(now);
  const itemsByDay = {};
  items.forEach((it) => {
    const day = Number(it.date.slice(8, 10));
    if (!itemsByDay[day]) itemsByDay[day] = [];
    itemsByDay[day].push(it);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayItems = itemsByDay[d] || [];
    calendarCells.push({ day: d, isToday: dateStr === todayStr, hasEvent: dayItems.length > 0, eventColor: dayItems[0]?.color });
  }

  const upcomingItems = items.filter((it) => it.date >= todayStr).slice(0, 6);
  const todayItems = items.filter((it) => it.date === todayStr);
  const isLeaderAny = teams.some((t) => t.role === 'leader');
  const leaderTeams = teams.filter((t) => t.role === 'leader');

  const canSubmit = form.title.trim() && form.groupId && form.eventTypeId && form.eventDate;

  const handleSubmit = () => {
    if (!canSubmit) { toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    setIsSubmitting(true);
    axios.post(`/api/group/${form.groupId}/calendar-events`, {
      title: form.title.trim(),
      eventDate: form.eventDate,
      endDate: form.endDate || null,
      eventTypeId: form.eventTypeId
    }, authHeaders())
      .then((res) => {
        toast.success(res.data.message || 'เพิ่มกิจกรรมสำเร็จ');
        setModalOpen(false);
        setForm(EMPTY_FORM);
        const monthParam = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
        return axios.get(`/api/user/me/calendar-events?month=${monthParam}`, authHeaders());
      })
      .then((res) => { if (res) setItems(res.data); })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div style={{ padding: '22px 28px' }}>
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>เพิ่มกิจกรรมใหม่</div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>ชื่อกิจกรรม</div>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="เช่น ประชุมทีม" style={input} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>ทีม</div>
              <select value={form.groupId} onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))} style={input}>
                <option value="">เลือกทีม</option>
                {leaderTeams.map((t) => <option key={t.groupId} value={t.groupId}>{t.subjectCode} · {t.subjectName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>ประเภทกิจกรรม</div>
              <select value={form.eventTypeId} onChange={(e) => setForm((f) => ({ ...f, eventTypeId: e.target.value }))} style={input}>
                <option value="">เลือกประเภท</option>
                {eventTypes.map((et) => <option key={et.eventTypeId} value={et.eventTypeId}>{et.labelTh}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>วันที่</div>
              <input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} style={input} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={label}>วันที่สิ้นสุด (ไม่บังคับ)</div>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={input} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setModalOpen(false)} disabled={isSubmitting} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
              <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} style={{ ...btnPrimary, flex: 2, padding: 11, opacity: !canSubmit || isSubmitting ? 0.7 : 1, cursor: !canSubmit || isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มกิจกรรม'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>ปฏิทินกิจกรรม</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>ติดตามกิจกรรมและกำหนดการของกลุ่ม</div>
        </div>
        {isLeaderAny && (
          <button onClick={() => setModalOpen(true)} style={{ background: '#0F9B8E', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> เพิ่มกิจกรรม</button>
        )}
      </div>
      <div className="grid-calendar-split" style={{ gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 }}>
            <span onClick={prevMonth} aria-label="เดือนก่อนหน้า" style={{ cursor: 'pointer', color: '#6B7280', display: 'flex' }}><IoMdArrowBack size={14} /></span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{monthNames[calMonth]} {calYear}</span>
            <span onClick={nextMonth} aria-label="เดือนถัดไป" style={{ cursor: 'pointer', color: '#6B7280', display: 'flex' }}><IoMdArrowForward size={14} /></span>
          </div>
          <div className="calendar-scroll">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>
              {weekdayLabels.map((wd) => <div key={wd}>{wd}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {calendarCells.map((cell, i) => (
                <div key={i} style={{ minHeight: 52, borderRadius: 8, padding: 5, background: cell ? (cell.isToday ? '#EFF6FF' : '#F9FAFB') : 'transparent', position: 'relative' }}>
                  {cell && <div style={{ fontSize: 11, color: cell.isToday ? '#2563EB' : '#374151', fontWeight: 600 }}>{cell.day}</div>}
                  {cell?.hasEvent && <div style={{ height: 4, borderRadius: 2, background: cell.eventColor, marginTop: 4 }}></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>กิจกรรมที่กำลังจะมา</div>
            {isLoading ? (
              <div style={{ fontSize: 12, color: '#6B7280' }}>กำลังโหลด...</div>
            ) : upcomingItems.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>ไม่มีกิจกรรมในเดือนนี้</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingItems.map((it) => (
                  <div key={`${it.kind}-${it.id}`} onClick={() => openItem(it)} style={{ display: 'flex', gap: 9, cursor: 'pointer' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: it.color, marginTop: 5, flexShrink: 0 }}></span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{it.title}</div>
                      <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><IoMdCalendar size={11} /> {it.date} &nbsp; <IoMdTime size={11} /> {it.label}</div>
                      <div style={{ fontSize: 10.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}><IoMdPeople size={11} /> {it.groupLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>กิจกรรมวันนี้</div>
            {todayItems.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>ไม่มีกิจกรรมวันนี้</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayItems.map((it) => (
                  <div key={`${it.kind}-${it.id}`} onClick={() => openItem(it)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{it.title}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{it.groupLabel}</div>
                    </div>
                    <div style={{ fontSize: 11, color: it.color, fontWeight: 600 }}>{it.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
