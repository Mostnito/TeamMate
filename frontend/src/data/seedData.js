export const ADMIN_EMAIL = 'admin@teammate.com';
export const LEADER_EMAIL = 'leader@teammate.com';

export const skillOptionsList = [
  'Frontend', 'Backend', 'UI/UX Design', 'Database', 'DevOps',
  'AI/ML', 'Presentation', 'Documentation', 'Testing', 'Project Management', 'อื่น ๆ'
];

export const evalCriteriaList = [
  'ความรับผิดชอบ', 'คุณภาพงาน', 'การสื่อสาร', 'การตรงต่อเวลา', 'การทำงานร่วมกับทีม'
];

export const initialGroupsData = [
  {
    id: 'A', letter: 'A', code: '264991', name: 'Software Engineering', teacher: 'อ.สมศักดิ์ วิชาการ',
    subtitle: 'ทีมพัฒนาระบบจัดการ', memberCount: 5, maxMembers: 6, taskCount: 5, tint: '#EFF6FF', accent: '#2563EB',
    members: [
      { name: 'สมชาย วิลิ', studentId: '6412001', initials: 'สว', tint: '#EFF6FF', accent: '#2563EB', role: 'Frontend Dev', isLeader: true, skills: [{ label: 'Frontend', bg: '#EFF6FF', color: '#2563EB' }, { label: 'UI/UX Design', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'สมหญิง ยินเลิศ', studentId: '6412002', initials: 'สย', tint: '#E8F8EE', accent: '#16A34A', role: 'Backend Dev', skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }, { label: 'Database', bg: '#FEF3C7', color: '#D97706' }] },
      { name: 'ประเสริฐ นาคะ', studentId: '6412003', initials: 'ปน', tint: '#FEE2E2', accent: '#DC2626', role: 'Tester', skills: [{ label: 'Testing', bg: '#FEE2E2', color: '#DC2626' }, { label: 'Documentation', bg: '#F3F4F6', color: '#6B7280' }] },
      { name: 'วรเดช สถาพรกุล', studentId: '6412004', initials: 'วส', tint: '#FEF3C7', accent: '#D97706', role: 'Presenter', skills: [{ label: 'AI/ML', bg: '#F3E8FD', color: '#8B5CF6' }, { label: 'Presentation', bg: '#FEF3C7', color: '#D97706' }] },
      { name: 'กิตติ พัฒนา', studentId: '6412005', initials: 'กพ', tint: '#E0F2FE', accent: '#0EA5E9', role: 'DevOps', skills: [{ label: 'DevOps', bg: '#E0F2FE', color: '#0EA5E9' }, { label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] }
    ]
  },
  {
    id: 'B', letter: 'B', code: '264530', name: 'Web Development', teacher: 'อ.นภา ใจดี',
    subtitle: 'ทีมพัฒนา UX/UI และเว็บไซต์', memberCount: 3, maxMembers: 6, taskCount: 5, tint: '#F3E8FD', accent: '#8B5CF6',
    members: [
      { name: 'กมล ศรีทอง', studentId: '6412010', initials: 'กศ', tint: '#F3E8FD', accent: '#8B5CF6', role: 'UI Designer', isLeader: true, skills: [{ label: 'UI/UX', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'แนน คิดดี', studentId: '6412011', initials: 'นค', tint: '#E0F2FE', accent: '#0EA5E9', role: 'Frontend Dev', skills: [{ label: 'Frontend', bg: '#EFF6FF', color: '#2563EB' }] },
      { name: 'บอส วิริยะ', studentId: '6412012', initials: 'บว', tint: '#E8F8EE', accent: '#16A34A', role: 'Backend Dev', skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] }
    ]
  },
  {
    id: 'C', letter: 'C', code: '264610', name: 'AI Chatbot Development', teacher: 'อ.ชาตรี ไชยวงค์',
    subtitle: 'ทีมพัฒนา AI Chatbot', memberCount: 4, maxMembers: 6, taskCount: 5, tint: '#FEF3C7', accent: '#D97706',
    members: [
      { name: 'พิมพ์มาดา สงศิริ', studentId: '6412020', initials: 'พส', tint: '#FEF3C7', accent: '#D97706', role: 'ML Engineer', isLeader: true, skills: [{ label: 'AI/ML', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'ธีร์ พงศ์', studentId: '6412021', initials: 'ธพ', tint: '#FEE2E2', accent: '#DC2626', role: 'Data Engineer', skills: [{ label: 'Database', bg: '#FEF3C7', color: '#D97706' }] },
      { name: 'ฝัน สิงห์', studentId: '6412022', initials: 'ฝส', tint: '#E0F2FE', accent: '#0EA5E9', role: 'Backend Dev', skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] },
      { name: 'ปุ้ย อ่ำ', studentId: '6412023', initials: 'ปอ', tint: '#EFF6FF', accent: '#2563EB', role: 'Frontend Dev', skills: [{ label: 'Frontend', bg: '#EFF6FF', color: '#2563EB' }] }
    ]
  },
  {
    id: 'D', letter: 'D', code: '264720', name: 'Data Systems', teacher: 'อ.รุ่งนภา ทองสุข',
    subtitle: 'ทีมพัฒนาระบบข้อมูล', memberCount: 3, maxMembers: 6, taskCount: 5, tint: '#E8F8EE', accent: '#16A34A',
    members: [
      { name: 'อรุณ ปิ่นเดช', studentId: '6412030', initials: 'อป', tint: '#E8F8EE', accent: '#16A34A', role: 'Backend Dev', isLeader: true, skills: [{ label: 'Backend', bg: '#E8F8EE', color: '#16A34A' }] },
      { name: 'ธาดา ภาคิน', studentId: '6412031', initials: 'ธภ', tint: '#EFF6FF', accent: '#2563EB', role: 'Designer', skills: [{ label: 'UI/UX', bg: '#F3E8FD', color: '#8B5CF6' }] },
      { name: 'ชวิน มาลี', studentId: '6412032', initials: 'ชม', tint: '#FEE2E2', accent: '#DC2626', role: 'Tester', skills: [{ label: 'Testing', bg: '#FEE2E2', color: '#DC2626' }] }
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

export const assignmentDetails = {
  1: { title: 'ออกแบบ UI หน้า Dashboard', groupLabel: 'ทีม A · Software Engineering', assignedDate: '8 มี.ค. 2569', dueDate: '11 มี.ค. 2569 23:59', timeLeft: '12 ชั่วโมง', description: 'ออกแบบ UI หน้า Dashboard โดยใช้หลักการของ Design System ที่ทีมกำหนดไว้ ครอบคลุม responsive layout, สถานะข้อมูลว่าง และการแสดงผลบนอุปกรณ์เคลื่อนที่', attachments: [{ name: 'design-brief.pdf' }, { name: 'design-references.fig' }] },
  2: { title: 'เขียน Unit Test สำหรับ Backend API', groupLabel: 'ทีม A · Software Engineering', assignedDate: '9 มี.ค. 2569', dueDate: '12 มี.ค. 2569 23:59', timeLeft: '1 วัน', description: 'เขียน Unit Test ครอบคลุม endpoint หลักของระบบ ด้วย coverage ไม่น้อยกว่า 80%', attachments: [{ name: 'api-spec.pdf' }] },
  3: { title: 'ดีไซน์การ Software Requirements', groupLabel: 'ทีม B · Web Development', assignedDate: '10 มี.ค. 2569', dueDate: '15 มี.ค. 2569 23:59', timeLeft: '3 วัน', description: 'จัดทำเอกสาร Software Requirements Specification ตามแนวทาง IEEE 830', attachments: [{ name: 'srs-template.docx' }] },
  4: { title: 'ปรับแต่ง Progress โปรเจกต์ครั้งที่ 2', groupLabel: 'ทีม A · Web Development', assignedDate: '11 มี.ค. 2569', dueDate: '20 มี.ค. 2569 23:59', timeLeft: '9 วัน', description: 'สรุปความคืบหน้าของโปรเจกต์ครั้งที่ 2 พร้อมอัปเดต timeline และปัญหาที่พบ', attachments: [{ name: 'progress-report-1.pdf' }] }
};

export const initialAssignmentItems = [
  { id: 1, title: 'ออกแบบ UI หน้า Dashboard', groupLabel: 'ทีม A · Software Engineering', dateLabel: '11 มีนาคม 2569', dueTime: '23:59', timeLeft: '12 ชม.' },
  { id: 2, title: 'เขียน Unit Test สำหรับ Backend API', groupLabel: 'ทีม A · Software Engineering', dateLabel: '12 มีนาคม 2569', dueTime: '23:59', timeLeft: '1 วัน' },
  { id: 3, title: 'ดีไซน์การ Software Requirements', groupLabel: 'ทีม B · Web Development', dateLabel: '15 มีนาคม 2569', dueTime: '23:59', timeLeft: '3 วัน' },
  { id: 4, title: 'ปรับแต่ง Progress โปรเจกต์ครั้งที่ 2', groupLabel: 'ทีม A · Web Development', dateLabel: '20 มีนาคม 2569', dueTime: '23:59', timeLeft: '9 วัน' }
];

export const initialKanbanTasks = {
  todo: [
    { title: 'วิจัย Technology Stack', initials: 'วส', tint: '#EFF6FF', accent: '#2563EB', date: '02-10' },
    { title: 'ออกแบบ Database Schema', initials: 'กพ', tint: '#E8F8EE', accent: '#16A34A', date: '02-05' },
    { title: 'เขียน User Stories', initials: 'ปน', tint: '#FEE2E2', accent: '#DC2626', date: '02-08' }
  ],
  inprogress: [
    { title: 'สร้าง Wireframe', initials: 'สว', tint: '#EFF6FF', accent: '#2563EB', date: '09-30' },
    { title: 'ตรวจสอบ ER Diagram', initials: 'สย', tint: '#E8F8EE', accent: '#16A34A', date: '01-24' }
  ],
  done: [
    { title: 'กำหนดขอบเขตโปรเจกต์', initials: 'สว', tint: '#EFF6FF', accent: '#2563EB', date: '01-20' }
  ]
};

export const teamBoardDataSeed = {
  A: [
    { key: 'todo', label: 'To Do', color: '#6B7280', tasks: [
      { title: 'วิจัย Technology Stack', initials: 'วส', tint: '#EFF6FF', accent: '#2563EB', date: '02-10' },
      { title: 'ออกแบบ Database Schema', initials: 'กพ', tint: '#E8F8EE', accent: '#16A34A', date: '02-05' }
    ] },
    { key: 'inprogress', label: 'In Progress', color: '#F59E0B', tasks: [
      { title: 'สร้าง Wireframe', initials: 'สว', tint: '#EFF6FF', accent: '#2563EB', date: '09-30' }
    ] },
    { key: 'done', label: 'Done', color: '#16A34A', tasks: [
      { title: 'กำหนดขอบเขตโปรเจกต์', initials: 'สว', tint: '#EFF6FF', accent: '#2563EB', date: '01-20' }
    ] }
  ],
  B: [
    { key: 'todo', label: 'To Do', color: '#6B7280', tasks: [
      { title: 'ออกแบบหน้า Landing Page', initials: 'กศ', tint: '#F3E8FD', accent: '#8B5CF6', date: '02-12' }
    ] },
    { key: 'inprogress', label: 'In Progress', color: '#F59E0B', tasks: [
      { title: 'ทำ API เชื่อมต่อฐานข้อมูล', initials: 'บว', tint: '#E8F8EE', accent: '#16A34A', date: '02-08' }
    ] },
    { key: 'done', label: 'Done', color: '#16A34A', tasks: [] }
  ],
  C: [
    { key: 'todo', label: 'To Do', color: '#6B7280', tasks: [
      { title: 'เก็บข้อมูลเทรนโมเดล', initials: 'พส', tint: '#FEF3C7', accent: '#B45309', date: '02-14' }
    ] },
    { key: 'inprogress', label: 'In Progress', color: '#F59E0B', tasks: [
      { title: 'เขียน Prompt Chatbot', initials: 'ธพ', tint: '#FEE2E2', accent: '#DC2626', date: '02-09' }
    ] },
    { key: 'done', label: 'Done', color: '#16A34A', tasks: [
      { title: 'สำรวจ LLM ที่ใช้ได้', initials: 'ฝส', tint: '#E0F2FE', accent: '#0EA5E9', date: '01-28' }
    ] }
  ],
  D: [
    { key: 'todo', label: 'To Do', color: '#6B7280', tasks: [] },
    { key: 'inprogress', label: 'In Progress', color: '#F59E0B', tasks: [
      { title: 'ออกแบบ Data Pipeline', initials: 'อป', tint: '#E8F8EE', accent: '#16A34A', date: '02-11' }
    ] },
    { key: 'done', label: 'Done', color: '#16A34A', tasks: [
      { title: 'ตั้งค่าฐานข้อมูล', initials: 'ธภ', tint: '#EFF6FF', accent: '#2563EB', date: '01-25' }
    ] }
  ]
};

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

export const initialTasks = [
  { id: 1, title: 'ออกแบบ ER Diagram', groupCode: '264991', assignedDate: '2024-01-15', dueDate: '2024-01-25', status: 'done', percent: 100 },
  { id: 2, title: 'สร้าง Wireframe หน้า Login', groupCode: '264991', assignedDate: '2024-01-20', dueDate: '2024-02-01', status: 'inprogress', percent: 75 },
  { id: 3, title: 'เขียน Test Cases', groupCode: '264991', assignedDate: '2024-01-22', dueDate: '2024-01-28', status: 'review', percent: 30 },
  { id: 4, title: 'อัพเกรดระบบ SRS', groupCode: '264991', assignedDate: '2024-01-10', dueDate: '2024-01-20', status: 'overdue', percent: 0 }
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

export const statusMeta = (status) => {
  const map = {
    done: { label: 'เสร็จแล้ว', bg: '#E8F8EE', color: '#16A34A' },
    inprogress: { label: 'กำลังดำเนินการ', bg: '#FEF3C7', color: '#D97706' },
    review: { label: 'รอตรวจ', bg: '#EFF6FF', color: '#2563EB' },
    overdue: { label: 'เลยกำหนด', bg: '#FEE2E2', color: '#DC2626' }
  };
  return map[status] || map.review;
};
