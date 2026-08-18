import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  initialGroupsData, initialTasks,
  initialCalendarEvents, initialAdminUsersList, initialModerationQueue
} from '../data/seedData.js';

const initialState = {
  screen: 'login',
  isAdminMode: false,
  loginEmail: '', loginPassword: '', loginShowPw: false,
  su: { firstName: '', lastName: '', nickname: '', studentId: '', gender: '', birthdate: '', email: '', phone: '', skills: [], skillOther: '', password: '', confirmPassword: '' },
  joinDigits: ['', '', '', '', '', ''],
  newGroupCode: '',
  copyLabel: 'คัดลอก',
  selectedGroupId: 'A',
  teamTab: 'overview',
  teamId: null,
  selectedTaskId: null,
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
  notifSettings: { newTask: true, chatMsg: true, deadline: true, deadlineReminder: false },
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
  currentUser: { name: '', firstName: '', studentId: '', userId: null, avatarUrl: '' },
  moderationQueue: initialModerationQueue,
  groupsData: initialGroupsData
};

export default function useAppState() {
  const [state, setState] = useState(initialState);
  const evalCacheRef = useRef({});

  const notify = useCallback((type, msg) => {
    (toast[type] || toast.info)(msg);
  }, []);

  const stopPropagation = (e) => e.stopPropagation();

  const go = (screen) => () => setState((s) => ({ ...s, screen }));

  const onLoginEmailChange = (e) => setState((s) => ({ ...s, loginEmail: e.target.value }));
  const onLoginPasswordChange = (e) => setState((s) => ({ ...s, loginPassword: e.target.value }));
  const toggleLoginPw = () => setState((s) => ({ ...s, loginShowPw: !s.loginShowPw }));

  // actual authentication happens via /api/login directly in LoginScreen.jsx;
  // this just applies the resulting session to central state once that call succeeds
  const completeLogin = (currentUser, isAdminMode) => setState((s) => ({
    ...s, screen: isAdminMode ? 'admin' : 'dashboard', isAdminMode, currentUser
  }));

  const updateCurrentUser = (patch) => setState((s) => ({ ...s, currentUser: { ...s.currentUser, ...patch } }));

  const onSu = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, su: { ...s.su, [field]: v } })); };
  const onSuSkillOther = (e) => { const v = e.target.value; setState((s) => ({ ...s, su: { ...s.su, skillOther: v } })); };
  const toggleGender = (g) => () => setState((s) => ({ ...s, su: { ...s.su, gender: g } }));
  const toggleSkill = (skill) => () => setState((s) => {
    const has = s.su.skills.includes(skill);
    return { ...s, su: { ...s.su, skills: has ? s.su.skills.filter((x) => x !== skill) : [...s.su.skills, skill] } };
  });

  // registration itself is a real API call made directly in SignupScreen.jsx;
  // this just clears the form after a successful signup
  const resetSu = () => setState((s) => ({
    ...s, su: { firstName: '', lastName: '', nickname: '', studentId: '', gender: '', birthdate: '', email: '', phone: '', skills: [], skillOther: '', password: '', confirmPassword: '' }
  }));

  // actual creation happens via /api/group/create directly in CreateGroupScreen.jsx;
  // this just applies the result to central state once that call succeeds
  const onGroupCreated = (groupCode) => setState((s) => ({ ...s, newGroupCode: groupCode, screen: 'groupCreated' }));

  const onJoinDigit = (i) => (e) => {
    const v = e.target.value.slice(-1);
    setState((s) => { const d = [...s.joinDigits]; d[i] = v; return { ...s, joinDigits: d }; });
  };

  // actual join happens via /api/group/join directly in JoinGroupScreen.jsx / DashboardEmptyScreen.jsx;
  // this just applies the result to central state once that call succeeds
  const onGroupJoined = () => setState((s) => ({ ...s, joinDigits: ['', '', '', '', '', ''], screen: 'teams' }));

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
  const goJoinGroup = () => setState((s) => ({ ...s, screen: 'joinGroup', joinDigits: ['', '', '', '', '', ''] }));
  const openProjectTasks = (groupId) => () => setState((s) => ({ ...s, selectedGroupId: groupId, teamTab: 'tasks', screen: 'timeline' }));

  // TeamDetailScreen is the sole consumer of setTeamTab (real teams only, wired to real APIs).
  // Evaluation is rendered inline as a placeholder instead of navigating.
  const setTeamTab = (tab) => () => {
    const screen = tab === 'tasks' ? 'teamTasks' : tab === 'progress' ? 'teamProgress' : tab === 'chat' ? 'teamChat' : 'teamDetail';
    setState((s) => ({ ...s, teamTab: tab, screen }));
  };

  // real team navigation (Phase 1) - fully separate from the mock selectedGroupId/groupsData system above
  const openTeam = (groupId) => () => setState((s) => ({ ...s, teamId: groupId, teamTab: 'overview', screen: 'teamDetail' }));
  const goTeamTasks = () => setState((s) => ({ ...s, screen: 'teamTasks' }));
  const openTaskDetail = (taskId) => () => setState((s) => ({ ...s, selectedTaskId: taskId, screen: 'taskDetail' }));
  const backToTeamDetail = () => setState((s) => ({ ...s, screen: 'teamDetail', teamTab: 'overview' }));

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
    const group = state.groupsData.find((g) => g.id === state.selectedGroupId) || state.groupsData[0];
    const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const rowsHtml = group.members.map((m) => {
      const entry = getEvalEntry(group.code, m.studentId, state);
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
  };

  const onChatInputChange = (e) => { const v = e.target.value; setState((s) => ({ ...s, chatInput: v })); };
  const onChatKeyDown = (e) => { if (e.key === 'Enter') sendChat(); };
  const sendChat = () => {
    const text = state.chatInput.trim();
    if (!text) return;
    const group = state.groupsData.find((g) => g.id === state.selectedGroupId) || state.groupsData[0];
    const code = group.code;
    const list = state.chatByGroup[code] || [];
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const updated = [...list, { id: Date.now(), author: state.currentUser.name || 'ฉัน', text, mine: true, time }];
    setState((s) => ({ ...s, chatByGroup: { ...s.chatByGroup, [code]: updated }, chatInput: '' }));
    notify('info', 'ส่งข้อความแล้ว');
  };

  const openTaskModal = (column) => () => setState((s) => {
    const group = s.groupsData.find((g) => g.id === s.selectedGroupId) || s.groupsData[0];
    return { ...s, taskModalOpen: true, taskModalColumn: column, taskModalGroupId: group.id, taskForm: { title: '', description: '', assigneeIdx: 0, dueDate: '' } };
  });
  const closeTaskModal = () => setState((s) => ({ ...s, taskModalOpen: false }));
  const onTaskFormField = (field) => (e) => { const v = e.target.value; setState((s) => ({ ...s, taskForm: { ...s.taskForm, [field]: v } })); };

  const submitTaskModal = () => {
    const group = state.groupsData.find((g) => g.id === state.taskModalGroupId) || state.groupsData.find((g) => g.id === state.selectedGroupId) || state.groupsData[0];
    if (!state.taskForm.title.trim()) return;
    const isTimeline = state.taskModalColumn === 'timeline';
    const assignee = isTimeline ? (group.members[Number(state.taskForm.assigneeIdx)] || group.members[0]) : null;
    const newTask = {
      id: Date.now(),
      groupId: group.id,
      title: state.taskForm.title,
      description: state.taskForm.description,
      assignedTo: assignee ? assignee.name : null,
      dueDate: isTimeline ? state.taskForm.dueDate : new Date().toISOString().slice(0, 10),
      status: isTimeline ? 'pending' : state.taskModalColumn,
      attachments: []
    };
    setState((s) => ({ ...s, tasks: [...s.tasks, newTask], taskModalOpen: false }));
    notify('success', isTimeline ? ('มอบหมายงานให้ ' + assignee.name + ' แล้ว') : 'เพิ่มงานลงบอร์ดแล้ว');
  };

  const openTask = (id) => () => setState((s) => ({ ...s, selectedAssignmentId: id, screen: 'progress' }));
  const openAssignmentDetail = (id) => () => setState((s) => ({ ...s, selectedAssignmentId: id, submissions: [], submitNote: '', submitButtonLabel: 'ส่งงาน', screen: 'assignmentDetail' }));

  const setAssignmentFilter = (f) => () => setState((s) => ({ ...s, assignmentFilter: f }));
  const setAssignmentView = (v) => () => setState((s) => ({ ...s, assignmentView: v }));

  const addAssignment = () => {
    const group = state.groupsData.find((g) => g.id === state.selectedGroupId) || state.groupsData[0];
    const title = window.prompt('ชื่อ Assignment ใหม่:');
    if (!title) return;
    const dueDate = window.prompt('วันที่กำหนดส่ง (YYYY-MM-DD):', '') || '';
    const newTask = { id: Date.now(), groupId: group.id, title, description: '', assignedTo: null, dueDate, status: 'pending', attachments: [] };
    setState((s) => ({ ...s, tasks: [...s.tasks, newTask] }));
    notify('success', 'เพิ่ม Assignment แล้ว');
  };

  const addCalendarEvent = () => {
    const title = window.prompt('ชื่อกิจกรรมใหม่:');
    if (!title) return;
    const date = window.prompt('วันที่ (เช่น 22 มี.ค.):', '') || '';
    const time = window.prompt('เวลา (เช่น 14:00–15:00):', '') || '';
    const group = state.groupsData.find((g) => g.id === state.selectedGroupId) || state.groupsData[0];
    setState((s) => ({ ...s, calendarEvents: [...s.calendarEvents, { title, date, time, group: 'ทีม ' + group.letter, color: '#2563EB' }] }));
    notify('success', 'เพิ่มกิจกรรมแล้ว');
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

  const toggleNotif = (key) => () => setState((s) => ({ ...s, notifSettings: { ...s.notifSettings, [key]: !s.notifSettings[key] } }));

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
  const handleLogout = () => {
    localStorage.removeItem('token');
    setState((s) => ({
      ...s, screen: 'login', isAdminMode: false, loginEmail: '', loginPassword: '',
      currentUser: { name: '', firstName: '' }
    }));
  };
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
    notify, stopPropagation, go, goSettings,
    onLoginEmailChange, onLoginPasswordChange, toggleLoginPw, completeLogin, updateCurrentUser,
    onSu, onSuSkillOther, toggleGender, toggleSkill, resetSu,
    onGroupCreated, onJoinDigit, onGroupJoined, copyCode,
    openGroup, goTeamDetail, goProjects, goJoinGroup, openProjectTasks, setTeamTab,
    openTeam, goTeamTasks, openTaskDetail, backToTeamDetail,
    getEvalEntry, setEvalRating, setEvalNote, setLeaderboardPeriod,
    saveEvaluation, exportEvaluation,
    onChatInputChange, onChatKeyDown, sendChat,
    openTaskModal, closeTaskModal, onTaskFormField, submitTaskModal,
    openTask, openAssignmentDetail, setAssignmentFilter, setAssignmentView, addAssignment, addCalendarEvent,
    simulateUpload, removeSubmission, onSubmitNoteChange, handleSubmitAssignment,
    prevMonth, nextMonth,
    toggleNotif,
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
