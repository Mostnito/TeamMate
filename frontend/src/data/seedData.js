export const ADMIN_EMAIL = 'admin@teammate.com';
export const LEADER_EMAIL = 'leader@teammate.com';

export const skillOptionsList = [
  'Frontend', 'Backend', 'UI/UX Design', 'Database', 'DevOps',
  'AI/ML', 'Presentation', 'Documentation', 'Testing', 'Project Management', 'อื่น ๆ'
];

export const evalCriteriaList = [
  'ความรับผิดชอบ', 'คุณภาพงาน', 'การสื่อสาร', 'การตรงต่อเวลา', 'การทำงานร่วมกับทีม'
];

// board columns mirror the task_status enum subset used for kanban-style grouping
export const boardColumnDefs = [
  { key: 'pending', label: 'To Do', color: '#6B7280' },
  { key: 'in_progress', label: 'In Progress', color: '#F59E0B' },
  { key: 'completed', label: 'Done', color: '#16A34A' }
];

export const initialGroupsData = [
  {
    id: 'A', letter: 'A', code: '100001', subjectCode: '264991', name: 'Software Engineering', teacher: 'อ.สมศักดิ์ วิชาการ',
    subtitle: 'ทีมพัฒนาระบบจัดการ', memberCount: 5, taskCount: 5, tint: '#EFF6FF', accent: '#2563EB',
    members: [
      { name: 'สมชาย วิลิ', studentId: '6412001', initials: 'สว', tint: '#EFF6FF', accent: '#2563EB', isLeader: true, skills: [{ label: 'Frontend', bg: '#EFF6FF', color: '#2563EB' }, { label: 'UI/UX Design', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'สมหญิง ยินเลิศ', studentId: '6412002', initials: 'สย', tint: '#E8F8EE', accent: '#16A34A', skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }, { label: 'Database', bg: '#FEF3C7', color: '#D97706' }] },
      { name: 'ประเสริฐ นาคะ', studentId: '6412003', initials: 'ปน', tint: '#FEE2E2', accent: '#DC2626', skills: [{ label: 'Testing', bg: '#FEE2E2', color: '#DC2626' }, { label: 'Documentation', bg: '#F3F4F6', color: '#6B7280' }] },
      { name: 'วรเดช สถาพรกุล', studentId: '6412004', initials: 'วส', tint: '#FEF3C7', accent: '#D97706', skills: [{ label: 'AI/ML', bg: '#F3E8FD', color: '#8B5CF6' }, { label: 'Presentation', bg: '#FEF3C7', color: '#D97706' }] },
      { name: 'กิตติ พัฒนา', studentId: '6412005', initials: 'กพ', tint: '#E0F2FE', accent: '#0EA5E9', skills: [{ label: 'DevOps', bg: '#E0F2FE', color: '#0EA5E9' }, { label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] }
    ]
  },
  {
    id: 'B', letter: 'B', code: '100002', subjectCode: '264530', name: 'Web Development', teacher: 'อ.นภา ใจดี',
    subtitle: 'ทีมพัฒนา UX/UI และเว็บไซต์', memberCount: 3, taskCount: 5, tint: '#F3E8FD', accent: '#8B5CF6',
    members: [
      { name: 'กมล ศรีทอง', studentId: '6412010', initials: 'กศ', tint: '#F3E8FD', accent: '#8B5CF6', isLeader: true, skills: [{ label: 'UI/UX', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'แนน คิดดี', studentId: '6412011', initials: 'นค', tint: '#E0F2FE', accent: '#0EA5E9', skills: [{ label: 'Frontend', bg: '#EFF6FF', color: '#2563EB' }] },
      { name: 'บอส วิริยะ', studentId: '6412012', initials: 'บว', tint: '#E8F8EE', accent: '#16A34A', skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] }
    ]
  },
  {
    id: 'C', letter: 'C', code: '100003', subjectCode: '264610', name: 'AI Chatbot Development', teacher: 'อ.ชาตรี ไชยวงค์',
    subtitle: 'ทีมพัฒนา AI Chatbot', memberCount: 4, taskCount: 5, tint: '#FEF3C7', accent: '#D97706',
    members: [
      { name: 'พิมพ์มาดา สงศิริ', studentId: '6412020', initials: 'พส', tint: '#FEF3C7', accent: '#D97706', isLeader: true, skills: [{ label: 'AI/ML', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'ธีร์ พงศ์', studentId: '6412021', initials: 'ธพ', tint: '#FEE2E2', accent: '#DC2626', skills: [{ label: 'Database', bg: '#FEF3C7', color: '#D97706' }] },
      { name: 'ฝัน สิงห์', studentId: '6412022', initials: 'ฝส', tint: '#E0F2FE', accent: '#0EA5E9', skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] },
      { name: 'ปุ้ย อ่ำ', studentId: '6412023', initials: 'ปอ', tint: '#EFF6FF', accent: '#2563EB', skills: [{ label: 'Frontend', bg: '#EFF6FF', color: '#2563EB' }] }
    ]
  },
  {
    id: 'D', letter: 'D', code: '100004', subjectCode: '264720', name: 'Data Systems', teacher: 'อ.รุ่งนภา ทองสุข',
    subtitle: 'ทีมพัฒนาระบบข้อมูล', memberCount: 3, taskCount: 5, tint: '#E8F8EE', accent: '#16A34A',
    members: [
      { name: 'อรุณ ปิ่นเดช', studentId: '6412030', initials: 'อป', tint: '#E8F8EE', accent: '#16A34A', isLeader: true, skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] },
      { name: 'ธาดา ภาคิน', studentId: '6412031', initials: 'ธภ', tint: '#EFF6FF', accent: '#2563EB', skills: [{ label: 'UI/UX', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'ชวิน มาลี', studentId: '6412032', initials: 'ชม', tint: '#FEE2E2', accent: '#DC2626', skills: [{ label: 'Testing', bg: '#FEE2E2', color: '#DC2626' }] }
    ]
  }
];

export const leaderboardData = [
  { firstName: 'สมชาย', lastName: 'ว.', studentId: '6412001', points: 980, tasksDone: 14, team: 'ทีม A', tint: '#EAF3FC', accent: '#2563EB' },
  { firstName: 'พิมพ์มาดา', lastName: 'ส.', studentId: '6412020', points: 915, tasksDone: 13, team: 'ทีม C', tint: '#FEF3C7', accent: '#B45309' },
  { firstName: 'กมล', lastName: 'ศ.', studentId: '6412010', points: 870, tasksDone: 12, team: 'ทีม B', tint: '#F3E8FD', accent: '#8B5CF6' },
  { firstName: 'สมหญิง', lastName: 'ย.', studentId: '6412002', points: 840, tasksDone: 12, team: 'ทีม A', tint: '#E8F8EE', accent: '#16A34A' },
  { firstName: 'อรุณ', lastName: 'ป.', studentId: '6412030', points: 805, tasksDone: 11, team: 'ทีม D', tint: '#E8F8EE', accent: '#16A34A' },
  { firstName: 'ธีร์', lastName: 'พ.', studentId: '6412021', points: 760, tasksDone: 10, team: 'ทีม C', tint: '#FEE2E2', accent: '#DC2626' },
  { firstName: 'แนน', lastName: 'ค.', studentId: '6412011', points: 715, tasksDone: 9, team: 'ทีม B', tint: '#E0F2FE', accent: '#0EA5E9' },
  { firstName: 'วรเดช', lastName: 'ส.', studentId: '6412004', points: 690, tasksDone: 9, team: 'ทีม A', tint: '#FEF3C7', accent: '#B45309' },
  { firstName: 'ประเสริฐ', lastName: 'น.', studentId: '6412003', points: 640, tasksDone: 8, team: 'ทีม A', tint: '#FEE2E2', accent: '#DC2626' },
  { firstName: 'ชวิน', lastName: 'ม.', studentId: '6412032', points: 600, tasksDone: 7, team: 'ทีม D', tint: '#FEE2E2', accent: '#DC2626' }
];

export const errorLogsData = [
  { level: 'CRITICAL', levelBg: '#FEE2E2', levelColor: '#DC2626', message: "TypeError: Cannot read property 'members' of undefined", source: 'GroupDetailView.js:142', affectedUser: 'สมชาย วิลิ', time: '3 นาทีที่แล้ว' },
  { level: 'ERROR', levelBg: '#FEF3C7', levelColor: '#D97706', message: 'Failed to upload attachment — request timeout (504)', source: 'SubmissionUpload.js:58', affectedUser: 'สมหญิง ยินเลิศ', time: '18 นาทีที่แล้ว' },
  { level: 'ERROR', levelBg: '#FEF3C7', levelColor: '#D97706', message: 'WebSocket connection dropped in group chat channel', source: 'ChatSocket.js:21', affectedUser: 'ประเสริฐ นาคะ', time: '40 นาทีที่แล้ว' },
  { level: 'WARNING', levelBg: '#FFF7E0', levelColor: '#9A7B0A', message: 'Deprecated API endpoint /v1/tasks called', source: 'TaskService.js:9', affectedUser: 'ระบบ', time: '2 ชั่วโมงที่แล้ว' }
];

export const securityAlertsData = [
  { severityLabel: 'สูง', severityBg: '#FEE2E2', severityColor: '#DC2626', title: 'พยายามเข้าสู่ระบบล้มเหลวซ้ำหลายครั้ง', detail: 'ตรวจพบความพยายามเข้าสู่ระบบผิด 8 ครั้งภายใน 2 นาทีในบัญชีเดียว', account: 'kritsada.p@student.ac.th', ip: '203.154.12.88', time: '8 นาทีที่แล้ว' },
  { severityLabel: 'ปานกลาง', severityBg: '#FEF3C7', severityColor: '#D97706', title: 'เข้าสู่ระบบจากอุปกรณ์ใหม่', detail: 'บัญชีเข้าสู่ระบบจากอุปกรณ์และตำแหน่งที่ไม่คุ้นเคย', account: 'somchai@example.com', ip: '171.7.44.10', time: '35 นาทีที่แล้ว' },
  { severityLabel: 'สูง', severityBg: '#FEE2E2', severityColor: '#DC2626', title: 'ไฟล์แนบต้องสงสัยว่ามีมัลแวร์', detail: 'ระบบสแกนไฟล์แนบ final-submission.pdf พบรูปแบบที่ตรงกับสัญญาณอันตราย', account: 'nan.k@student.ac.th', ip: '182.53.6.201', time: '1 ชั่วโมงที่แล้ว' }
];

// Unified task list — one shape for every screen (Timeline, Board, Assignment, Progress, Dashboard),
// matching the DB `tasks` table: groupId, title, description, assignedTo (null = whole-group assignment),
// dueDate, status (task_status enum), attachments (reference files from the assigner).
export const initialTasks = [
  { id: 1, groupId: 'A', title: 'กำหนดขอบเขตโปรเจกต์', description: '', assignedTo: 'สมชาย วิลิ', dueDate: '2026-01-20', status: 'completed', attachments: [] },
  { id: 2, groupId: 'A', title: 'ออกแบบ ER Diagram', description: '', assignedTo: 'สมหญิง ยินเลิศ', dueDate: '2026-01-25', status: 'completed', attachments: [] },
  { id: 3, groupId: 'A', title: 'สร้าง Wireframe หน้า Login', description: '', assignedTo: 'สมชาย วิลิ', dueDate: '2026-02-01', status: 'in_progress', attachments: [] },
  { id: 4, groupId: 'A', title: 'เขียน Test Cases', description: '', assignedTo: 'ประเสริฐ นาคะ', dueDate: '2026-01-28', status: 'in_progress', attachments: [] },
  { id: 5, groupId: 'A', title: 'อัพเกรดระบบ SRS', description: '', assignedTo: 'กิตติ พัฒนา', dueDate: '2026-01-20', status: 'overdue', attachments: [] },
  { id: 6, groupId: 'A', title: 'วิจัย Technology Stack', description: '', assignedTo: 'วรเดช สถาพรกุล', dueDate: '2026-02-10', status: 'pending', attachments: [] },
  { id: 7, groupId: 'A', title: 'ออกแบบ Database Schema', description: '', assignedTo: 'กิตติ พัฒนา', dueDate: '2026-02-05', status: 'pending', attachments: [] },
  {
    id: 8, groupId: 'A', title: 'ออกแบบ UI หน้า Dashboard',
    description: 'ออกแบบ UI หน้า Dashboard โดยใช้หลักการของ Design System ที่ทีมกำหนดไว้ ครอบคลุม responsive layout, สถานะข้อมูลว่าง และการแสดงผลบนอุปกรณ์เคลื่อนที่',
    assignedTo: null, dueDate: '2026-03-11', status: 'pending', attachments: [{ name: 'design-brief.pdf' }, { name: 'design-references.fig' }]
  },
  {
    id: 9, groupId: 'A', title: 'เขียน Unit Test สำหรับ Backend API',
    description: 'เขียน Unit Test ครอบคลุม endpoint หลักของระบบ ด้วย coverage ไม่น้อยกว่า 80%',
    assignedTo: null, dueDate: '2026-03-12', status: 'pending', attachments: [{ name: 'api-spec.pdf' }]
  },

  { id: 10, groupId: 'B', title: 'ออกแบบหน้า Landing Page', description: '', assignedTo: 'กมล ศรีทอง', dueDate: '2026-02-12', status: 'pending', attachments: [] },
  { id: 11, groupId: 'B', title: 'ทำ API เชื่อมต่อฐานข้อมูล', description: '', assignedTo: 'บอส วิริยะ', dueDate: '2026-02-08', status: 'in_progress', attachments: [] },
  {
    id: 12, groupId: 'B', title: 'ดีไซน์การ Software Requirements',
    description: 'จัดทำเอกสาร Software Requirements Specification ตามแนวทาง IEEE 830',
    assignedTo: null, dueDate: '2026-03-15', status: 'pending', attachments: [{ name: 'srs-template.docx' }]
  },
  {
    id: 13, groupId: 'B', title: 'ปรับแต่ง Progress โปรเจกต์ครั้งที่ 2',
    description: 'สรุปความคืบหน้าของโปรเจกต์ครั้งที่ 2 พร้อมอัปเดต timeline และปัญหาที่พบ',
    assignedTo: null, dueDate: '2026-03-20', status: 'pending', attachments: [{ name: 'progress-report-1.pdf' }]
  },

  { id: 14, groupId: 'C', title: 'สำรวจ LLM ที่ใช้ได้', description: '', assignedTo: 'ฝัน สิงห์', dueDate: '2026-01-28', status: 'completed', attachments: [] },
  { id: 15, groupId: 'C', title: 'เขียน Prompt Chatbot', description: '', assignedTo: 'ธีร์ พงศ์', dueDate: '2026-02-09', status: 'in_progress', attachments: [] },
  { id: 16, groupId: 'C', title: 'เก็บข้อมูลเทรนโมเดล', description: '', assignedTo: 'พิมพ์มาดา สงศิริ', dueDate: '2026-02-14', status: 'pending', attachments: [] },

  { id: 17, groupId: 'D', title: 'ตั้งค่าฐานข้อมูล', description: '', assignedTo: 'ธาดา ภาคิน', dueDate: '2026-01-25', status: 'completed', attachments: [] },
  { id: 18, groupId: 'D', title: 'ออกแบบ Data Pipeline', description: '', assignedTo: 'อรุณ ปิ่นเดช', dueDate: '2026-02-11', status: 'in_progress', attachments: [] }
];

export const initialCalendarEvents = [
  { title: 'ประชุมทีม A', date: '9 มี.ค.', time: '10:00–11:00', group: 'ทีม A · 4 คน', color: '#2563EB' },
  { title: 'Demo ไตรมาสที่ 1', date: '12 มี.ค.', time: '14:00–15:30', group: 'ทุกทีม', color: '#16A34A' },
  { title: 'ส่งงาน – งานเขียนรายงาน', date: '18 มี.ค.', time: '23:59', group: 'ทีม A · 4 คน', color: '#DC2626' },
  { title: 'Workshop UX Design', date: '19 มี.ค.', time: '13:00–16:00', group: 'ทีม B · 6 คน', color: '#8B5CF6' }
];

export const initialAdminUsersList = [
  { name: 'ผู้ดูแลระบบ', email: 'admin@teammate.com', role: 'full' },
  { name: 'นภา ใจดี', email: 'napa.admin@teammate.com', role: 'viewer' }
];

export const initialModerationQueue = [
  { id: 1, type: 'report', typeLabel: 'รายงานแชท', typeBg: '#FEE2E2', typeColor: '#DC2626', title: 'ข้อความถูกรายงานในกลุ่มแชท', detail: 'สมาชิกรายงานข้อความว่าไม่เหมาะสมในกลุ่ม 264991', requester: 'ประเสริฐ นาคะ', group: 'ทีม A', time: '1 ชั่วโมงที่แล้ว', status: 'pending' },
  { id: 2, type: 'report', typeLabel: 'รายงานผู้ใช้', typeBg: '#FEE2E2', typeColor: '#DC2626', title: 'สมาชิกถูกรายงานว่าไม่ให้ความร่วมมือในทีม', detail: 'หัวหน้ากลุ่มรายงานว่าสมาชิกไม่ตอบสนองและไม่ส่งงานตามกำหนด', requester: 'พิมพ์มาดา สงศิริ', group: 'ทีม C', time: '3 ชั่วโมงที่แล้ว', status: 'pending' },
  { id: 3, type: 'report', typeLabel: 'รายงานไฟล์', typeBg: '#FEE2E2', typeColor: '#DC2626', title: 'ไฟล์แนบถูกรายงานว่าไม่เหมาะสม', detail: 'สมาชิกรายงานไฟล์แนบในงาน "เขียน Unit Test สำหรับ Backend API" ว่ามีเนื้อหาไม่เกี่ยวข้อง', requester: 'สมหญิง ยินเลิศ', group: 'ทีม A', time: '5 ชั่วโมงที่แล้ว', status: 'pending' }
];

export const recentFiles = [
  { name: 'ER_Diagram_v2.pdf', meta: '2 นาทีที่แล้ว · 3 ไฟล์' },
  { name: 'Wireframe_Login.fig', meta: '1 ชั่วโมงที่แล้ว · 1 ไฟล์' },
  { name: 'SRS_Document.docx', meta: '1 วันที่แล้ว · 2 ไฟล์' },
  { name: 'TestCase_Sprint1.xlsx', meta: '2 วันที่แล้ว · 1 ไฟล์' }
];

// mirrors the task_status enum: pending, in_progress, completed, overdue, cancelled
export const statusMeta = (status) => {
  const map = {
    pending: { label: 'รอดำเนินการ', bg: '#F3F4F6', color: '#6B7280' },
    in_progress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
    completed: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
    overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' },
    cancelled: { label: 'ยกเลิก', bg: '#F3F4F6', color: '#9CA3AF' }
  };
  return map[status] || map.pending;
};
