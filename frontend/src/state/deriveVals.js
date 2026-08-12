import { skillOptionsList, evalCriteriaList, leaderboardData, assignmentDetails, errorLogsData, securityAlertsData, recentFiles, statusMeta } from '../data/seedData.js';

const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const weekdayLabels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function isLeaderOf(group, currentUser) {
  return group.members.some((m) => m.isLeader && (m.studentId === currentUser.studentId || m.name === currentUser.name));
}

export default function deriveVals(state, actions) {
  const s = state;
  const isLogin = s.screen === 'login';
  const isSignup = s.screen === 'signup';
  const showSidebar = !isLogin && !isSignup;
  const groupsData = s.groupsData;
  const selectedGroup = groupsData.find((g) => g.id === s.selectedGroupId) || groupsData[0];
  const selectedAssignment = {
    ...assignmentDetails[s.selectedAssignmentId],
    submissions: s.submissions.map((sub) => ({ ...sub, onRemove: actions.removeSubmission(sub.id) }))
  };

  const navMap = s.isAdminMode ? [
    { key: 'admin', label: 'คัดกรองการกระทำ', icon: '⚑' }
  ] : [
    { key: 'dashboard', label: 'แดชบอร์ด', icon: '⌂' },
    { key: 'teams', label: 'ทีม', icon: '▤' },
    { key: 'projects', label: 'โปรเจ็ก', icon: '≣' },
    { key: 'assignment', label: 'งานที่มอบหมาย', icon: '☑' },
    { key: 'calendar', label: 'ปฏิทิน', icon: '▦' },
    { key: 'leaderboard', label: 'อันดับคะแนน', icon: '★' }
  ];
  const activeMap = { dashboard: 'dashboard', createGroup: 'dashboard', groupCreated: 'dashboard', teams: 'teams', teamDetail: 'teams', joinGroup: 'teams', projects: 'projects', timeline: 'projects', progress: 'projects', chat: 'teams', assignment: 'assignment', assignmentDetail: 'assignment', calendar: 'calendar', admin: 'admin', leaderboard: 'leaderboard' };

  const leaderboardPeriodDefs = [
    { key: 'all', label: 'ทั้งหมด' }, { key: 'monthly', label: 'รายเดือน' }, { key: 'weekly', label: 'รายสัปดาห์' }, { key: 'daily', label: 'รายวัน' }
  ];
  const leaderboardPeriods = leaderboardPeriodDefs.map((p) => ({
    label: p.label, onClick: actions.setLeaderboardPeriod(p.key),
    bg: s.leaderboardPeriod === p.key ? '#111827' : 'transparent', color: s.leaderboardPeriod === p.key ? '#fff' : '#6B7280'
  }));
  const leaderboardRanked = [...leaderboardData].sort((a, b) => b.points - a.points).map((p, i) => ({
    rank: i + 1, name: p.firstName + ' ' + p.lastName, studentId: p.studentId, points: p.points,
    tasksDone: p.tasksDone, team: p.team, tint: p.tint, accent: p.accent,
    initials: (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase(), isFirst: i === 0
  }));
  const leaderboardPodium = leaderboardRanked.slice(0, 3).map((row) => ({ ...row, border: row.isFirst ? '1.5px solid #2563EB' : '1px solid #F3F4F6' }));
  const leaderboardRest = leaderboardRanked.slice(3);

  const activeKey = activeMap[s.screen] || '';
  const navItems = navMap.map((n) => ({
    ...n, active: n.key === activeKey,
    iconColor: n.key === activeKey ? '#2563EB' : '#6B7280',
    textColor: n.key === activeKey ? '#2563EB' : '#374151',
    onClick: n.key === 'projects' ? actions.goProjects : actions.go(n.key === 'dashboard' ? 'dashboard' : n.key)
  }));

  const genderOptions = ['ชาย', 'หญิง', 'ไม่ระบุ'].map((label) => ({
    label, onClick: actions.toggleGender(label),
    bg: s.su.gender === label ? '#2563EB' : '#F3F4F6', color: s.su.gender === label ? '#fff' : '#6B7280'
  }));
  const skillOptions = skillOptionsList.map((label) => ({
    label, onClick: actions.toggleSkill(label),
    bg: s.su.skills.includes(label) ? '#2563EB' : '#F3F4F6', color: s.su.skills.includes(label) ? '#fff' : '#6B7280'
  }));

  const joinDigits = s.joinDigits.map((val, i) => ({ val, onChange: actions.onJoinDigit(i) }));
  const groups = groupsData.map((g) => ({ ...g, onOpen: actions.openGroup(g.id) }));

  const teamTabDefs = [
    { key: 'overview', label: 'ภาพรวม' }, { key: 'board', label: 'บอร์ด' }, { key: 'tasks', label: 'งาน' }, { key: 'chat', label: 'แชท' }, { key: 'progress', label: 'ความคืบหน้า' }, { key: 'evaluation', label: 'ประเมิน' }
  ];
  const teamTabs = teamTabDefs.map((t) => ({
    label: t.label, onClick: actions.setTeamTab(t.key),
    bg: s.teamTab === t.key ? '#2563EB' : 'transparent', color: s.teamTab === t.key ? '#fff' : '#6B7280'
  }));

  const evaluationMembers = selectedGroup.members.map((m) => {
    const entry = actions.getEvalEntry(selectedGroup.code, m.studentId, s);
    const criteria = evalCriteriaList.map((c) => {
      const rating = entry.ratings[c] || 0;
      const stars = [1, 2, 3, 4, 5].map((n) => ({
        n, onClick: actions.setEvalRating(selectedGroup.code, m.studentId, c, n),
        bg: n === rating ? '#2563EB' : '#F3F4F6', color: n === rating ? '#fff' : '#6B7280'
      }));
      return { label: c, stars };
    });
    return { ...m, criteria, note: entry.note, onNoteChange: actions.setEvalNote(selectedGroup.code, m.studentId) };
  });
  const evaluationComplete = selectedGroup.members.every((m) => {
    const entry = actions.getEvalEntry(selectedGroup.code, m.studentId, s);
    return evalCriteriaList.every((c) => !!entry.ratings[c]);
  });

  const timelineTasks = s.tasks.map((t) => {
    const meta = statusMeta(t.status);
    return { ...t, statusLabel: meta.label, statusBg: meta.bg, statusColor: meta.color, onOpen: actions.openTask(t.id) };
  });
  const overallProgress = Math.round(s.tasks.reduce((a, t) => a + t.percent, 0) / s.tasks.length);

  const rawMessages = s.chatByGroup[selectedGroup.code] || [];
  const chatMessages = rawMessages.map((m) => ({
    ...m, align: m.mine ? 'flex-end' : 'flex-start', rowDir: m.mine ? 'row-reverse' : 'row',
    bubbleBg: m.mine ? '#2563EB' : '#F3F4F6', bubbleColor: m.mine ? '#fff' : '#111827'
  }));

  const assignmentFilterDefs = [
    { key: 'all', label: 'ทั้งหมด' }, { key: 'todo', label: 'ยังไม่ส่ง' }, { key: 'inprogress', label: 'กำลังดำเนินการ' },
    { key: 'done', label: 'ส่งแล้ว' }, { key: 'overdue', label: 'เลยกำหนด' }
  ];
  const assignmentFilters = assignmentFilterDefs.map((f) => ({
    label: f.label, onClick: actions.setAssignmentFilter(f.key),
    bg: s.assignmentFilter === f.key ? '#2563EB' : '#fff', color: s.assignmentFilter === f.key ? '#fff' : '#6B7280'
  }));

  const assignmentGroups = s.assignmentItems.map((t) => ({ dateLabel: t.dateLabel, task: { ...t, onOpen: actions.openAssignmentDetail(t.id) } }));

  const kanbanColumnDefs = [
    { key: 'todo', label: 'To Do', color: '#6B7280' },
    { key: 'inprogress', label: 'In Progress', color: '#F59E0B' },
    { key: 'done', label: 'Done', color: '#16A34A' }
  ];
  const kanbanColumns = kanbanColumnDefs.map((c) => ({ ...c, count: s.kanbanTasks[c.key].length, tasks: s.kanbanTasks[c.key] }));

  const listViewBg = s.assignmentView === 'list' ? '#fff' : 'transparent';
  const listViewColor = s.assignmentView === 'list' ? '#2563EB' : '#6B7280';
  const kanbanViewBg = s.assignmentView === 'kanban' ? '#fff' : 'transparent';
  const kanbanViewColor = s.assignmentView === 'kanban' ? '#2563EB' : '#6B7280';

  const calendarLabel = monthNames[s.calMonth] + ' ' + s.calYear;
  const firstDay = new Date(s.calYear, s.calMonth, 1).getDay();
  const daysInMonth = new Date(s.calYear, s.calMonth + 1, 0).getDate();
  const eventDays = { 9: '#2563EB', 12: '#16A34A', 18: '#DC2626', 25: '#8B5CF6' };
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push({ day: '', bg: 'transparent', textColor: '#000', hasEvent: false, eventColor: '' });
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === 9;
    calendarCells.push({ day: d, bg: isToday ? '#EFF6FF' : '#F9FAFB', textColor: isToday ? '#2563EB' : '#374151', hasEvent: !!eventDays[d], eventColor: eventDays[d] || '' });
  }

  const upcomingEvents = s.calendarEvents;
  const isCurrentUserLeaderAny = groupsData.some((g) => isLeaderOf(g, s.currentUser));

  const notificationDefs = [
    { key: 'newTask', label: 'งานใหม่', desc: 'รับการแจ้งเตือนเมื่อมีงานใหม่' },
    { key: 'chatMsg', label: 'ข้อความในแชท', desc: 'รับการแจ้งเตือนเมื่อมีข้อความใหม่' },
    { key: 'deadline', label: 'กำหนดส่งใกล้ถึง', desc: 'แจ้งเตือนก่อนถึงกำหนดส่งงาน 24 ชั่วโมง' },
    { key: 'deadlineReminder', label: 'การประเมิน', desc: 'แจ้งเตือนเมื่อมีการประเมินผลงาน' }
  ];
  const notificationToggles = notificationDefs.map((n) => ({
    label: n.label, desc: n.desc, onToggle: actions.toggleNotif(n.key),
    bg: s.notifSettings[n.key] ? '#2563EB' : '#D8E1EC', knobLeft: s.notifSettings[n.key] ? '21px' : '3px'
  }));

  const pendingQueue = s.moderationQueue.filter((m) => m.status === 'pending');
  const moderationItems = pendingQueue.map((m) => ({ ...m, onApprove: actions.resolveModeration(m.id, 'approved'), onReject: actions.resolveModeration(m.id, 'rejected') }));
  const adminStats = [
    { label: 'รอตรวจสอบ', value: pendingQueue.length, color: '#D97706' },
    { label: 'ข้อผิดพลาดระบบ', value: errorLogsData.length, color: '#DC2626' },
    { label: 'แจ้งเตือนความปลอดภัย', value: securityAlertsData.length, color: '#8B5CF6' }
  ];
  const adminTabDefs = [
    { key: 'moderation', label: 'รายงาน' }, { key: 'errors', label: 'ข้อผิดพลาดระบบ' }, { key: 'security', label: 'ความปลอดภัย' }
  ];
  const settingsActive = s.screen === 'settings' || s.screen === 'adminSettings';
  const adminTabs = adminTabDefs.map((t) => ({
    label: t.label, onClick: actions.setAdminTab(t.key),
    bg: s.adminTab === t.key ? '#2563EB' : 'transparent', color: s.adminTab === t.key ? '#fff' : '#6B7280'
  }));
  const roleMeta = { full: { label: 'ผู้ดูแลเต็ม', bg: '#EFF6FF', color: '#2563EB' }, viewer: { label: 'ผู้ตรวจสอบอย่างเดียว', bg: '#F3F4F6', color: '#6B7280' } };
  const adminUsers = s.adminUsersList.map((u, i) => {
    const rm = roleMeta[u.role];
    return { ...u, roleLabel: rm.label, roleBg: rm.bg, roleColor: rm.color, onToggleRole: actions.toggleAdminUserRole(i) };
  });
  const adminNotifDefs = [
    { key: 'newPending', label: 'รายการรอตรวจสอบใหม่', desc: 'แจ้งเตือนเมื่อมีคำขอใหม่เข้าคิว' },
    { key: 'criticalError', label: 'ข้อผิดพลาดระดับ Critical', desc: 'แจ้งเตือนทันทีเมื่อพบ error ระดับวิกฤต' },
    { key: 'highSecurity', label: 'แจ้งเตือนความปลอดภัยระดับสูง', desc: 'แจ้งเตือนเมื่อพบความเสี่ยงด้านความปลอดภัยระดับสูง' }
  ];
  const adminNotifToggles = adminNotifDefs.map((n) => ({
    label: n.label, desc: n.desc, onToggle: actions.toggleAdminNotif(n.key),
    bg: s.adminNotif[n.key] ? '#2563EB' : '#D8E1EC', knobLeft: s.adminNotif[n.key] ? '21px' : '3px'
  }));

  const currentUserName = s.currentUser.name || 'สมชาย วิลิ';
  const currentUserInitials = currentUserName.trim().split(/\s+/).map((w) => w.charAt(0)).slice(0, 2).join('').toUpperCase() || 'ผู';
  const currentUserRoleLabel = s.isAdminMode ? 'ผู้ดูแลระบบ' : 'นักศึกษา';

  const hasTeam = groupsData.some((g) => g.members.some((m) => m.studentId === s.currentUser.studentId || m.name === s.currentUser.name));

  return {
    showSidebar, navItems, currentUserName, currentUserInitials, currentUserRoleLabel,
    goSettings: actions.goSettings, settingsIconColor: settingsActive ? '#2563EB' : '#6B7280', settingsTextColor: settingsActive ? '#2563EB' : '#374151', handleLogout: actions.handleLogout,
    toasts: s.toasts, dismissToast: actions.dismissToast,
    isLogin, loginEmail: s.loginEmail, loginPassword: s.loginPassword, loginError: s.loginError,
    loginPwType: s.loginShowPw ? 'text' : 'password', loginPwIcon: s.loginShowPw ? 'ซ่อน' : 'แสดง',
    onLoginEmailChange: actions.onLoginEmailChange, onLoginPasswordChange: actions.onLoginPasswordChange, toggleLoginPw: actions.toggleLoginPw,
    handleLogin: actions.handleLogin, goSignup: actions.go('signup'),
    isSignup, su: s.su, genderOptions, skillOptions, showSkillOtherInput: s.su.skills.includes('อื่น ๆ'), onSuSkillOther: actions.onSuSkillOther,
    signupError: s.signupError, handleSignup: actions.handleSignup, goLogin: actions.go('login'),
    onSuFirstName: actions.onSu('firstName'), onSuLastName: actions.onSu('lastName'), onSuNickname: actions.onSu('nickname'), onSuStudentId: actions.onSu('studentId'),
    onSuBirthdate: actions.onSu('birthdate'), onSuEmail: actions.onSu('email'), onSuPhone: actions.onSu('phone'), onSuPassword: actions.onSu('password'), onSuConfirmPassword: actions.onSu('confirmPassword'),
    isDashboard: s.screen === 'dashboard' && hasTeam,
    firstNameShort: s.currentUser.firstName || currentUserName.split(' ')[0],
    goCreateGroup: actions.go('createGroup'), joinDigits, joinError: s.joinError, handleJoinGroup: actions.handleJoinGroup,
    isCreateGroup: s.screen === 'createGroup', cg: s.cg, cgError: s.cgError, handleCreateGroup: actions.handleCreateGroup, goDashboard: actions.go('dashboard'),
    onCgCode: actions.onCg('code'), onCgName: actions.onCg('name'), onCgTeacher: actions.onCg('teacher'),
    isGroupCreated: s.screen === 'groupCreated', newGroupCode: s.newGroupCode, copyLabel: s.copyLabel, copyCode: actions.copyCode, goTeams: actions.go('teams'),
    dashStats: {
      teamCount: groupsData.length,
      pendingTasks: s.tasks.filter((t) => t.status !== 'done').length,
      points: (leaderboardData.find((p) => p.firstName === (s.currentUser.firstName || '')) || {}).points ?? 980
    },
    dashUpcomingTasks: timelineTasks.filter((t) => t.status !== 'done').slice(0, 4),
    dashNoUpcomingTasks: timelineTasks.filter((t) => t.status !== 'done').length === 0,
    isDashboardEmpty: s.screen === 'dashboard' && !hasTeam,
    isTeams: s.screen === 'teams', groups, isJoinGroup: s.screen === 'joinGroup', goJoinGroup: actions.goJoinGroup,
    isProjects: s.screen === 'projects',
    projectCards: groupsData.map((g) => {
      const groupTasks = s.tasks.filter((t) => t.groupCode === g.code);
      const done = groupTasks.filter((t) => t.status === 'done').length;
      const total = groupTasks.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { ...g, doneCount: done, totalCount: total, pct, onOpenTasks: actions.openProjectTasks(g.id) };
    }),
    isTeamDetail: s.screen === 'teamDetail', selectedGroup, teamTabs,
    teamTabOverview: s.teamTab === 'overview', teamTabTasks: s.teamTab === 'tasks', teamTabProgress: s.teamTab === 'progress', teamTabEvaluation: s.teamTab === 'evaluation', teamTabBoard: s.teamTab === 'board',
    teamBoardColumns: actions.getTeamBoardColumns(selectedGroup.id, s).map((col) => ({ ...col, count: col.tasks.length, onAddTask: actions.openTaskModal(col.key) })),
    isCurrentUserLeaderOfSelected: isLeaderOf(selectedGroup, s.currentUser),
    taskModalOpen: s.taskModalOpen, closeTaskModal: actions.closeTaskModal, submitTaskModal: actions.submitTaskModal, stopPropagation: actions.stopPropagation,
    taskForm: s.taskForm, onTaskFormTitle: actions.onTaskFormField('title'), onTaskFormDescription: actions.onTaskFormField('description'),
    onTaskFormAssignee: actions.onTaskFormField('assigneeIdx'), onTaskFormDueDate: actions.onTaskFormField('dueDate'),
    taskFormAssigneeOptions: (groupsData.find((g) => g.id === s.taskModalGroupId) || selectedGroup).members.map((m, i) => ({ value: i, label: m.name })),
    isTaskModalTimeline: s.taskModalColumn === 'timeline',
    evaluationMembers, exportEvaluation: actions.exportEvaluation, saveEvaluation: actions.saveEvaluation, saveEvaluationLabel: s.saveEvaluationLabel,
    evaluationComplete, exportBtnBg: evaluationComplete ? '#111827' : '#D1D5DB', exportBtnCursor: evaluationComplete ? 'pointer' : 'not-allowed',
    isTimeline: s.screen === 'timeline', timelineTasks, openAddTaskTimeline: actions.openTaskModal('timeline'), goTeamDetail: actions.goTeamDetail,
    isCurrentUserLeader: isLeaderOf(selectedGroup, { ...s.currentUser, name: currentUserName }),
    isProgress: s.screen === 'progress', overallProgress, recentFiles,
    isChat: s.screen === 'chat', chatMessages, chatInput: s.chatInput, onChatInputChange: actions.onChatInputChange, onChatKeyDown: actions.onChatKeyDown, sendChat: actions.sendChat,
    isAssignment: s.screen === 'assignment', assignmentIsList: s.assignmentView === 'list', assignmentIsKanban: s.assignmentView === 'kanban',
    listViewBg, listViewColor, kanbanViewBg, kanbanViewColor, assignmentFilters, assignmentGroups, kanbanColumns, goAssignment: actions.go('assignment'),
    addAssignment: actions.addAssignment, addCalendarEvent: actions.addCalendarEvent, isCurrentUserLeaderAny,
    setAssignmentViewList: actions.setAssignmentView('list'), setAssignmentViewKanban: actions.setAssignmentView('kanban'),
    isAssignmentDetail: s.screen === 'assignmentDetail', selectedAssignment, submitNote: s.submitNote, onSubmitNoteChange: actions.onSubmitNoteChange,
    simulateUpload: actions.simulateUpload, handleSubmitAssignment: actions.handleSubmitAssignment, submitButtonLabel: s.submitButtonLabel,
    isCalendar: s.screen === 'calendar', calendarLabel, weekdayLabels, calendarCells, upcomingEvents, prevMonth: actions.prevMonth, nextMonth: actions.nextMonth,
    isSettings: s.screen === 'settings', settingsProfile: s.settingsProfile, notificationToggles, saveSettingsLabel: s.saveSettingsLabel, saveSettings: actions.saveSettings,
    onSettingsFullName: actions.onSettingsProfile('fullName'), onSettingsNickname: actions.onSettingsProfile('nickname'), onSettingsEmail: actions.onSettingsProfile('email'),
    onSettingsPassword: actions.onSettingsProfile('password'),
    settingsSkillOptions: skillOptionsList.map((label) => ({
      label, onClick: actions.toggleSettingsSkill(label),
      bg: s.settingsProfile.skills.includes(label) ? '#2563EB' : '#F3F4F6', color: s.settingsProfile.skills.includes(label) ? '#fff' : '#6B7280'
    })),
    showSettingsSkillOtherInput: s.settingsProfile.skills.includes('อื่น ๆ'), onSettingsSkillOther: actions.onSettingsSkillOther,
    isLeaderboard: s.screen === 'leaderboard', leaderboardPeriods, leaderboardPodium, leaderboardRest,
    isAdmin: s.screen === 'admin', adminStats, adminTabs,
    adminTabModeration: s.adminTab === 'moderation', adminTabErrors: s.adminTab === 'errors', adminTabSecurity: s.adminTab === 'security',
    isAdminSettings: s.screen === 'adminSettings',
    hasModerationItems: moderationItems.length > 0, noModerationItems: moderationItems.length === 0, moderationItems,
    errorLogs: errorLogsData, securityAlerts: securityAlertsData,
    adminProfile: s.adminProfile, onAdminProfileName: actions.onAdminProfile('name'),
    adminUsers, addAdminUser: actions.addAdminUser,
    policy: s.policy, onPolicyBannedWords: actions.onPolicy('bannedWords'), onPolicyLogRetention: actions.onPolicy('logRetentionDays'),
    adminNotifToggles, saveAdminSettingsLabel: s.saveAdminSettingsLabel, saveAdminSettings: actions.saveAdminSettings
  };
}
