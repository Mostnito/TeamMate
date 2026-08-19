import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { card, cardSm, btnPrimary, btnGhostBlue, textarea, avatar } from '../styles/common.js';
import { IoMdArrowBack } from 'react-icons/io';

const CRITERIA = [
  { key: 'responsibility', label: 'ความรับผิดชอบ' },
  { key: 'quality', label: 'คุณภาพงาน' },
  { key: 'communication', label: 'การสื่อสาร' },
  { key: 'punctuality', label: 'การตรงต่อเวลา' },
  { key: 'teamwork', label: 'การทำงานร่วมกับทีม' }
];

const lockedBox = {
  border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: 20, textAlign: 'center',
  background: '#F7FAFD', color: '#9CA3AF', fontSize: 12.5
};

export default function TeamEvaluationScreen({ v }) {
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [evalData, setEvalData] = useState({ progress: { total: 0, completed: 0, isComplete: false }, given: [], received: null });
  const [summary, setSummary] = useState(null);
  const [forms, setForms] = useState({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchAll = () => Promise.all([
    axios.get(`/api/group/${v.teamId}/members`, authHeaders()),
    axios.get(`/api/group/${v.teamId}/evaluations/me`, authHeaders()),
    axios.get('/api/group/data', authHeaders())
  ]);

  const buildForms = (membersList, given) => {
    const givenMap = new Map(given.map((g) => [g.evaluateeId, g]));
    const next = {};
    membersList.filter((m) => m.userId !== v.currentUserId).forEach((m) => {
      const g = givenMap.get(m.userId);
      next[m.userId] = { scores: g ? { ...g.scores } : {}, comment: g ? g.comment || '' : '', isSaved: !!g };
    });
    return next;
  };

  useEffect(() => {
    if (v.teamId == null) { setIsLoading(false); return; }
    let cancelled = false;

    fetchAll()
      .then(([membersRes, evalRes, groupsRes]) => {
        if (cancelled) return;
        setMembers(membersRes.data);
        setEvalData(evalRes.data);
        setForms(buildForms(membersRes.data, evalRes.data.given));
        setGroupInfo(groupsRes.data.find((g) => g.groupId === v.teamId) || null);
        const leader = membersRes.data.some((m) => m.userId === v.currentUserId && m.role === 'leader');
        setIsLeader(leader);
        if (leader) {
          return axios.get(`/api/group/${v.teamId}/evaluations/summary`, authHeaders()).then((res) => {
            if (!cancelled) setSummary(res.data);
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.error || 'โหลดข้อมูลการประเมินไม่สำเร็จ');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [v.teamId]);

  const refetchEvaluations = () => {
    const token = localStorage.getItem('token');
    axios.get(`/api/group/${v.teamId}/evaluations/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setEvalData(res.data);
        setForms((prev) => {
          const givenMap = new Map(res.data.given.map((g) => [g.evaluateeId, g]));
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            const g = givenMap.get(Number(id));
            next[id] = { ...next[id], isSaved: !!g };
          });
          return next;
        });
        if (isLeader) {
          axios.get(`/api/group/${v.teamId}/evaluations/summary`, { headers: { Authorization: `Bearer ${token}` } })
            .then((sres) => setSummary(sres.data))
            .catch(() => {});
        }
      })
      .catch((err) => toast.error(err.response?.data?.error || 'โหลดข้อมูลการประเมินไม่สำเร็จ'));
  };

  const setScore = (evaluateeId, criterion, value) => {
    setForms((prev) => ({ ...prev, [evaluateeId]: { ...prev[evaluateeId], scores: { ...prev[evaluateeId].scores, [criterion]: value } } }));
  };

  const setComment = (evaluateeId, comment) => {
    setForms((prev) => ({ ...prev, [evaluateeId]: { ...prev[evaluateeId], comment } }));
  };

  const handleSaveAll = () => {
    const teammates = members.filter((m) => m.userId !== v.currentUserId);
    if (teammates.some((m) => CRITERIA.some((c) => !forms[m.userId].scores[c.key]))) {
      toast.error('กรุณาให้คะแนนเพื่อนร่วมทีมให้ครบทุกคนก่อนบันทึก');
      return;
    }
    setIsSavingAll(true);
    const token = localStorage.getItem('token');
    const evaluations = teammates.map((m) => ({ evaluateeId: m.userId, scores: forms[m.userId].scores, comment: forms[m.userId].comment }));
    axios.post(`/api/group/${v.teamId}/evaluations`, { evaluations }, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        toast.success(res.data.message || 'บันทึกการประเมินทั้งหมดสำเร็จ');
        refetchEvaluations();
      })
      .catch((err) => toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'))
      .finally(() => setIsSavingAll(false));
  };

  const handleExportPdf = () => {
    const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const rowsHtml = summary.members.map((sm) => {
      const m = membersById.get(sm.userId);
      if (!m) return '';
      const scoreCells = CRITERIA.map((c) => `<td style="text-align:center;padding:8px;border:1px solid #ddd;">${sm.averages[c.key] != null ? sm.averages[c.key] : '-'}</td>`).join('');
      return `<tr><td style="padding:8px;border:1px solid #ddd;">${esc(m.firstName)} ${esc(m.lastName)}</td>${scoreCells}<td style="text-align:center;padding:8px;border:1px solid #ddd;">${sm.evaluatorCount}</td></tr>`;
    }).join('');
    const criteriaHeaders = CRITERIA.map((c) => `<th>${esc(c.label)}</th>`).join('');
    const scriptOpen = '<' + 'script>';
    const scriptClose = '<' + '/script>';
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ผลการประเมิน ' + esc(groupInfo?.subjectCode || '') + '</title>' +
      '<style>body{font-family:"Segoe UI",Tahoma,sans-serif;padding:32px;color:#111827;}h1{font-size:20px;margin-bottom:4px;}p{font-size:13px;color:#555;margin-bottom:20px;}table{border-collapse:collapse;width:100%;font-size:12.5px;}th{padding:8px;border:1px solid #ddd;background:#f3f4f6;text-align:left;}</style>' +
      '</head><body>' +
      `<h1>ผลการประเมินสมาชิกในทีม ${esc(groupInfo?.subjectName || '')}</h1>` +
      `<p>รหัสวิชา ${esc(groupInfo?.subjectCode || '')} · คะแนนเต็มข้อละ 5 · ไม่ระบุตัวตนผู้ประเมิน</p>` +
      `<table><thead><tr><th>ชื่อสมาชิก</th>${criteriaHeaders}<th>จำนวนผู้ประเมิน</th></tr></thead><tbody>${rowsHtml}</tbody></table>` +
      scriptOpen + 'window.onload = function(){ window.print(); };' + scriptClose +
      '</body></html>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    toast.success('เปิดหน้าต่างสำหรับส่งออก PDF แล้ว');
  };

  if (isLoading) {
    return <div style={{ padding: '22px 28px', fontSize: 13, color: '#6B7280' }}>กำลังโหลด...</div>;
  }

  const { progress, received } = evalData;
  const teammates = members.filter((m) => m.userId !== v.currentUserId);
  const progressPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const membersById = new Map(members.map((m) => [m.userId, m]));
  const canSaveAll = teammates.length > 0 && teammates.every((m) => CRITERIA.every((c) => !!forms[m.userId].scores[c.key]));

  return (
    <div style={{ padding: '22px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 700, fontSize: 15, marginBottom: 18, cursor: 'pointer' }} onClick={v.backToTeamDetail}>
        <IoMdArrowBack size={16} /><span>ประเมินเพื่อนร่วมทีม</span>
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        {progress.total === 0 ? (
          <div style={{ fontSize: 12.5, color: '#6B7280' }}>ทีมนี้มีสมาชิกเพียงคนเดียว ไม่มีใครให้ประเมิน</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>คุณประเมินเพื่อนร่วมทีมแล้ว {progress.completed}/{progress.total} คน</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#2563EB' }}>{progressPct}%</div>
            </div>
            <div style={{ height: 8, background: '#EEF2F7', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: 5, width: progressPct + '%' }}></div>
            </div>
          </>
        )}
      </div>

      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ให้คะแนนเพื่อนร่วมทีม</div>
      {teammates.length === 0 ? (
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>ไม่มีสมาชิกอื่นให้ประเมิน</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {teammates.map((m) => {
            const form = forms[m.userId];
            return (
              <div key={m.userId} style={cardSm}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={avatar('#EFF6FF', '#2563EB', 36)}>{(m.firstName.charAt(0) + m.lastName.charAt(0)).toUpperCase()}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{m.firstName} {m.lastName}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: form.isSaved ? '#16A34A' : '#9CA3AF' }}>{form.isSaved ? 'บันทึกแล้ว ✓' : 'ยังไม่ได้ให้คะแนน'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {CRITERIA.map((c) => (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#374151' }}>{c.label}</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[1, 2, 3, 4, 5].map((n) => {
                          const active = form.scores[c.key] === n;
                          return (
                            <div key={n} onClick={() => setScore(m.userId, c.key, n)} style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: active ? '#2563EB' : '#F3F4F6', color: active ? '#fff' : '#6B7280' }}>{n}</div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <textarea value={form.comment} onChange={(e) => setComment(m.userId, e.target.value)} placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)" style={textarea}></textarea>
              </div>
            );
          })}
          <button
            onClick={handleSaveAll}
            disabled={!canSaveAll || isSavingAll}
            style={{ ...btnPrimary, opacity: !canSaveAll || isSavingAll ? 0.6 : 1, cursor: !canSaveAll || isSavingAll ? 'not-allowed' : 'pointer' }}
          >
            {isSavingAll ? 'กำลังบันทึก...' : 'บันทึกการประเมินทั้งหมด'}
          </button>
        </div>
      )}

      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', marginBottom: 12 }}>ผลคะแนนที่คุณได้รับ</div>
      {!progress.isComplete ? (
        <div style={{ ...lockedBox, marginBottom: 24 }}>ประเมินเพื่อนร่วมทีมให้ครบทุกคนก่อน จึงจะดูผลคะแนนที่คุณได้รับได้</div>
      ) : !received || received.evaluatorCount === 0 ? (
        <div style={{ ...lockedBox, marginBottom: 24 }}>ยังไม่มีใครประเมินคุณ</div>
      ) : (
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 12 }}>มีผู้ประเมิน {received.evaluatorCount} คน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: received.comments.length ? 14 : 0 }}>
            {CRITERIA.map((c) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#374151' }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>{received.averages[c.key] != null ? received.averages[c.key] : '-'} / 5</span>
              </div>
            ))}
          </div>
          {received.comments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {received.comments.map((cm, i) => (
                <div key={i} style={{ ...cardSm, boxShadow: 'none', background: '#F9FAFB', fontSize: 12, color: '#374151' }}>{cm}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLeader && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>ภาพรวมคะแนนทีม</div>
            {summary && summary.isUnlocked && (
              <button onClick={handleExportPdf} style={btnGhostBlue}>ส่งออกเป็น PDF</button>
            )}
          </div>
          {!summary || !summary.isUnlocked ? (
            <div style={lockedBox}>กรุณาประเมินเพื่อนร่วมทีมของคุณให้ครบก่อน จึงจะดูภาพรวมคะแนนทีมได้</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.members.map((sm) => {
                const m = membersById.get(sm.userId);
                if (!m) return null;
                return (
                  <div key={sm.userId} style={cardSm}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={avatar('#EFF6FF', '#2563EB', 30)}>{(m.firstName.charAt(0) + m.lastName.charAt(0)).toUpperCase()}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{m.firstName} {m.lastName}</div>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>ผู้ประเมิน {sm.evaluatorCount} คน</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {CRITERIA.map((c) => (
                        <div key={c.key} style={{ fontSize: 11.5, color: '#6B7280' }}>
                          {c.label}: <span style={{ fontWeight: 700, color: '#111827' }}>{sm.averages[c.key] != null ? sm.averages[c.key] : '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
