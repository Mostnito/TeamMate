import { useCallback, useRef, useState } from 'react';
import {
  ADMIN_EMAIL, LEADER_EMAIL, initialGroupsData, initialTasks,
  initialCalendarEvents, initialAdminUsersList, initialModerationQueue, skillOptionsList
} from '../data/seedData.js';

const initialState = {
  screen: 'login',
  isAdminMode: false,
  loginEmail: '', loginPassword: '', loginShowPw: false, loginError: '',
  su: { firstName: '', lastName: '', nickname: '', studentId: '', gender: '', birthdate: '', email: '', phone: '', skills: [], skillOther: '', password: '', confirmPassword: '' },
  signupError: '',
  cg: { code: '', name: '', teacher: '' },
  cgError: '',
  joinDigits: ['', '', '', '', '', ''],
  joinError: '',
  newGroupCode: '',
  copyLabel: 'คัดลอก',
  selectedGroupId: 'A',
  teamTab: 'overview',
  chatInput: '',
  chatByGroup: {
    100001: [
      { id: 1, author: 'สมหญิง', text: 'อัพเดต wireframe หน้าแรกแล้วนะ', mine: false, time: '10:30' },
      { id: 2, author: 'สมชาย วิลิ', text: 'โอเค เดี๋ยวรีวิว วันนี้', mine: true, time: '10:32' },
      { id: 3, author: 'สมชาย วิลิ', text: 'อย่าลืม test case เสร็จ meeting ถัดไป', mine: true, time: '10:47' },
      { id: 4, author: 'ประเสริฐ', text: 'สรุปรอบเดินสาย 5 หน้า จะส่งอัปเดตนี้ 📎', mine: false, time: '11:00' }
    ]
  },
  assignmentFilter: 'all',
  assignmentView: 'list',
  selectedAssignmentId: 1,
  submitNote: '',
  submissions: [],
  submitButtonLabel: 'ส่งงาน',
  calYear: 2026, calMonth: 2,
  skillOptions: [...skillOptionsList],
  settingsProfile: { fullName: 'สมชาย วิลิ', nickname: 'อาย', email: 'somchai@example.com', password: '6012345678', skills: ['Frontend', 'UI/UX Design'], skillOther: '' },
  notifSettings: { newTask: true, chatMsg: true, deadline: true, deadlineReminder: false },
  saveSettingsLabel: 'บันทึกการตั้งค่า',
  adminFilter: 'all',
  adminTab: 'moderation',
  evaluations: {},
  adminProfile: { name: 'ผู้ดูแลระบบ', email: 'admin@teammate.com', password: '••••••••' },
  policy: { bannedWords: 'สแปม, คำหยาบ', logRetentionDays: '90' },
  adminNotif: { newPending: true, criticalError: true, highSecurity: true },
  saveAdminSettingsLabel: 'บันทึกการตั้งค่า',
  saveEvaluationLabel: 'บันทึกการประเมิน',
  leaderboardPeriod: 'all',
  tasks: initialTasks,
  taskModalOpen: false,
  taskModalColumn: 'pending',
  taskModalGroupId: null,
  taskForm: { title: '', description: '', assigneeIdx: 0, dueDate: '' },
  calendarEvents: initialCalendarEvents,
  adminUsersList: initialAdminUsersList,
  currentUser: { name: '', firstName: '', studentId: '' },
  moderationQueue: initialModerationQueue,
  toasts: [],
  groupsData: initialGroupsData
};

