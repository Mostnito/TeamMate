const express = require('express');
const http = require("http");
const cors = require('cors');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
        socket.userId = jwt.verify(token, process.env.TOKEN_SECRET).userId;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    socket.on('join_group', async (groupId) => {
        if (!(await isGroupMember(socket.userId, groupId))) return;
        socket.join(`group_${groupId}`);
    });

    socket.on('send_message', async ({ groupId, content }) => {
        if (!content || !content.trim()) return;
        if (!(await isGroupMember(socket.userId, groupId))) return;

        try {
            const result = await pool.query(
                `INSERT INTO messages (group_id, user_id, content) VALUES ($1, $2, $3)
                 RETURNING message_id, group_id, user_id, content, sent_at`,
                [groupId, socket.userId, content.trim()]
            );
            const userResult = await pool.query('SELECT firstname, lastname, avatar_path FROM users WHERE user_id = $1', [socket.userId]);
            const msg = result.rows[0];
            const sender = userResult.rows[0];
            io.to(`group_${groupId}`).emit('message_received', {
                messageId: msg.message_id,
                groupId: msg.group_id,
                senderId: msg.user_id,
                senderName: `${sender.firstname} ${sender.lastname}`,
                senderAvatarUrl: sender.avatar_path,
                content: msg.content,
                sentAt: msg.sent_at
            });
        } catch (err) {
            console.error('Error sending chat message:', err);
        }
    });
});

require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database');
    }
});

app.use(cors());
app.use(express.json());

const avatarDir = path.join(__dirname, 'uploads', 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const AVATAR_MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const uploadAvatar = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, avatarDir),
        filename: (req, file, cb) => cb(null, `user_${req.params.id}_${Date.now()}${AVATAR_MIME_TO_EXT[file.mimetype]}`)
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!AVATAR_MIME_TO_EXT[file.mimetype]) {
            return cb(new Error('INVALID_FILE_TYPE'));
        }
        cb(null, true);
    }
});

//Authentication middleware
function authenticateToken(req, res, next){
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")){
        console.log("No token");
        return res.status(401).json({error: "No token"})
    }

    const token = authHeader.split(" ")[1];
    if (!token){
        console.log("No token");
        return res.status(401).json({error: "No token"})
    }

    try{
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        
        req.user = decoded;
        next();
    } catch (err){
        console.log("Invalid token",token);
        return res.status(401).json({error: "Invalid token"})
    }
}


//Register and Login routes

