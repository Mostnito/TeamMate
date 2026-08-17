import { IoMdCheckmark, IoMdCloseCircle } from 'react-icons/io';

export default function AdminScreen({ v }) {
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>คัดกรองการกระทำ</div>
      </div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>ตรวจสอบการกระทำ ข้อผิดพลาดของระบบ และความปลอดภัย</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {v.adminStats.map((st) => (
          <div key={st.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', flex: 1, boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>{st.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: st.color, marginTop: 4 }}>{st.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 11, padding: 5, marginBottom: 18, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', flexWrap: 'wrap' }}>
        {v.adminTabs.map((t) => (
          <div key={t.label} onClick={t.onClick} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</div>
        ))}
      </div>

      {v.adminTabModeration && (
        <>
          {v.hasModerationItems && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {v.moderationItems.map((item) => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: item.typeBg, color: item.typeColor }}>{item.typeLabel}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{item.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{item.detail}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>ผู้ยื่นคำขอ: {item.requester} &nbsp;·&nbsp; กลุ่ม: {item.group}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={item.onApprove} style={{ background: '#E8F8EE', color: '#16A34A', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdCheckmark size={14} /> อนุมัติ</button>
                    <button onClick={item.onReject} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><IoMdCloseCircle size={14} /> ปฏิเสธ</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {v.noModerationItems && <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280', fontSize: 13 }}>ไม่มีรายการที่รอตรวจสอบ</div>}
        </>
      )}

      {v.adminTabErrors && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {v.errorLogs.map((err, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: err.levelBg, color: err.levelColor, whiteSpace: 'nowrap', marginTop: 1 }}>{err.level}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', fontFamily: 'monospace' }}>{err.message}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>แหล่งที่มา: {err.source} &nbsp;·&nbsp; ผู้ใช้ที่พบ: {err.affectedUser}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>{err.time}</span>
            </div>
          ))}
        </div>
      )}

      {v.adminTabSecurity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {v.securityAlerts.map((sec, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: sec.severityBg, color: sec.severityColor }}>{sec.severityLabel}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{sec.title}</span>
                </div>
                <span style={{ fontSize: 11, color: '#6B7280' }}>{sec.time}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{sec.detail}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>บัญชี: {sec.account} &nbsp;·&nbsp; IP: {sec.ip}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