// "อื่น ๆ" resolves to a real skill name and (if new) grows the shared skill list,
// mirroring an upsert into the `skills` lookup table instead of storing free text.
function resolveSkills(skills, skillOther, skillOptions) {
  if (!skills.includes('อื่น ๆ')) return { skills, skillOptions };
  const custom = (skillOther || '').trim();
  if (!custom) return { skills: skills.filter((x) => x !== 'อื่น ๆ'), skillOptions };
  const existing = skillOptions.find((s) => s !== 'อื่น ๆ' && s.toLowerCase() === custom.toLowerCase());
  const finalName = existing || custom;
  const newSkillOptions = existing ? skillOptions : [...skillOptions.slice(0, -1), finalName, 'อื่น ๆ'];
  const newSkills = skills.map((s) => (s === 'อื่น ๆ' ? finalName : s));
  return { skills: newSkills, skillOptions: newSkillOptions };
}

export default function useAppState() {
  const [state, setState] = useState(initialState);
  const evalCacheRef = useRef({});

  const notify = useCallback((type, msg) => {
    const id = Date.now() + Math.random();
    setState((s) => ({ ...s, toasts: [...s.toasts, { id, type, msg }] }));
    setTimeout(() => setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })), 2500);
  }, []);

  const dismissToast = (id) => () => setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }));
  const stopPropagation = (e) => e.stopPropagation();

  const go = (screen) => () => setState((s) => ({ ...s, screen }));

  const onLoginEmailChange = (e) => setState((s) => ({ ...s, loginEmail: e.target.value, loginError: '' }));
  const onLoginPasswordChange = (e) => setState((s) => ({ ...s, loginPassword: e.target.value, loginError: '' }));
  const toggleLoginPw = () => setState((s) => ({ ...s, loginShowPw: !s.loginShowPw }));

  const handleLogin = () => {
    setState((s) => {
      const { loginEmail, loginPassword } = s;
      if (!/^\S+@\S+\.\S+$/.test(loginEmail)) return { ...s, loginError: 'กรุณากรอกอีเมลให้ถูกต้อง' };
      if (!loginPassword) return { ...s, loginError: 'กรุณากรอกรหัสผ่าน' };
      if (loginEmail.toLowerCase() === ADMIN_EMAIL) {
        notify('success', 'เข้าสู่ระบบสำเร็จ');
        return { ...s, screen: 'admin', loginError: '', isAdminMode: true, currentUser: { name: 'ผู้ดูแลระบบ', firstName: 'ผู้ดูแลระบบ' } };
      }
      if (loginEmail.toLowerCase() === LEADER_EMAIL) {
        notify('success', 'เข้าสู่ระบบสำเร็จในฐานะหัวหน้ากลุ่ม');
        return { ...s, screen: 'dashboard', loginError: '', isAdminMode: false, currentUser: { name: 'สมชาย วิลิ', firstName: 'สมชาย', studentId: '6412001' } };
      }
      const local = loginEmail.split('@')[0].replace(/[._]+/g, ' ').trim();
      const parts = local.split(' ').filter(Boolean);
      const displayName = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || local;
      notify('success', 'เข้าสู่ระบบสำเร็จ');
      return { ...s, screen: 'dashboard', loginError: '', isAdminMode: false, currentUser: { name: displayName, firstName: parts[0] || displayName } };
    });
  };

  const onSu = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, su: { ...s.su, [field]: v } })); };
  const onSuSkillOther = (e) => { const v = e.target.value; setState((s) => ({ ...s, su: { ...s.su, skillOther: v } })); };
  const toggleGender = (g) => () => setState((s) => ({ ...s, su: { ...s.su, gender: g } }));
  const toggleSkill = (skill) => () => setState((s) => {
    const has = s.su.skills.includes(skill);
    return { ...s, su: { ...s.su, skills: has ? s.su.skills.filter((x) => x !== skill) : [...s.su.skills, skill] } };
  });

  const handleSignup = () => {
    setState((s) => {
      const su = s.su;
      if (!su.firstName || !su.lastName || !su.nickname || !su.email) return { ...s, signupError: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
      if (!su.password || su.password !== su.confirmPassword) return { ...s, signupError: 'รหัสผ่านไม่ตรงกัน' };
      const { skills, skillOptions } = resolveSkills(su.skills, su.skillOther, s.skillOptions);
      const name = [su.firstName, su.lastName].filter(Boolean).join(' ');
      notify('success', 'สมัครสมาชิกสำเร็จ');
      return { ...s, screen: 'dashboard', signupError: '', skillOptions, su: { ...su, skills, skillOther: '' }, currentUser: { name, firstName: su.nickname || su.firstName, studentId: su.studentId } };
    });
  };

  const onCg = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, cg: { ...s.cg, [field]: v } })); };

  const handleCreateGroup = () => {
    setState((s) => {
      const cg = s.cg;
      if (!cg.code || !cg.name || !cg.teacher) return { ...s, cgError: 'กรุณากรอกข้อมูลให้ครบถ้วน' };
      const letter = String.fromCharCode(65 + s.groupsData.length);
      const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const me = s.currentUser;
      const myName = me.name || 'สมชาย วิลิ';
      const myInitials = myName.trim().split(/\s+/).map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'ผู';
      const newGroup = {
        id: letter, letter, code: joinCode, subjectCode: cg.code, name: cg.name, teacher: 'อ.' + cg.teacher, subtitle: cg.name,
        memberCount: 1, taskCount: 0, tint: '#EFF6FF', accent: '#2563EB',
        members: [{ name: myName, studentId: me.studentId || '', initials: myInitials, tint: '#EFF6FF', accent: '#2563EB', isLeader: true, skills: [] }]
      };
      notify('success', 'สร้างกลุ่มสำเร็จ');
      return { ...s, groupsData: [...s.groupsData, newGroup], newGroupCode: joinCode, cgError: '', cg: { code: '', name: '', teacher: '' }, screen: 'groupCreated' };
    });
  };

  const onJoinDigit = (i) => (e) => {
    const v = e.target.value.slice(-1);
    setState((s) => { const d = [...s.joinDigits]; d[i] = v; return { ...s, joinDigits: d, joinError: '' }; });
  };

  const handleJoinGroup = () => {
    setState((s) => {
      const code = s.joinDigits.join('');
      if (code.length < 6) return { ...s, joinError: 'กรุณากรอกรหัสให้ครบ 6 หลัก' };
      const groupsData = s.groupsData;
      const group = groupsData.find((g) => g.code.toUpperCase() === code.toUpperCase());
      if (!group) return { ...s, joinError: 'ไม่พบรหัสทีมนี้ กรุณาตรวจสอบอีกครั้ง' };
      const me = s.currentUser;
      const myName = me.name || 'สมชาย วิลิ';
      const alreadyMember = group.members.some((m) => (me.studentId && m.studentId === me.studentId) || m.name === myName);
      let newGroupsData = groupsData;
      if (!alreadyMember) {
        const myInitials = myName.trim().split(/\s+/).map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'ผู';
        const newMember = { name: myName, studentId: me.studentId || '', initials: myInitials, tint: '#EFF6FF', accent: '#2563EB', skills: [] };
        newGroupsData = groupsData.map((g) => g.id === group.id ? { ...g, members: [...g.members, newMember], memberCount: g.members.length + 1 } : g);
      }
      notify('success', 'เข้าร่วมกลุ่มสำเร็จ');
      return { ...s, groupsData: newGroupsData, selectedGroupId: group.id, joinError: '', joinDigits: ['', '', '', '', '', ''], screen: 'teams' };
    });
  };

  const copyCode = () => {
    setState((s) => {
      if (navigator.clipboard) navigator.clipboard.writeText(s.newGroupCode).catch(() => {});
      return { ...s, copyLabel: 'คัดลอกแล้ว!' };
    });
    setTimeout(() => setState((s) => ({ ...s, copyLabel: 'คัดลอก' })), 1500);
  };

  const openGroup = (id) => () => setState((s) => ({ ...s, selectedGroupId: id, screen: 'teamDetail', teamTab: 'overview' }));
  const goTeamDetail = () => setState((s) => ({ ...s, screen: 'teamDetail', teamTab: 'overview' }));
  const goProjects = () => setState((s) => ({ ...s, screen: 'projects' }));
  const goJoinGroup = () => setState((s) => ({ ...s, screen: 'joinGroup', joinError: '', joinDigits: ['', '', '', '', '', ''] }));
  const openProjectTasks = (groupId) => () => setState((s) => ({ ...s, selectedGroupId: groupId, teamTab: 'tasks', screen: 'timeline' }));
  const setTeamTab = (tab) => () => setState((s) => ({ ...s, teamTab: tab, screen: tab === 'chat' ? 'chat' : (tab === 'tasks' ? 'timeline' : (tab === 'progress' ? 'progress' : 'teamDetail')) }));

  const getEvalEntry = (groupCode, studentId, s) => {
    const key = groupCode + '|' + studentId;
    return s.evaluations[key] || { ratings: {}, note: '' };
  };

  const setEvalRating = (groupCode, studentId, criterion, value) => () => {
    const key = groupCode + '|' + studentId;
    setState((s) => {
      const entry = s.evaluations[key] || { ratings: {}, note: '' };
      return { ...s, evaluations: { ...s.evaluations, [key]: { ...entry, ratings: { ...entry.ratings, [criterion]: value } } } };
    });
  };

  const setEvalNote = (groupCode, studentId) => (e) => {
    const v = e.target.value;
    const key = groupCode + '|' + studentId;
    setState((s) => {
      const entry = s.evaluations[key] || { ratings: {}, note: '' };
      return { ...s, evaluations: { ...s.evaluations, [key]: { ...entry, note: v } } };
    });
  };

  const setLeaderboardPeriod = (p) => () => setState((s) => ({ ...s, leaderboardPeriod: p }));

  const saveEvaluation = () => {
    setState((s) => ({ ...s, saveEvaluationLabel: 'บันทึกแล้ว ✓' }));
    notify('success', 'บันทึกการประเมินแล้ว');
    setTimeout(() => setState((s) => ({ ...s, saveEvaluationLabel: 'บันทึกการประเมิน' })), 1600);
  };

  const exportEvaluation = () => {
    setState((s) => {
      const group = s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
      const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const rowsHtml = group.members.map((m) => {
        const entry = getEvalEntry(group.code, m.studentId, s);
        const scores = evalCriteriaListScores(entry);
        const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
        const scoreCells = scores.map((sc) => '<td style="text-align:center;padding:8px;border:1px solid #ddd;">' + (sc || '-') + '</td>').join('');
        return '<tr><td style="padding:8px;border:1px solid #ddd;">' + esc(m.name) + '</td><td style="padding:8px;border:1px solid #ddd;">' + esc(m.studentId) + '</td>' + scoreCells +
          '<td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:700;">' + avg + '</td>' +
          '<td style="padding:8px;border:1px solid #ddd;">' + esc(entry.note || '-') + '</td></tr>';
      }).join('');
      const criteriaHeaders = evalCriteriaHeaders(esc);
      const scriptOpen = '<' + 'script>';
      const scriptClose = '<' + '/script>';
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ผลประเมิน ' + esc(group.code) + '</title>' +
        '<style>body{font-family:"Segoe UI",Tahoma,sans-serif;padding:32px;color:#111827;}h1{font-size:20px;margin-bottom:4px;}p{font-size:13px;color:#555;margin-bottom:20px;}table{border-collapse:collapse;width:100%;font-size:12.5px;}th{padding:8px;border:1px solid #ddd;background:#f3f4f6;text-align:left;}</style>' +
        '</head><body>' +
        '<h1>ผลการประเมินสมาชิกในทีม ' + esc(group.letter) + ' — ' + esc(group.name) + '</h1>' +
        '<p>รหัสวิชา ' + esc(group.subjectCode) + ' · อาจารย์ผู้สอน ' + esc(group.teacher) + ' · คะแนนเต็มข้อละ 5 · ไม่ระบุตัวตนผู้ประเมิน</p>' +
        '<table><thead><tr><th>ชื่อสมาชิก</th><th>รหัสนิสิต</th>' + criteriaHeaders + '<th>คะแนนเฉลี่ย</th><th>ความคิดเห็นเกี่ยวกับการทำงาน</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
        scriptOpen + 'window.onload = function(){ window.print(); };' + scriptClose +
        '</body></html>';
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      notify('success', 'เปิดหน้าต่างสำหรับส่งออก PDF แล้ว');
      return s;
    });
  };

  const onChatInputChange = (e) => { const v = e.target.value; setState((s) => ({ ...s, chatInput: v })); };
  const onChatKeyDown = (e) => { if (e.key === 'Enter') sendChat(); };
  const sendChat = () => {
    setState((s) => {
      const text = s.chatInput.trim();
      if (!text) return s;
      const group = s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
      const code = group.code;
      const list = s.chatByGroup[code] || [];
      const now = new Date();
      const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const updated = [...list, { id: Date.now(), author: s.currentUser.name || 'ฉัน', text, mine: true, time }];
      notify('info', 'ส่งข้อความแล้ว');
      return { ...s, chatByGroup: { ...s.chatByGroup, [code]: updated }, chatInput: '' };
    });
  };

  const openTaskModal = (column) => () => setState((s) => {
    const group = s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
    return { ...s, taskModalOpen: true, taskModalColumn: column, taskModalGroupId: group.id, taskForm: { title: '', description: '', assigneeIdx: 0, dueDate: '' } };
  });
  const closeTaskModal = () => setState((s) => ({ ...s, taskModalOpen: false }));
  const onTaskFormField = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, taskForm: { ...s.taskForm, [field]: v } })); };

  const submitTaskModal = () => {
    setState((s) => {
      const group = s.groupsData.find((g) => g.id === s.taskModalGroupId) || s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
      if (!s.taskForm.title.trim()) return s;
      const isTimeline = s.taskModalColumn === 'timeline';
      const assignee = isTimeline ? (group.members[Number(s.taskForm.assigneeIdx)] || group.members[0]) : null;
      const newTask = {
        id: Date.now(),
        groupId: group.id,
        title: s.taskForm.title,
        description: s.taskForm.description,
        assignedTo: assignee ? assignee.name : null,
        dueDate: isTimeline ? s.taskForm.dueDate : new Date().toISOString().slice(0, 10),
        status: isTimeline ? 'pending' : s.taskModalColumn,
        attachments: []
      };
      notify('success', isTimeline ? ('มอบหมายงานให้ ' + assignee.name + ' แล้ว') : 'เพิ่มงานลงบอร์ดแล้ว');
      return { ...s, tasks: [...s.tasks, newTask], taskModalOpen: false };
    });
  };

  const openTask = (id) => () => setState((s) => ({ ...s, selectedAssignmentId: id, screen: 'progress' }));
  const openAssignmentDetail = (id) => () => setState((s) => ({ ...s, selectedAssignmentId: id, submissions: [], submitNote: '', submitButtonLabel: 'ส่งงาน', screen: 'assignmentDetail' }));

  const setAssignmentFilter = (f) => () => setState((s) => ({ ...s, assignmentFilter: f }));
  const setAssignmentView = (v) => () => setState((s) => ({ ...s, assignmentView: v }));

  const addAssignment = () => {
    setState((s) => {
      const group = s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
      const title = window.prompt('ชื่อ Assignment ใหม่:');
      if (!title) return s;
      const dueDate = window.prompt('วันที่กำหนดส่ง (YYYY-MM-DD):', '') || '';
      const newTask = { id: Date.now(), groupId: group.id, title, description: '', assignedTo: null, dueDate, status: 'pending', attachments: [] };
      notify('success', 'เพิ่ม Assignment แล้ว');
      return { ...s, tasks: [...s.tasks, newTask] };
    });
  };

  const addCalendarEvent = () => {
    setState((s) => {
      const title = window.prompt('ชื่อกิจกรรมใหม่:');
      if (!title) return s;
      const date = window.prompt('วันที่ (เช่น 22 มี.ค.):', '') || '';
      const time = window.prompt('เวลา (เช่น 14:00–15:00):', '') || '';
      const group = s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
      notify('success', 'เพิ่มกิจกรรมแล้ว');
      return { ...s, calendarEvents: [...s.calendarEvents, { title, date, time, group: 'ทีม ' + group.letter, color: '#2563EB' }] };
    });
  };

  const simulateUpload = () => {
    setState((s) => {
      const names = ['dashboard_v1.fig', 'final-submission.pdf', 'report.docx'];
      const name = names[s.submissions.length % names.length];
      return { ...s, submissions: [...s.submissions, { id: Date.now(), name }] };
    });
  };
  const removeSubmission = (id) => () => setState((s) => ({ ...s, submissions: s.submissions.filter((x) => x.id !== id) }));
  const onSubmitNoteChange = (e) => { const v = e.target.value; setState((s) => ({ ...s, submitNote: v })); };
  const handleSubmitAssignment = () => {
    setState((s) => ({ ...s, submitButtonLabel: 'ส่งงานแล้ว ✓' }));
    notify('success', 'ส่งงานสำเร็จ');
  };

  const prevMonth = () => setState((s) => { let m = s.calMonth - 1, y = s.calYear; if (m < 0) { m = 11; y--; } return { ...s, calMonth: m, calYear: y }; });
  const nextMonth = () => setState((s) => { let m = s.calMonth + 1, y = s.calYear; if (m > 11) { m = 0; y++; } return { ...s, calMonth: m, calYear: y }; });

  const onSettingsProfile = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, settingsProfile: { ...s.settingsProfile, [field]: v } })); };
  const onSettingsSkillOther = (e) => { const v = e.target.value; setState((s) => ({ ...s, settingsProfile: { ...s.settingsProfile, skillOther: v } })); };
  const toggleSettingsSkill = (skill) => () => setState((s) => {
    const has = s.settingsProfile.skills.includes(skill);
    return { ...s, settingsProfile: { ...s.settingsProfile, skills: has ? s.settingsProfile.skills.filter((x) => x !== skill) : [...s.settingsProfile.skills, skill] } };
  });
  const toggleNotif = (key) => () => setState((s) => ({ ...s, notifSettings: { ...s.notifSettings, [key]: !s.notifSettings[key] } }));
  const saveSettings = () => {
    setState((s) => {
      const { skills, skillOptions } = resolveSkills(s.settingsProfile.skills, s.settingsProfile.skillOther, s.skillOptions);
      return { ...s, skillOptions, settingsProfile: { ...s.settingsProfile, skills, skillOther: '' }, saveSettingsLabel: 'บันทึกแล้ว ✓' };
    });
    setTimeout(() => setState((s) => ({ ...s, saveSettingsLabel: 'บันทึกการตั้งค่า' })), 1600);
    notify('success', 'บันทึกการตั้งค่าแล้ว');
  };

  const setAdminFilter = (f) => () => setState((s) => ({ ...s, adminFilter: f }));
  const setAdminTab = (t) => () => setState((s) => ({ ...s, adminTab: t }));
  const onAdminProfile = (field) => (e) => {
    const v = e.target.value;
    setState((s) => ({
      ...s,
      adminProfile: { ...s.adminProfile, [field]: v },
      currentUser: field === 'name' ? { ...s.currentUser, name: v, firstName: v.split(' ')[0] || v } : s.currentUser
    }));
  };
  const handleLogout = () => setState((s) => ({
    ...s, screen: 'login', isAdminMode: false, loginEmail: '', loginPassword: '', loginError: '',
    currentUser: { name: '', firstName: '' }
  }));
  const onPolicy = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, policy: { ...s.policy, [field]: v } })); };
  const toggleAdminNotif = (key) => () => setState((s) => ({ ...s, adminNotif: { ...s.adminNotif, [key]: !s.adminNotif[key] } }));
  const toggleAdminUserRole = (idx) => () => setState((s) => ({
    ...s, adminUsersList: s.adminUsersList.map((u, i) => i === idx ? { ...u, role: u.role === 'full' ? 'viewer' : 'full' } : u)
  }));
  const addAdminUser = () => setState((s) => ({ ...s, adminUsersList: [...s.adminUsersList, { name: 'ผู้ดูแลใหม่', email: 'new.admin@teammate.com', role: 'viewer' }] }));
  const saveAdminSettings = () => {
    setState((s) => ({ ...s, saveAdminSettingsLabel: 'บันทึกแล้ว ✓' }));
    setTimeout(() => setState((s) => ({ ...s, saveAdminSettingsLabel: 'บันทึกการตั้งค่า' })), 1600);
    notify('success', 'บันทึกการตั้งค่าแล้ว');
  };
  const resolveModeration = (id, status) => () => {
    setState((s) => ({ ...s, moderationQueue: s.moderationQueue.map((m) => m.id === id ? { ...m, status } : m) }));
    notify(status === 'approved' ? 'success' : 'error', status === 'approved' ? 'อนุมัติรายการแล้ว' : 'ปฏิเสธรายการแล้ว');
  };

  const goSettings = () => setState((s) => ({ ...s, screen: s.isAdminMode ? 'adminSettings' : 'settings' }));

  const actions = {
    notify, dismissToast, stopPropagation, go, goSettings,
    onLoginEmailChange, onLoginPasswordChange, toggleLoginPw, handleLogin,
    onSu, onSuSkillOther, toggleGender, toggleSkill, handleSignup,
    onCg, handleCreateGroup, onJoinDigit, handleJoinGroup, copyCode,
    openGroup, goTeamDetail, goProjects, goJoinGroup, openProjectTasks, setTeamTab,
    getEvalEntry, setEvalRating, setEvalNote, setLeaderboardPeriod,
    saveEvaluation, exportEvaluation,
    onChatInputChange, onChatKeyDown, sendChat,
    openTaskModal, closeTaskModal, onTaskFormField, submitTaskModal,
    openTask, openAssignmentDetail, setAssignmentFilter, setAssignmentView, addAssignment, addCalendarEvent,
    simulateUpload, removeSubmission, onSubmitNoteChange, handleSubmitAssignment,
    prevMonth, nextMonth,
    onSettingsProfile, onSettingsSkillOther, toggleSettingsSkill, toggleNotif, saveSettings,
    setAdminFilter, setAdminTab, onAdminProfile, handleLogout, onPolicy, toggleAdminNotif,
    toggleAdminUserRole, addAdminUser, saveAdminSettings, resolveModeration
  };

  return { state, actions };
}

function evalCriteriaListScores(entry) {
  const evalCriteriaList = ['ความรับผิดชอบ', 'คุณภาพงาน', 'การสื่อสาร', 'การตรงต่อเวลา', 'การทำงานร่วมกับทีม'];
  return evalCriteriaList.map((c) => entry.ratings[c] || 0);
}

function evalCriteriaHeaders(esc) {
  const evalCriteriaList = ['ความรับผิดชอบ', 'คุณภาพงาน', 'การสื่อสาร', 'การตรงต่อเวลา', 'การทำงานร่วมกับทีม'];
  return evalCriteriaList.map((c) => '<th style="padding:8px;border:1px solid #ddd;background:#f3f4f6;">' + esc(c) + '</th>').join('');
}
