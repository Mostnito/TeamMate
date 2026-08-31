import { btnPrimary, statusPill } from '../styles/common.js';
import { IoMdArrowBack, IoMdAdd } from 'react-icons/io';

export default function TimelineScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer' }} onClick={v.goBack}>
          <IoMdArrowBack size={16} /><span>งานที่ได้รับมอบหมาย</span>
        </div>
        {v.isCurrentUserLeader && <button onClick={v.openAddTaskTimeline} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}><IoMdAdd size={14} /> เพิ่มงาน</button>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {v.timelineTasks.map((task) => (
          <div key={task.id} onClick={task.onOpen} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {task.assignedTo && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: task.assignedToTint, color: task.assignedToAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{task.assignedToInitials}</div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{task.title}</div>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 4 }}>
                  {task.assignedTo && <>มอบหมายให้: {task.assignedTo} &nbsp;·&nbsp; </>}
                  กลุ่มที่: {task.groupCode} &nbsp;·&nbsp; กำหนดส่ง: {task.dueDate}
                </div>
              </div>
            </div>
            <span style={statusPill(task.statusBg, task.statusColor)}>{task.statusLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
