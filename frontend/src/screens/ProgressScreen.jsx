import { IoMdArrowBack, IoMdDocument } from 'react-icons/io';

export default function ProgressScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 700, fontSize: 15, marginBottom: 18, cursor: 'pointer' }} onClick={v.goTeamDetail}>
        <IoMdArrowBack size={16} /><span>ความคืบหน้า</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>ความคืบหน้าโดยรวม</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2563EB' }}>{v.overallProgress}%</div>
        </div>
        <div style={{ height: 8, background: '#EEF2F7', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#2563EB', borderRadius: 5, width: v.overallProgress + '%' }}></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ความคืบหน้างาน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {v.timelineTasks.map((task) => (
              <div key={task.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.statusColor }}></span>
                  <span style={{ fontSize: 12.5, color: '#111827', fontWeight: 500 }}>{task.title}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: task.statusBg, color: task.statusColor }}>{task.statusLabel}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ไฟล์ล่าสุด</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {v.recentFiles.map((f) => (
              <div key={f.name} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IoMdDocument size={15} />
                  <div>
                    <div style={{ fontSize: 12.5, color: '#111827', fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 10.5, color: '#6B7280' }}>{f.meta}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>
                  <span>ดูตัวอย่าง</span><span>ดาวน์โหลด</span><span style={{ color: '#DC2626' }}>ลบ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
