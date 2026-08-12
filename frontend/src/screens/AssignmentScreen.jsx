import { btnPrimary } from '../styles/common.js';

export default function AssignmentScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>งานที่มอบหมาย</div>
        <div style={{ display: 'flex', gap: 6, background: '#F3F4F6', borderRadius: 9, padding: 4 }}>
          <div onClick={v.setAssignmentViewList} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: v.listViewBg, color: v.listViewColor }}>รายการ</div>
          <div onClick={v.setAssignmentViewKanban} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: v.kanbanViewBg, color: v.kanbanViewColor }}>บอร์ด</div>
        </div>
        {v.isCurrentUserLeaderAny && <button onClick={v.addAssignment} style={btnPrimary}>+ เพิ่ม Assignment</button>}
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>ติดตามงานที่ได้รับมอบหมายและกำหนดส่ง</div>

      {v.assignmentIsList && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {v.assignmentFilters.map((f) => (
              <div key={f.label} onClick={f.onClick} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: f.bg, color: f.color }}>{f.label}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {v.assignmentGroups.map((grp) => (
              <div key={grp.task.id}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>📅 วันที่ — {grp.dateLabel}</div>
                <div onClick={grp.task.onOpen} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{grp.task.title}</div>
                    <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 4 }}>{grp.task.groupLabel} &nbsp;·&nbsp; ส่งงานภายใน {grp.task.dueTime} น.</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626', whiteSpace: 'nowrap' }}>เหลือ {grp.task.timeLeft}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {v.assignmentIsKanban && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          {v.kanbanColumns.map((col) => (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{col.label}</span>
                <span style={{ fontSize: 11, color: '#6B7280' }}>{col.count}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.tasks.map((kt, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', marginBottom: 8 }}>{kt.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: kt.tint, color: kt.accent, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kt.initials}</span>
                      <span style={{ fontSize: 10.5, color: '#6B7280' }}>📅 {kt.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