app.post('/api/register', async (req, res) => {
    const { firstName, lastName, nickname, studentId, genderId, birthdate, email, phone, skills, password } = req.body;

    if (!firstName || !lastName || !nickname || !email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (!genderId) {
        return res.status(400).json({ error: 'กรุณาเลือกเพศ' });
    }
    if (!birthdate) {
        return res.status(400).json({ error: 'กรุณาเลือกวันเกิด' });
    }
    if (!/^[0-9]+$/.test((phone || '').trim())) {
        return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const emailCheck = await client.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        if (studentId) {
            const studentIdCheck = await client.query('SELECT 1 FROM users WHERE student_id = $1', [studentId]);
            if (studentIdCheck.rows.length) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'รหัสนิสิตนี้ถูกใช้งานแล้ว' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userResult = await client.query(
            `INSERT INTO users (gender_id, student_id, firstname, lastname, nickname, email, password_hash, birth_date, phone)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING user_id`,
            [genderId || null, studentId || null, firstName, lastName, nickname, email, passwordHash, birthdate || null, phone || null]
        );
        const userId = userResult.rows[0].user_id;

        for (const rawSkillName of (skills || [])) {
            const skillName = (rawSkillName || '').trim();
            if (!skillName) continue;
            const existingSkill = await client.query('SELECT skill_id FROM skills WHERE lower(skill_name) = lower($1)', [skillName]);
            const skillId = existingSkill.rows.length
                ? existingSkill.rows[0].skill_id
                : (await client.query('INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id', [skillName])).rows[0].skill_id;
            await client.query('INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT (user_id, skill_id) DO NOTHING', [userId, skillId]);
        }

        await client.query('COMMIT');
        console.log('User registered successfully:', email);
        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error registering user:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'ข้อมูลนี้ถูกใช้งานแล้ว' });
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'ข้อมูลเพศไม่ถูกต้อง' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
        client.release();
    }
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = userResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign({ userId: user.user_id }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
        res.json({ token, userId: user.user_id, nickname: user.nickname, studentId: user.student_id, role: user.system_role, avatarUrl: user.avatar_path, message: 'เข้าสู่ระบบสำเร็จ' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

app.get('/api/check', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, nickname, student_id, system_role, avatar_path FROM users WHERE user_id = $1', [req.user.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }
        const user = result.rows[0];
        res.json({ userId: user.user_id, nickname: user.nickname, studentId: user.student_id, role: user.system_role, avatarUrl: user.avatar_path });
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get user profile
app.get('/api/user/:id', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้นี้' });
    }
    try {
        const userResult = await pool.query(
            'SELECT user_id, firstname, lastname, nickname, student_id, gender_id, birth_date, email, phone, avatar_path FROM users WHERE user_id = $1',
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }
        const user = userResult.rows[0];
        const skillsResult = await pool.query(
            'SELECT s.skill_name FROM user_skills us JOIN skills s ON s.skill_id = us.skill_id WHERE us.user_id = $1',
            [userId]
        );
        res.json({
            userId: user.user_id,
            firstName: user.firstname,
            lastName: user.lastname,
            nickname: user.nickname,
            studentId: user.student_id,
            genderId: user.gender_id,
            birthdate: user.birth_date ? user.birth_date.toISOString().slice(0, 10) : null,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatar_path,
            skills: skillsResult.rows.map((r) => r.skill_name)
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Update user profile
app.put('/api/user/:id', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้นี้' });
    }

    const { firstName, lastName, nickname, studentId, genderId, birthdate, phone, skills } = req.body;

    if (!firstName || !lastName || !nickname) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (!genderId) {
        return res.status(400).json({ error: 'กรุณาเลือกเพศ' });
    }
    if (!birthdate) {
        return res.status(400).json({ error: 'กรุณาเลือกวันเกิด' });
    }
    if (!/^[0-9]+$/.test((phone || '').trim())) {
        return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        if (studentId) {
            const studentIdCheck = await client.query('SELECT 1 FROM users WHERE student_id = $1 AND user_id != $2', [studentId, userId]);
            if (studentIdCheck.rows.length) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'รหัสนิสิตนี้ถูกใช้งานแล้ว' });
            }
        }

        await client.query(
            `UPDATE users SET gender_id=$1, student_id=$2, firstname=$3, lastname=$4, nickname=$5, birth_date=$6, phone=$7 WHERE user_id=$8`,
            [genderId, studentId || null, firstName, lastName, nickname, birthdate, phone, userId]
        );

        await client.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);
        for (const rawSkillName of (skills || [])) {
            const skillName = (rawSkillName || '').trim();
            if (!skillName) continue;
            const existingSkill = await client.query('SELECT skill_id FROM skills WHERE lower(skill_name) = lower($1)', [skillName]);
            const skillId = existingSkill.rows.length
                ? existingSkill.rows[0].skill_id
                : (await client.query('INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id', [skillName])).rows[0].skill_id;
            await client.query('INSERT INTO user_skills (user_id, skill_id) VALUES ($1, $2) ON CONFLICT (user_id, skill_id) DO NOTHING', [userId, skillId]);
        }

        await client.query('COMMIT');
        console.log('User profile updated successfully:', userId);
        res.json({ message: 'บันทึกการตั้งค่าแล้ว' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating user profile:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'ข้อมูลนี้ถูกใช้งานแล้ว' });
        }
        if (err.code === '23503') {
            return res.status(400).json({ error: 'ข้อมูลเพศไม่ถูกต้อง' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
        client.release();
    }
});

//Upload profile picture
app.post('/api/user/:id/avatar', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้นี้' });
    }

    uploadAvatar.single('avatar')(req, res, async (err) => {
        if (err) {
            if (err.message === 'INVALID_FILE_TYPE') {
                return res.status(400).json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น' });
            }
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 2MB' });
            }
            console.error('Error uploading avatar:', err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์รูปภาพ' });
        }

        try {
            const oldResult = await pool.query('SELECT avatar_path FROM users WHERE user_id = $1', [userId]);
            const oldPath = oldResult.rows[0]?.avatar_path;

            const avatarUrl = '/uploads/avatars/' + req.file.filename;
            await pool.query('UPDATE users SET avatar_path = $1 WHERE user_id = $2', [avatarUrl, userId]);

            if (oldPath) {
                fs.unlink(path.join(__dirname, oldPath), () => {});
            }

            console.log('Avatar updated successfully:', userId);
            res.json({ avatarUrl, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ' });
        } catch (dbErr) {
            fs.unlink(req.file.path, () => {});
            console.error('Error saving avatar path:', dbErr);
            res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
        }
    });
});

//Get Gender
app.get('/api/gender', async (req, res) =>{
    try{
        const result = await pool.query('SELECT * FROM gender');
        res.json(result.rows);
        console.log('Gender data fetched successfully');

    }catch(err){
        console.error('Error fetching gender:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Get Skill
app.get('/api/skill', async (req, res) =>{
    try{
        const result = await pool.query('SELECT * FROM skills');
        res.json(result.rows);
        console.log('Skill data fetched successfully');
    } catch(err){
        console.error('Error fetching skill:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Insert More skill

app.post('/api/skill', async (req, res) => {
    const { skill_name } = req.body;
    try {
        const result = await pool.query('INSERT INTO skills (skill_name) VALUES ($1) RETURNING *', [skill_name]);
        res.status(201).json(result.rows[0]);
        console.log('Skill inserted successfully');
    } catch (err) {
        console.error('Error inserting skill:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Create group
app.post('/api/group/create', authenticateToken, async (req, res) => {
    const { subjectCode, subjectName, advisorName } = req.body;

    if (!subjectCode || !subjectName || !advisorName) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const client = await pool.connect();
    try {
        const MAX_ATTEMPTS = 5;
        let group;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            const groupCode = Math.random().toString(36).slice(2, 8).toUpperCase();
            try {
                await client.query('BEGIN');

                const groupResult = await client.query(
                    `INSERT INTO groups (group_code, subject_code, subject_name, advisor_name, created_by)
                     VALUES ($1, $2, $3, $4, $5) RETURNING group_id, group_code, subject_code, subject_name, advisor_name, created_at`,
                    [groupCode, subjectCode, subjectName, advisorName, req.user.userId]
                );
                group = groupResult.rows[0];

                await client.query(
                    `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'leader')`,
                    [group.group_id, req.user.userId]
                );

                await client.query('COMMIT');
                break;
            } catch (err) {
                await client.query('ROLLBACK');
                if (err.code === '23505' && attempt < MAX_ATTEMPTS) {
                    continue; // group_code collision
                }
                throw err;
            }
        }

        console.log('Group created successfully:', group.group_id);
        res.status(201).json({
            groupId: group.group_id,
            groupCode: group.group_code,
            subjectCode: group.subject_code,
            subjectName: group.subject_name,
            advisorName: group.advisor_name,
            message: 'สร้างกลุ่มสำเร็จ'
        });
    } catch (err) {
        console.error('Error creating group:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
        client.release();
    }
});

//Join group
app.post('/api/group/join', authenticateToken, async (req, res) => {
    const { groupCode } = req.body;

    if (!groupCode || groupCode.length !== 6) {
        return res.status(400).json({ error: 'กรุณากรอกรหัสให้ครบ 6 หลัก' });
    }

    try {
        const groupResult = await pool.query(
            'SELECT group_id, group_code, subject_code, subject_name FROM groups WHERE group_code = $1',
            [groupCode.toUpperCase()]
        );
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบรหัสทีมนี้ กรุณาตรวจสอบอีกครั้ง' });
        }
        const group = groupResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
            [group.group_id, req.user.userId]
        );
        if (memberCheck.rows.length) {
            return res.status(409).json({ error: 'คุณเป็นสมาชิกกลุ่มนี้อยู่แล้ว' });
        }

        await pool.query(
            `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')`,
            [group.group_id, req.user.userId]
        );

        console.log('User joined group successfully:', req.user.userId, '->', group.group_id);
        res.status(201).json({
            groupId: group.group_id,
            groupCode: group.group_code,
            subjectCode: group.subject_code,
            subjectName: group.subject_name,
            message: 'เข้าร่วมกลุ่มสำเร็จ'
        });
    } catch (err) {
        console.error('Error joining group:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Group authorization helpers
async function isGroupMember(userId, groupId) {
    const result = await pool.query('SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    return result.rows.length > 0;
}
async function isGroupLeader(userId, groupId) {
    const result = await pool.query(`SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'leader'`, [groupId, userId]);
    return result.rows.length > 0;
}

//Task attachment upload
const taskAttachmentDir = path.join(__dirname, 'uploads', 'tasks');
fs.mkdirSync(taskAttachmentDir, { recursive: true });
const uploadTaskAttachment = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, taskAttachmentDir),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
            cb(null, `task_${req.params.id}_${Date.now()}${ext}`);
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }
});

app.get('/api/group/data', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT g.group_id, g.group_code, g.subject_code, g.subject_name, g.advisor_name, gm.role,
                    (SELECT COUNT(*)::int FROM group_members gm2 WHERE gm2.group_id = g.group_id) AS member_count,
                    (SELECT COUNT(*)::int FROM tasks t WHERE t.group_id = g.group_id) AS task_count
             FROM group_members gm
             JOIN groups g ON g.group_id = gm.group_id
             WHERE gm.user_id = $1
             ORDER BY g.created_at DESC`,
            [req.user.userId]
        );

        res.json(result.rows.map((r) => ({
            groupId: r.group_id,
            groupCode: r.group_code,
            subjectCode: r.subject_code,
            subjectName: r.subject_name,
            advisorName: r.advisor_name,
            role: r.role,
            memberCount: r.member_count,
            taskCount: r.task_count
        })));
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get all non-completed tasks across every group the current user belongs to (for Dashboard)
app.get('/api/user/me/tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.task_id, t.group_id, t.title, t.status, t.due_date, g.subject_code, g.subject_name
             FROM tasks t
             JOIN group_members gm ON gm.group_id = t.group_id AND gm.user_id = $1
             JOIN groups g ON g.group_id = t.group_id
             WHERE t.status != 'completed'
             ORDER BY t.due_date ASC NULLS LAST`,
            [req.user.userId]
        );
        res.json(result.rows.map((r) => ({
            taskId: r.task_id,
            groupId: r.group_id,
            groupLabel: `${r.subject_code} · ${r.subject_name}`,
            title: r.title,
            status: r.status,
            dueDate: r.due_date ? r.due_date.toISOString().slice(0, 10) : null
        })));
    } catch (err) {
        console.error('Error fetching user tasks:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get group members
app.get('/api/group/:id/members', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        if (!(await isGroupMember(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }
        const result = await pool.query(
            `SELECT u.user_id, u.firstname, u.lastname, u.nickname, u.student_id, u.avatar_path, gm.role,
                    COALESCE(array_agg(s.skill_name) FILTER (WHERE s.skill_name IS NOT NULL), '{}') AS skills
             FROM group_members gm
             JOIN users u ON u.user_id = gm.user_id
             LEFT JOIN user_skills us ON us.user_id = u.user_id
             LEFT JOIN skills s ON s.skill_id = us.skill_id
             WHERE gm.group_id = $1
             GROUP BY u.user_id, gm.role
             ORDER BY gm.role = 'leader' DESC, u.firstname`,
            [groupId]
        );
        res.json(result.rows.map((r) => ({
            userId: r.user_id,
            firstName: r.firstname,
            lastName: r.lastname,
            nickname: r.nickname,
            studentId: r.student_id,
            avatarUrl: r.avatar_path,
            role: r.role,
            skills: r.skills
        })));
    } catch (err) {
        console.error('Error fetching group members:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Kick group member (leader only) - unassigns their tasks in this group too
app.delete('/api/group/:id/members/:userId', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    if (!Number.isInteger(groupId) || !Number.isInteger(targetUserId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }

    const client = await pool.connect();
    try {
        const isSelf = req.user.userId === targetUserId;
        const isLeaderCaller = await isGroupLeader(req.user.userId, groupId);
        if (!isLeaderCaller && !isSelf) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ทำรายการนี้' });
        }

        const memberResult = await pool.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบสมาชิกนี้ในกลุ่ม' });
        }
        if (memberResult.rows[0].role === 'leader') {
            return res.status(400).json({
                error: isSelf ? 'คุณเป็นหัวหน้ากลุ่ม ไม่สามารถออกจากกลุ่มได้ กรุณาลบกลุ่มแทน' : 'ไม่สามารถเตะหัวหน้ากลุ่มออกได้'
            });
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, targetUserId]);
        await client.query('UPDATE tasks SET assigned_to = NULL WHERE group_id = $1 AND assigned_to = $2', [groupId, targetUserId]);
        await client.query('COMMIT');

        console.log(isSelf ? 'Member left group:' : 'Member kicked from group:', targetUserId, 'from', groupId);
        res.json({ message: isSelf ? 'ออกจากกลุ่มสำเร็จ' : 'เตะสมาชิกออกจากกลุ่มสำเร็จ' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error removing member:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
        client.release();
    }
});

//Delete group (leader only) - requires typing the subject code to confirm
app.delete('/api/group/:id', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { confirmCode } = req.body;

    try {
        const groupResult = await pool.query('SELECT subject_code FROM groups WHERE group_id = $1', [groupId]);
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบกลุ่มนี้' });
        }

        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่ลบกลุ่มได้' });
        }
        if (!confirmCode || confirmCode !== groupResult.rows[0].subject_code) {
            return res.status(400).json({ error: 'รหัสวิชายืนยันไม่ถูกต้อง' });
        }

        const attachmentsResult = await pool.query(
            `SELECT ta.file_path FROM task_attachments ta
             JOIN tasks t ON t.task_id = ta.task_id
             WHERE t.group_id = $1`,
            [groupId]
        );

        await pool.query('DELETE FROM groups WHERE group_id = $1', [groupId]);

        attachmentsResult.rows.forEach((a) => fs.unlink(path.join(__dirname, a.file_path), () => {}));

        console.log('Group deleted successfully:', groupId);
        res.json({ message: 'ลบกลุ่มสำเร็จ' });
    } catch (err) {
        console.error('Error deleting group:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get group tasks
app.get('/api/group/:id/tasks', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        if (!(await isGroupMember(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }
        const result = await pool.query(
            `SELECT t.task_id, t.title, t.description, t.assigned_by, t.assigned_to, t.due_date, t.status, t.created_at,
                    u.firstname AS assignee_firstname, u.lastname AS assignee_lastname, u.avatar_path AS assignee_avatar
             FROM tasks t
             LEFT JOIN users u ON u.user_id = t.assigned_to
             WHERE t.group_id = $1
             ORDER BY t.created_at DESC`,
            [groupId]
        );
        res.json(result.rows.map((r) => ({
            taskId: r.task_id,
            title: r.title,
            description: r.description,
            assignedBy: r.assigned_by,
            assignedTo: r.assigned_to,
            assigneeName: r.assigned_to ? `${r.assignee_firstname} ${r.assignee_lastname}` : null,
            assigneeAvatarUrl: r.assigned_to ? r.assignee_avatar : null,
            dueDate: r.due_date ? r.due_date.toISOString().slice(0, 10) : null,
            status: r.status,
            createdAt: r.created_at
        })));
    } catch (err) {
        console.error('Error fetching group tasks:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get group chat history (latest 50 messages, chronological order)
app.get('/api/group/:id/messages', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        if (!(await isGroupMember(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }
        const result = await pool.query(
            `SELECT m.message_id, m.group_id, m.user_id, m.content, m.sent_at, u.firstname, u.lastname, u.avatar_path
             FROM messages m
             JOIN users u ON u.user_id = m.user_id
             WHERE m.group_id = $1
             ORDER BY m.sent_at DESC
             LIMIT 50`,
            [groupId]
        );
        res.json(result.rows.reverse().map((r) => ({
            messageId: r.message_id,
            groupId: r.group_id,
            senderId: r.user_id,
            senderName: `${r.firstname} ${r.lastname}`,
            senderAvatarUrl: r.avatar_path,
            content: r.content,
            sentAt: r.sent_at
        })));
    } catch (err) {
        console.error('Error fetching group messages:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Create task
const TASK_STATUS_VALUES = ['pending', 'in_progress', 'completed', 'overdue', 'cancelled', 'under_review'];

// anchors a plain 'YYYY-MM-DD' date to UTC midnight so it round-trips correctly
// regardless of the server's local timezone (due_date is TIMESTAMPTZ)
function toUtcMidnight(dateOnly) {
    return dateOnly ? `${dateOnly}T00:00:00Z` : null;
}

app.post('/api/group/:id/tasks', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { title, description, assignedTo, dueDate, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกชื่องาน' });
    }
    if (status && !TASK_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ error: 'สถานะงานไม่ถูกต้อง' });
    }

    try {
        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่สร้างงานได้' });
        }
        if (assignedTo) {
            if (!(await isGroupMember(assignedTo, groupId))) {
                return res.status(400).json({ error: 'ผู้รับมอบหมายไม่ใช่สมาชิกกลุ่มนี้' });
            }
        }

        const result = await pool.query(
            `INSERT INTO tasks (group_id, title, description, assigned_by, assigned_to, due_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING task_id, title, description, assigned_by, assigned_to, due_date, status, created_at`,
            [groupId, title.trim(), description || null, req.user.userId, assignedTo || null, toUtcMidnight(dueDate), status || 'pending']
        );
        const task = result.rows[0];

        console.log('Task created successfully:', task.task_id);
        res.status(201).json({
            taskId: task.task_id,
            title: task.title,
            description: task.description,
            assignedBy: task.assigned_by,
            assignedTo: task.assigned_to,
            dueDate: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
            status: task.status,
            createdAt: task.created_at,
            message: 'สร้างงานสำเร็จ'
        });
    } catch (err) {
        console.error('Error creating task:', err);
        if (err.code === '23503') {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get single task
app.get('/api/task/:id', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        const taskResult = await pool.query(
            `SELECT t.task_id, t.group_id, t.title, t.description, t.assigned_by, t.assigned_to, t.due_date, t.status, t.created_at,
                    u.firstname AS assignee_firstname, u.lastname AS assignee_lastname, u.avatar_path AS assignee_avatar
             FROM tasks t
             LEFT JOIN users u ON u.user_id = t.assigned_to
             WHERE t.task_id = $1`,
            [taskId]
        );
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const task = taskResult.rows[0];

        if (!(await isGroupMember(req.user.userId, task.group_id))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }

        const attachmentsResult = await pool.query(
            'SELECT task_attachment_id, file_name, file_path, uploaded_by, uploaded_at FROM task_attachments WHERE task_id = $1 ORDER BY uploaded_at DESC',
            [taskId]
        );
        const submissionResult = await pool.query(
            'SELECT submitted_by, note, submitted_at FROM task_submissions WHERE task_id = $1',
            [taskId]
        );
        const reviewsResult = await pool.query(
            'SELECT task_review_id, reviewed_by, review_status, comment, reviewed_at FROM task_reviews WHERE task_id = $1 ORDER BY reviewed_at DESC',
            [taskId]
        );

        res.json({
            taskId: task.task_id,
            groupId: task.group_id,
            title: task.title,
            description: task.description,
            assignedBy: task.assigned_by,
            assignedTo: task.assigned_to,
            assigneeName: task.assigned_to ? `${task.assignee_firstname} ${task.assignee_lastname}` : null,
            assigneeAvatarUrl: task.assigned_to ? task.assignee_avatar : null,
            dueDate: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
            status: task.status,
            createdAt: task.created_at,
            attachments: attachmentsResult.rows.map((a) => ({
                taskAttachmentId: a.task_attachment_id,
                fileName: a.file_name,
                filePath: a.file_path,
                uploadedBy: a.uploaded_by,
                uploadedAt: a.uploaded_at
            })),
            submission: submissionResult.rows.length ? {
                submittedBy: submissionResult.rows[0].submitted_by,
                note: submissionResult.rows[0].note,
                submittedAt: submissionResult.rows[0].submitted_at
            } : null,
            reviews: reviewsResult.rows.map((r) => ({
                reviewId: r.task_review_id,
                reviewedBy: r.reviewed_by,
                reviewStatus: r.review_status,
                comment: r.comment,
                reviewedAt: r.reviewed_at
            }))
        });
    } catch (err) {
        console.error('Error fetching task:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Update task
app.patch('/api/task/:id', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { title, description, assignedTo, dueDate, status } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกชื่องาน' });
    }
    if (!status || !TASK_STATUS_VALUES.includes(status)) {
        return res.status(400).json({ error: 'สถานะงานไม่ถูกต้อง' });
    }

    try {
        const taskResult = await pool.query('SELECT group_id FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const groupId = taskResult.rows[0].group_id;

        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่แก้ไขงานได้' });
        }
        if (assignedTo) {
            if (!(await isGroupMember(assignedTo, groupId))) {
                return res.status(400).json({ error: 'ผู้รับมอบหมายไม่ใช่สมาชิกกลุ่มนี้' });
            }
        }

        const result = await pool.query(
            `UPDATE tasks SET title = $1, description = $2, assigned_to = $3, due_date = $4, status = $5
             WHERE task_id = $6
             RETURNING task_id, title, description, assigned_by, assigned_to, due_date, status, created_at`,
            [title.trim(), description || null, assignedTo || null, toUtcMidnight(dueDate), status, taskId]
        );
        const task = result.rows[0];

        console.log('Task updated successfully:', task.task_id);
        res.json({
            taskId: task.task_id,
            title: task.title,
            description: task.description,
            assignedBy: task.assigned_by,
            assignedTo: task.assigned_to,
            dueDate: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
            status: task.status,
            createdAt: task.created_at,
            message: 'บันทึกการแก้ไขงานสำเร็จ'
        });
    } catch (err) {
        console.error('Error updating task:', err);
        if (err.code === '23503') {
            return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Delete task
app.delete('/api/task/:id', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        const taskResult = await pool.query('SELECT group_id FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const groupId = taskResult.rows[0].group_id;

        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่ลบงานได้' });
        }

        await pool.query('DELETE FROM tasks WHERE task_id = $1', [taskId]);
        console.log('Task deleted successfully:', taskId);
        res.json({ message: 'ลบงานสำเร็จ' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Upload task attachment
app.post('/api/task/:id/attachments', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }

    (async () => {
        const taskResult = await pool.query('SELECT group_id, assigned_to, status FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const { group_id: groupId, assigned_to: assignedTo, status } = taskResult.rows[0];

        const isLeader = await isGroupLeader(req.user.userId, groupId);
        const isAssignee = assignedTo != null && req.user.userId === assignedTo;
        if (!isLeader && !isAssignee) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แนบไฟล์ในงานนี้' });
        }
        if (isAssignee && !isLeader && status === 'pending') {
            return res.status(400).json({ error: 'กรุณากดเริ่มดำเนินการก่อนจึงจะแนบไฟล์ส่งงานได้' });
        }

        uploadTaskAttachment.single('file')(req, res, async (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 20MB' });
                }
                console.error('Error uploading task attachment:', err);
                return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'กรุณาเลือกไฟล์' });
            }

            try {
                const filePath = '/uploads/tasks/' + req.file.filename;
                const result = await pool.query(
                    `INSERT INTO task_attachments (task_id, file_name, file_path, uploaded_by)
                     VALUES ($1, $2, $3, $4)
                     RETURNING task_attachment_id, file_name, file_path, uploaded_by, uploaded_at`,
                    [taskId, req.file.originalname, filePath, req.user.userId]
                );
                console.log('Task attachment uploaded successfully:', taskId);
                res.status(201).json({
                    taskAttachmentId: result.rows[0].task_attachment_id,
                    fileName: result.rows[0].file_name,
                    filePath: result.rows[0].file_path,
                    uploadedBy: result.rows[0].uploaded_by,
                    uploadedAt: result.rows[0].uploaded_at,
                    message: 'แนบไฟล์สำเร็จ'
                });
            } catch (dbErr) {
                fs.unlink(req.file.path, () => {});
                console.error('Error saving task attachment:', dbErr);
                res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
            }
        });
    })().catch((err) => {
        console.error('Error checking task before attachment upload:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    });
});

//Delete task attachment
app.delete('/api/task/:id/attachments/:attachmentId', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    const attachmentId = parseInt(req.params.attachmentId, 10);
    if (!Number.isInteger(taskId) || !Number.isInteger(attachmentId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        const taskResult = await pool.query('SELECT group_id FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const groupId = taskResult.rows[0].group_id;

        const attachmentResult = await pool.query(
            'SELECT file_path, uploaded_by FROM task_attachments WHERE task_attachment_id = $1 AND task_id = $2',
            [attachmentId, taskId]
        );
        if (attachmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบไฟล์นี้' });
        }

        const isLeader = await isGroupLeader(req.user.userId, groupId);
        const isOwnUpload = attachmentResult.rows[0].uploaded_by === req.user.userId;
        if (!isLeader && !isOwnUpload) {
            return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบไฟล์นี้' });
        }

        await pool.query('DELETE FROM task_attachments WHERE task_attachment_id = $1', [attachmentId]);
        fs.unlink(path.join(__dirname, attachmentResult.rows[0].file_path), () => {});

        console.log('Task attachment deleted successfully:', attachmentId);
        res.json({ message: 'ลบไฟล์สำเร็จ' });
    } catch (err) {
        console.error('Error deleting task attachment:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Assignee marks task as started (pending -> in_progress only)
app.patch('/api/task/:id/start', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        const taskResult = await pool.query('SELECT assigned_to, status FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const { assigned_to: assignedTo, status } = taskResult.rows[0];

        if (assignedTo == null || req.user.userId !== assignedTo) {
            return res.status(403).json({ error: 'เฉพาะผู้รับมอบหมายเท่านั้นที่เริ่มงานนี้ได้' });
        }
        if (status !== 'pending') {
            return res.status(400).json({ error: 'งานนี้เริ่มดำเนินการไปแล้ว' });
        }

        const result = await pool.query(
            `UPDATE tasks SET status = 'in_progress' WHERE task_id = $1
             RETURNING task_id, title, description, assigned_by, assigned_to, due_date, status, created_at`,
            [taskId]
        );
        const task = result.rows[0];

        console.log('Task started by assignee:', taskId);
        res.json({
            taskId: task.task_id,
            title: task.title,
            description: task.description,
            assignedBy: task.assigned_by,
            assignedTo: task.assigned_to,
            dueDate: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
            status: task.status,
            createdAt: task.created_at,
            message: 'เริ่มดำเนินการงานแล้ว'
        });
    } catch (err) {
        console.error('Error starting task:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Submit task
app.post('/api/task/:id/submission', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { note } = req.body;

    try {
        const taskResult = await pool.query('SELECT assigned_to, status FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const { assigned_to: assignedTo, status } = taskResult.rows[0];

        if (assignedTo == null) {
            return res.status(400).json({ error: 'งานนี้ยังไม่ได้มอบหมายให้ใคร' });
        }
        if (req.user.userId !== assignedTo) {
            return res.status(403).json({ error: 'เฉพาะผู้รับมอบหมายเท่านั้นที่ส่งงานนี้ได้' });
        }
        if (status === 'pending') {
            return res.status(400).json({ error: 'กรุณากดเริ่มดำเนินการก่อนจึงจะส่งงานได้' });
        }

        const result = await pool.query(
            `INSERT INTO task_submissions (task_id, submitted_by, note) VALUES ($1, $2, $3)
             ON CONFLICT (task_id) DO UPDATE SET note = $3, submitted_at = now()
             RETURNING task_id, submitted_by, note, submitted_at`,
            [taskId, req.user.userId, note || null]
        );
        await pool.query(`UPDATE tasks SET status = 'under_review' WHERE task_id = $1`, [taskId]);

        console.log('Task submission saved successfully:', taskId);
        res.json({
            taskId: result.rows[0].task_id,
            submittedBy: result.rows[0].submitted_by,
            note: result.rows[0].note,
            submittedAt: result.rows[0].submitted_at,
            message: 'บันทึกการส่งงานสำเร็จ'
        });
    } catch (err) {
        console.error('Error saving task submission:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Review task submission
const TASK_REVIEW_STATUS_VALUES = ['approved', 'rejected', 'revision_requested'];

app.post('/api/task/:id/review', authenticateToken, async (req, res) => {
    const taskId = parseInt(req.params.id, 10);
    if (!Number.isInteger(taskId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { reviewStatus, comment } = req.body;

    if (!reviewStatus || !TASK_REVIEW_STATUS_VALUES.includes(reviewStatus)) {
        return res.status(400).json({ error: 'สถานะการตรวจงานไม่ถูกต้อง' });
    }

    try {
        const taskResult = await pool.query('SELECT group_id FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const groupId = taskResult.rows[0].group_id;

        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่ตรวจงานได้' });
        }

        const submissionResult = await pool.query('SELECT 1 FROM task_submissions WHERE task_id = $1', [taskId]);
        if (submissionResult.rows.length === 0) {
            return res.status(400).json({ error: 'ยังไม่มีการส่งงานสำหรับงานนี้' });
        }

        const result = await pool.query(
            `INSERT INTO task_reviews (task_id, reviewed_by, review_status, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING task_review_id, reviewed_by, review_status, comment, reviewed_at`,
            [taskId, req.user.userId, reviewStatus, comment || null]
        );
        const newTaskStatus = reviewStatus === 'approved' ? 'completed' : 'in_progress';
        await pool.query('UPDATE tasks SET status = $1 WHERE task_id = $2', [newTaskStatus, taskId]);

        console.log('Task review saved successfully:', taskId);
        res.status(201).json({
            reviewId: result.rows[0].task_review_id,
            reviewedBy: result.rows[0].reviewed_by,
            reviewStatus: result.rows[0].review_status,
            comment: result.rows[0].comment,
            reviewedAt: result.rows[0].reviewed_at,
            message: 'บันทึกผลการตรวจสำเร็จ'
        });
    } catch (err) {
        console.error('Error saving task review:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});




server.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});