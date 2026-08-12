import { card, cardSm, btnSecondary, textarea } from '../styles/common.js';

export default function TeamDetailScreen({ v }) {
  const g = v.selectedGroup;
  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 600, fontSize: 13.5, marginBottom: 14, cursor: 'pointer' }} onClick={v.goTeams}>
        <span>←</span><span>ทีม {g.letter}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16, boxShadow: '0 6px 18px rgba(0,0,0,0.05)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{g.subjectCode} &nbsp;{g.name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{g.teacher}</div>
        </div>
        <div style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>👥 {g.memberCount} สมาชิก</div>
      </div>

      <div style={{ display: 'flex', gap: 6, background: '#fff', borderRadius: 11, padding: 5, marginBottom: 18, width: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        {v.teamTabs.map((t) => (
          <div key={t.label} onClick={t.onClick} style={{ padding: '9px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', background: t.bg, color: t.color }}>{t.label}</div>
        ))}
      </div>

      {v.teamTabOverview && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {g.members.map((m) => (
            <div key={m.studentId} style={cardSm}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.tint, color: m.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{m.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{m.name}</div>
                  <div style={{ fontSize: 10.5, color: '#6B7280' }}>{m.studentId}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {m.skills.map((sk) => (
                  <span key={sk.label} style={{ fontSize: 10, background: sk.bg, color: sk.color, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>{sk.label}</span>
                ))}
              </div>
              {m.isLeader && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>★ หัวหน้ากลุ่ม</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {v.teamTabBoard && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          {v.teamBoardColumns.map((col) => (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{col.label}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{col.count}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.tasks.map((kt) => (
                  <div key={kt.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{kt.title}</div>
                    {kt.description && <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8, lineHeight: 1.5 }}>{kt.description}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>{kt.dueDate}</span>
                    </div>
                  </div>
                ))}
                {v.isCurrentUserLeaderOfSelected && (
                  <div onClick={col.onAddTask} style={{ border: '1.5px dashed #E5E7EB', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 11.5, color: '#9CA3AF', cursor: 'pointer' }}>+ เพิ่ม Task</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {v.teamTabEvaluation && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>ประเมินเพื่อนร่วมทีม</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>ให้คะแนนสมาชิกแต่ละคน 1-5 คะแนน · การประเมินไม่ระบุตัวตนผู้ประเมิน</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {v.evaluationMembers.map((em) => (
              <div key={em.studentId} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: em.tint, color: em.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5 }}>{em.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{em.name}</div>
                    <div style={{ fontSize: 10.5, color: '#6B7280' }}>{em.studentId}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 14 }}>
                  {em.criteria.map((c) => (
                    <div key={c.label}>
                      <div style={{ fontSize: 11.5, color: '#374151', fontWeight: 600, marginBottom: 5 }}>{c.label}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.stars.map((st) => (
                          <span key={st.n} onClick={st.onClick} style={{ cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{st.n}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: '#374151', fontWeight: 600, marginBottom: 5 }}>ความคิดเห็นเกี่ยวกับการทำงาน</div>
                <textarea value={em.note} onChange={em.onNoteChange} placeholder="เช่น ทำงานตรงเวลา สื่อสารดี ควรปรับปรุงเรื่องเอกสาร" style={{ ...textarea, minHeight: 56 }}></textarea>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button onClick={v.saveEvaluation} style={btnSecondary}>{v.saveEvaluationLabel}</button>
            <button onClick={v.exportEvaluation} disabled={!v.evaluationComplete} style={{ background: v.exportBtnBg, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: v.exportBtnCursor }}>ส่งออกเป็น PDF</button>
          </div>
          {!v.evaluationComplete && <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>กรุณาให้คะแนนสมาชิกทุกคนครบทุกด้านก่อนส่งออก</div>}
        </>
      )}
    </div>
  );
}
