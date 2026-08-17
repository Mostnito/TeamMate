import { IoMdAdd, IoMdArrowBack, IoMdArrowForward, IoMdCalendar, IoMdTime, IoMdPeople } from 'react-icons/io';

export default function CalendarScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>ปฏิทินกิจกรรม</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>ติดตามกิจกรรมและกำหนดการของกลุ่ม</div>
        </div>
        {v.isCurrentUserLeaderAny && (
          <button onClick={v.addCalendarEvent} style={{ background: '#0F9B8E', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> เพิ่มกิจกรรม</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 }}>
            <span onClick={v.prevMonth} style={{ cursor: 'pointer', color: '#6B7280', display: 'flex' }}><IoMdArrowBack size={14} /></span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{v.calendarLabel}</span>
            <span onClick={v.nextMonth} style={{ cursor: 'pointer', color: '#6B7280', display: 'flex' }}><IoMdArrowForward size={14} /></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 6, fontWeight: 600 }}>
            {v.weekdayLabels.map((wd) => <div key={wd}>{wd}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {v.calendarCells.map((cell, i) => (
              <div key={i} style={{ minHeight: 52, borderRadius: 8, padding: 5, background: cell.bg, position: 'relative' }}>
                <div style={{ fontSize: 11, color: cell.textColor, fontWeight: 600 }}>{cell.day}</div>
                {cell.hasEvent && <div style={{ height: 4, borderRadius: 2, background: cell.eventColor, marginTop: 4 }}></div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>กิจกรรมที่กำลังจะมา</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {v.upcomingEvents.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color, marginTop: 5 }}></span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{ev.title}</div>
                    <div style={{ fontSize: 10.5, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><IoMdCalendar size={11} /> {ev.date} &nbsp; <IoMdTime size={11} /> {ev.time}</div>
                    <div style={{ fontSize: 10.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}><IoMdPeople size={11} /> {ev.group}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 10 }}>กิจกรรมวันนี้</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>ทีม A</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>ประชุมทีม A &nbsp;·&nbsp; ห้อง 301</div>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>10:00–11:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
