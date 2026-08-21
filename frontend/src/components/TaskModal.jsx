import { label, input, textarea, btnPrimary, btnSecondary } from '../styles/common.js';

export default function TaskModal({ v }) {
  if (!v.taskModalOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={v.closeTaskModal}>
      <div onClick={v.stopPropagation} style={{ width: 420, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, padding: 26, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 18 }}>เพิ่มงานใหม่</div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>ชื่องาน</div>
          <input value={v.taskForm.title} onChange={v.onTaskFormTitle} placeholder="เช่น ออกแบบหน้า Login" style={input} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={label}>รายละเอียด / เกี่ยวกับอะไร</div>
          <textarea value={v.taskForm.description} onChange={v.onTaskFormDescription} placeholder="อธิบายว่างานนี้เกี่ยวกับอะไร ต้องทำอะไรบ้าง" style={textarea}></textarea>
        </div>
        {v.isTaskModalTimeline && (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={label}>มอบหมายให้</div>
              <select value={v.taskForm.assigneeIdx} onChange={v.onTaskFormAssignee} style={input}>
                {v.taskFormAssigneeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={label}>กำหนดส่ง</div>
              <input type="date" value={v.taskForm.dueDate} onChange={v.onTaskFormDueDate} style={input} />
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={v.closeTaskModal} style={{ ...btnSecondary, flex: 1, padding: 11 }}>ยกเลิก</button>
          <button onClick={v.submitTaskModal} style={{ ...btnPrimary, flex: 2, padding: 11 }}>เพิ่มงาน</button>
        </div>
      </div>
    </div>
  );
}
