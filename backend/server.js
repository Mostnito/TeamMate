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
            const settingsResult = await pool.query(`SELECT value FROM system_settings WHERE key = 'banned_words'`);
            const bannedWords = (settingsResult.rows[0]?.value || '').split(',').map((w) => w.trim()).filter(Boolean);
            const { censored, flagged } = censorContent(content.trim(), bannedWords);

            const result = await pool.query(
                `INSERT INTO messages (group_id, user_id, content) VALUES ($1, $2, $3)
                 RETURNING message_id, group_id, user_id, content, sent_at`,
                [groupId, socket.userId, censored]
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

            if (flagged.length > 0) {
                await pool.query(
                    `INSERT INTO reports (type, group_id, reporter_id, target_id, detail) VALUES ($1, $2, $3, $4, $5)`,
                    ['chat_message', groupId, socket.userId, msg.message_id, `ระบบตรวจพบคำไม่เหมาะสมโดยอัตโนมัติ: ${flagged.join(', ')}`]
                );
                logActivity(socket.userId, 'submit_report', 'report', msg.message_id, { ip: socket.handshake.address });
            }
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
        logActivity(userId, 'register', 'user', userId, req);
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
        if (!user.is_active) {
            return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
        }

        const token = jwt.sign({ userId: user.user_id }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
        logActivity(user.user_id, 'login', null, null, req);
        res.json({ token, userId: user.user_id, nickname: user.nickname, studentId: user.student_id, role: user.system_role, avatarUrl: user.avatar_path, message: 'เข้าสู่ระบบสำเร็จ' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

app.get('/api/check', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, nickname, student_id, system_role, avatar_path, is_active FROM users WHERE user_id = $1', [req.user.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
        }
        const user = result.rows[0];
        if (!user.is_active) {
            return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
        }
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

//Get a user's achievements - all achievements, earned or locked-with-progress, own data only
app.get('/api/user/:id/achievements', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (!Number.isInteger(userId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
    }
    try {
        const [achievementsResult, earnedResult, metrics] = await Promise.all([
            pool.query('SELECT achievement_id, code, name, description, img_path, metric, threshold, points_reward FROM achievements ORDER BY threshold ASC'),
            pool.query('SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = $1', [userId]),
            getAllMetricValues(userId)
        ]);
        const earnedMap = new Map(earnedResult.rows.map((r) => [r.achievement_id, r.earned_at]));
        res.json(achievementsResult.rows.map((a) => {
            const currentValue = metrics[a.metric] || 0;
            const earnedAt = earnedMap.get(a.achievement_id) || null;
            return {
                achievementId: a.achievement_id,
                code: a.code,
                name: a.name,
                description: a.description,
                imgPath: a.img_path,
                metric: a.metric,
                threshold: a.threshold,
                pointsReward: a.points_reward,
                currentValue,
                isEarned: !!earnedAt,
                earnedAt,
                progressPercent: Math.min(100, Math.round((currentValue / a.threshold) * 100))
            };
        }));
    } catch (err) {
        console.error('Error fetching achievements:', err);
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
        logActivity(req.user.userId, 'update_profile', 'user', userId, req);
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
            logActivity(req.user.userId, 'update_avatar', 'user', userId, req);
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
        logActivity(req.user.userId, 'create_group', 'group', group.group_id, req);
        checkAndAwardAchievements(req.user.userId, 'groups_created');
        checkAndAwardAchievements(req.user.userId, 'groups_joined');
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
        logActivity(req.user.userId, 'join_group', 'group', group.group_id, req);
        checkAndAwardAchievements(req.user.userId, 'groups_joined');
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
async function isAdmin(userId) {
    const result = await pool.query(`SELECT 1 FROM users WHERE user_id = $1 AND system_role = 'admin'`, [userId]);
    return result.rows.length > 0;
}

// fire-and-forget audit log write - must never throw outward or block the action it's attached to
async function logActivity(userId, action, targetType, targetId, req) {
    try {
        await pool.query(
            'INSERT INTO activity_logs (user_id, action, target_type, target_id, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [userId, action, targetType || null, targetId || null, req.ip]
        );
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

// each metric is a single count query keyed by user_id - used both to award achievements and to show progress
const METRIC_QUERIES = {
    groups_created: `SELECT COUNT(*)::int FROM groups WHERE created_by = $1`,
    groups_joined: `SELECT COUNT(*)::int FROM group_members WHERE user_id = $1`,
    tasks_submitted: `SELECT COUNT(*)::int FROM task_submissions WHERE submitted_by = $1`,
    tasks_reviewed: `SELECT COUNT(*)::int FROM task_reviews WHERE reviewed_by = $1`,
    evaluations_submitted: `SELECT COUNT(*)::int FROM peer_evaluations WHERE evaluator_id = $1`,
    calendar_events_created: `SELECT COUNT(*)::int FROM calendar_events WHERE created_by = $1`
};

async function getAllMetricValues(userId) {
    const entries = Object.entries(METRIC_QUERIES);
    const results = await Promise.all(entries.map(([, query]) => pool.query(query, [userId])));
    return Object.fromEntries(entries.map(([metric], i) => [metric, results[i].rows[0].count]));
}

// fire-and-forget achievement check - must never throw outward or block the action it's attached to.
// awards points only on an actual new insert (RETURNING check), never on a re-trigger of an already-earned achievement.
async function checkAndAwardAchievements(userId, metric) {
    try {
        const query = METRIC_QUERIES[metric];
        if (!query) return;
        const valueResult = await pool.query(query, [userId]);
        const value = valueResult.rows[0].count;
        const candidates = await pool.query(
            `SELECT achievement_id, name, points_reward FROM achievements
             WHERE metric = $1 AND threshold <= $2
             AND achievement_id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $3)`,
            [metric, value, userId]
        );
        for (const row of candidates.rows) {
            const awarded = await pool.query(
                `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)
                 ON CONFLICT (user_id, achievement_id) DO NOTHING RETURNING user_achievement_id`,
                [userId, row.achievement_id]
            );
            if (awarded.rows.length > 0 && row.points_reward > 0) {
                await pool.query(
                    `INSERT INTO points (user_id, points_earned, reason) VALUES ($1, $2, $3)`,
                    [userId, row.points_reward, `ได้รับความสำเร็จ: ${row.name}`]
                );
            }
        }
    } catch (err) {
        console.error('Error checking achievements:', err);
    }
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function censorContent(content, bannedWords) {
    let censored = content;
    const flagged = [];
    for (const word of bannedWords) {
        if (!word) continue;
        const pattern = new RegExp(escapeRegex(word), 'gi');
        if (pattern.test(content)) {
            flagged.push(word);
            censored = censored.replace(new RegExp(escapeRegex(word), 'gi'), (match) => '*'.repeat(match.length));
        }
    }
    return { censored, flagged };
}

const REPORT_TYPE_LABELS = { chat_message: 'ข้อความในแชท', user: 'ผู้ใช้งาน', file: 'ไฟล์แนบ' };

//Get banned-words moderation policy (admin only)
app.get('/api/admin/settings/banned-words', authenticateToken, async (req, res) => {
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const result = await pool.query(`SELECT value FROM system_settings WHERE key = 'banned_words'`);
        res.json({ bannedWords: result.rows[0]?.value || '' });
    } catch (err) {
        console.error('Error fetching banned words:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
});

//Update banned-words moderation policy (admin only)
app.put('/api/admin/settings/banned-words', authenticateToken, async (req, res) => {
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const bannedWords = typeof req.body.bannedWords === 'string' ? req.body.bannedWords : '';
        await pool.query(
            `INSERT INTO system_settings (key, value) VALUES ('banned_words', $1)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [bannedWords]
        );
        logActivity(req.user.userId, 'update_banned_words', null, null, req);
        res.json({ message: 'บันทึกนโยบายการคัดกรองแล้ว' });
    } catch (err) {
        console.error('Error updating banned words:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
});

//Get moderation reports (admin only), optionally filtered by status
app.get('/api/admin/reports', authenticateToken, async (req, res) => {
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const status = req.query.status;
        const params = [];
        let where = '';
        if (status) {
            params.push(status);
            where = 'WHERE r.status = $1';
        }
        const result = await pool.query(
            `SELECT r.report_id, r.type, r.target_id, r.detail, r.status, r.created_at, r.group_id,
                    u.firstname AS reporter_firstname, u.lastname AS reporter_lastname,
                    g.subject_code, g.subject_name
             FROM reports r
             JOIN users u ON u.user_id = r.reporter_id
             JOIN groups g ON g.group_id = r.group_id
             ${where}
             ORDER BY r.created_at DESC`,
            params
        );
        const rows = result.rows;

        // resolve what was actually reported: the message content (chat_message) or the reported person's name (user)
        const messageIds = rows.filter((r) => r.type === 'chat_message').map((r) => r.target_id);
        const userIds = rows.filter((r) => r.type === 'user').map((r) => r.target_id);

        const messageTargets = {};
        if (messageIds.length) {
            const msgRows = await pool.query(
                `SELECT m.message_id, m.content, u.firstname, u.lastname
                 FROM messages m JOIN users u ON u.user_id = m.user_id
                 WHERE m.message_id = ANY($1)`,
                [messageIds]
            );
            msgRows.rows.forEach((m) => { messageTargets[m.message_id] = { content: m.content, senderName: `${m.firstname} ${m.lastname}` }; });
        }
        const userTargets = {};
        if (userIds.length) {
            const userRows = await pool.query('SELECT user_id, firstname, lastname FROM users WHERE user_id = ANY($1)', [userIds]);
            userRows.rows.forEach((u) => { userTargets[u.user_id] = `${u.firstname} ${u.lastname}`; });
        }

        res.json(rows.map((r) => ({
            reportId: r.report_id,
            type: r.type,
            typeLabel: REPORT_TYPE_LABELS[r.type] || r.type,
            detail: r.detail,
            reporterName: `${r.reporter_firstname} ${r.reporter_lastname}`,
            groupLabel: `${r.subject_code} · ${r.subject_name}`,
            status: r.status,
            createdAt: r.created_at,
            targetMessageContent: r.type === 'chat_message' ? (messageTargets[r.target_id]?.content ?? '(ข้อความถูกลบแล้ว)') : null,
            targetUserName: r.type === 'chat_message'
                ? (messageTargets[r.target_id]?.senderName ?? null)
                : r.type === 'user' ? (userTargets[r.target_id] ?? '(บัญชีถูกลบแล้ว)') : null
        })));
    } catch (err) {
        console.error('Error fetching admin reports:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Resolve a moderation report (admin only) - approve or reject
app.patch('/api/admin/reports/:id', authenticateToken, async (req, res) => {
    const reportId = parseInt(req.params.id, 10);
    if (!Number.isInteger(reportId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    }
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const result = await pool.query(
            `UPDATE reports SET status = $1, resolved_by = $2, resolved_at = now() WHERE report_id = $3 RETURNING report_id`,
            [status, req.user.userId, reportId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบรายงานนี้' });
        }
        console.log('Report resolved:', reportId, '->', status, 'by', req.user.userId);
        logActivity(req.user.userId, 'resolve_report', 'report', reportId, req);
        res.json({ message: 'บันทึกผลการตรวจสอบสำเร็จ' });
    } catch (err) {
        console.error('Error resolving report:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

const USER_ROLE_VALUES = ['student', 'advisor', 'admin'];

//Get every user on the platform (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const result = await pool.query(
            `SELECT u.user_id, u.firstname, u.lastname, u.nickname, u.student_id, u.email, u.system_role, u.is_active, u.avatar_path, u.created_at,
                    COALESCE(SUM(p.points_earned), 0)::int AS points
             FROM users u
             LEFT JOIN points p ON p.user_id = u.user_id
             GROUP BY u.user_id
             ORDER BY u.firstname ASC`
        );
        res.json(result.rows.map((r) => ({
            userId: r.user_id,
            firstName: r.firstname,
            lastName: r.lastname,
            nickname: r.nickname,
            studentId: r.student_id,
            email: r.email,
            role: r.system_role,
            isActive: r.is_active,
            avatarUrl: r.avatar_path,
            createdAt: r.created_at,
            points: r.points
        })));
    } catch (err) {
        console.error('Error fetching admin user list:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Edit a user's profile fields / role / active status (admin only)
app.patch('/api/admin/users/:id', authenticateToken, async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    if (!Number.isInteger(targetUserId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { firstName, lastName, nickname, studentId, role, isActive } = req.body;
    if (role !== undefined && !USER_ROLE_VALUES.includes(role)) {
        return res.status(400).json({ error: 'บทบาทไม่ถูกต้อง' });
    }
    if (targetUserId === req.user.userId && (isActive === false || (role !== undefined && role !== 'admin'))) {
        return res.status(400).json({ error: 'ไม่สามารถปิดใช้งานหรือเปลี่ยนบทบาทของบัญชีตัวเองได้' });
    }

    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }

        const fields = [];
        const params = [];
        const addField = (column, value) => {
            params.push(value);
            fields.push(`${column} = $${params.length}`);
        };
        if (firstName !== undefined) addField('firstname', firstName.trim());
        if (lastName !== undefined) addField('lastname', lastName.trim());
        if (nickname !== undefined) addField('nickname', nickname.trim());
        if (studentId !== undefined) addField('student_id', studentId || null);
        if (role !== undefined) addField('system_role', role);
        if (isActive !== undefined) addField('is_active', isActive);

        if (fields.length === 0) {
            return res.status(400).json({ error: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });
        }

        params.push(targetUserId);
        const result = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${params.length} RETURNING user_id`,
            params
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบผู้ใช้งานนี้' });
        }

        console.log('Admin updated user:', targetUserId, 'by', req.user.userId);
        const activityAction = isActive !== undefined ? (isActive ? 'activate_user' : 'deactivate_user') : role !== undefined ? 'change_user_role' : 'admin_update_user';
        logActivity(req.user.userId, activityAction, 'user', targetUserId, req);
        res.json({ message: 'บันทึกการแก้ไขสำเร็จ' });
    } catch (err) {
        console.error('Error updating user (admin):', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get every group on the platform (admin only)
app.get('/api/admin/groups', authenticateToken, async (req, res) => {
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const result = await pool.query(
            `SELECT g.group_id, g.group_code, g.subject_code, g.subject_name, g.advisor_name, g.created_at,
                    (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.group_id) AS member_count,
                    (SELECT COUNT(*)::int FROM tasks t WHERE t.group_id = g.group_id) AS task_count
             FROM groups g
             ORDER BY g.created_at DESC`
        );
        res.json(result.rows.map((r) => ({
            groupId: r.group_id,
            groupCode: r.group_code,
            subjectCode: r.subject_code,
            subjectName: r.subject_name,
            advisorName: r.advisor_name,
            memberCount: r.member_count,
            taskCount: r.task_count,
            createdAt: r.created_at
        })));
    } catch (err) {
        console.error('Error fetching admin group list:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get one group's info + member list (admin only)
app.get('/api/admin/groups/:id', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }
        const groupResult = await pool.query(
            'SELECT group_id, group_code, subject_code, subject_name, advisor_name FROM groups WHERE group_id = $1',
            [groupId]
        );
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบกลุ่มนี้' });
        }
        const membersResult = await pool.query(
            `SELECT u.user_id, u.firstname, u.lastname, u.nickname, u.student_id, gm.role
             FROM group_members gm
             JOIN users u ON u.user_id = gm.user_id
             WHERE gm.group_id = $1
             ORDER BY gm.role = 'leader' DESC, u.firstname`,
            [groupId]
        );
        const g = groupResult.rows[0];
        res.json({
            groupId: g.group_id,
            groupCode: g.group_code,
            subjectCode: g.subject_code,
            subjectName: g.subject_name,
            advisorName: g.advisor_name,
            members: membersResult.rows.map((r) => ({
                userId: r.user_id,
                firstName: r.firstname,
                lastName: r.lastname,
                nickname: r.nickname,
                studentId: r.student_id,
                role: r.role
            }))
        });
    } catch (err) {
        console.error('Error fetching admin group detail:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get the activity/audit log, paginated (admin only)
app.get('/api/admin/activity-logs', authenticateToken, async (req, res) => {
    try {
        if (!(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงได้' });
        }

        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const before = req.query.before ? parseInt(req.query.before, 10) : null;
        const action = req.query.action || null;
        const startDate = req.query.startDate ? toUtcMidnight(req.query.startDate) : null;
        const endDate = req.query.endDate ? toUtcMidnight(req.query.endDate) : null; // exclusive upper bound, see below
        const userSearch = req.query.userSearch ? `%${req.query.userSearch.trim()}%` : null;

        const result = await pool.query(
            `SELECT al.activity_log_id, al.user_id, al.action, al.target_type, al.target_id, al.ip_address, al.created_at,
                    u.firstname, u.lastname, u.nickname
             FROM activity_logs al
             LEFT JOIN users u ON u.user_id = al.user_id
             WHERE ($1::int IS NULL OR al.activity_log_id < $1)
               AND ($2::varchar IS NULL OR al.action = $2)
               AND ($3::timestamptz IS NULL OR al.created_at >= $3)
               AND ($4::timestamptz IS NULL OR al.created_at < $4 + interval '1 day')
               AND ($5::varchar IS NULL OR u.firstname ILIKE $5 OR u.lastname ILIKE $5 OR u.nickname ILIKE $5)
             ORDER BY al.activity_log_id DESC
             LIMIT $6`,
            [before, action, startDate, endDate, userSearch, limit]
        );
        const rows = result.rows;

        const idsByType = {};
        rows.forEach((r) => {
            if (!r.target_type || !r.target_id) return;
            if (!idsByType[r.target_type]) idsByType[r.target_type] = new Set();
            idsByType[r.target_type].add(r.target_id);
        });

        const targetLabels = {};
        if (idsByType.task) {
            const taskRows = await pool.query('SELECT task_id, title FROM tasks WHERE task_id = ANY($1)', [[...idsByType.task]]);
            taskRows.rows.forEach((t) => { targetLabels[`task:${t.task_id}`] = t.title; });
        }
        if (idsByType.group) {
            const groupRows = await pool.query('SELECT group_id, subject_name FROM groups WHERE group_id = ANY($1)', [[...idsByType.group]]);
            groupRows.rows.forEach((g) => { targetLabels[`group:${g.group_id}`] = g.subject_name; });
        }
        if (idsByType.user) {
            const userRows = await pool.query('SELECT user_id, firstname, lastname FROM users WHERE user_id = ANY($1)', [[...idsByType.user]]);
            userRows.rows.forEach((u) => { targetLabels[`user:${u.user_id}`] = `${u.firstname} ${u.lastname}`; });
        }

        res.json(rows.map((r) => ({
            activityLogId: r.activity_log_id,
            userId: r.user_id,
            actorName: r.user_id ? `${r.firstname} ${r.lastname} (${r.nickname})` : '(บัญชีที่ถูกลบแล้ว)',
            action: r.action,
            targetType: r.target_type,
            targetId: r.target_id,
            targetLabel: r.target_type && r.target_id ? (targetLabels[`${r.target_type}:${r.target_id}`] || '(ถูกลบแล้ว)') : null,
            ipAddress: r.ip_address,
            createdAt: r.created_at
        })));
    } catch (err) {
        console.error('Error fetching activity logs:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

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
                    (SELECT COUNT(*)::int FROM tasks t WHERE t.group_id = g.group_id) AS task_count,
                    (SELECT COUNT(*)::int FROM tasks t WHERE t.group_id = g.group_id AND t.status = 'completed') AS completed_task_count
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
            taskCount: r.task_count,
            completedTaskCount: r.completed_task_count
        })));
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get the current user's own all-time points total (for the Dashboard "คะแนนสะสม" stat)
app.get('/api/user/me/points', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COALESCE(SUM(points_earned), 0)::int AS total_points FROM points WHERE user_id = $1',
            [req.user.userId]
        );
        res.json({ points: result.rows[0].total_points });
    } catch (err) {
        console.error('Error fetching user points:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

// resolves a leaderboard period into a 'since' timestamp (null = all-time, no filter)
function leaderboardSince(period) {
    const now = new Date();
    if (period === 'daily') {
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    }
    if (period === 'weekly') {
        const dayOfWeek = now.getUTCDay(); // 0 = Sunday
        const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek));
        return start.toISOString();
    }
    if (period === 'monthly') {
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    }
    return null;
}

//Get the university-wide points leaderboard, optionally filtered to a time period
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
    try {
        const since = leaderboardSince(req.query.period);
        const result = await pool.query(
            `SELECT u.user_id, u.firstname, u.lastname, u.student_id, u.avatar_path,
                    COALESCE(SUM(p.points_earned), 0)::int AS total_points
             FROM users u
             LEFT JOIN points p ON p.user_id = u.user_id AND ($1::timestamptz IS NULL OR p.created_at >= $1)
             WHERE u.system_role = 'student'
             GROUP BY u.user_id
             ORDER BY total_points DESC, u.firstname ASC`,
            [since]
        );
        res.json(result.rows.map((r) => ({
            userId: r.user_id,
            firstName: r.firstname,
            lastName: r.lastname,
            studentId: r.student_id,
            avatarUrl: r.avatar_path,
            points: r.total_points
        })));
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
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

//Get every task personally assigned to the current user, across all their teams, any status (for Assignments page)
app.get('/api/user/me/assigned-tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.task_id, t.group_id, t.title, t.status, t.due_date, g.subject_code, g.subject_name
             FROM tasks t
             JOIN groups g ON g.group_id = t.group_id
             WHERE t.assigned_to = $1
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
        console.error('Error fetching assigned tasks:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Get the fixed list of calendar event types (for the create-event form)
app.get('/api/event-types', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT event_type_id, name, label_th, color, icon_name FROM event_types ORDER BY event_type_id');
        res.json(result.rows.map((r) => ({
            eventTypeId: r.event_type_id,
            name: r.name,
            labelTh: r.label_th,
            color: r.color,
            iconName: r.icon_name
        })));
    } catch (err) {
        console.error('Error fetching event types:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

// resolves a 'YYYY-MM' query param (or the current month if missing/invalid) into a [start, end) UTC range
function monthRange(monthParam) {
    const now = new Date();
    let year = now.getUTCFullYear();
    let month = now.getUTCMonth() + 1;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
        const [y, m] = monthParam.split('-').map(Number);
        if (m >= 1 && m <= 12) { year = y; month = m; }
    }
    const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00Z`;
    return { start, end };
}

//Get every calendar-relevant item for the current user this month, across all their teams:
//real calendar_events plus task due dates shown as virtual "deadline" entries
app.get('/api/user/me/calendar-events', authenticateToken, async (req, res) => {
    try {
        const { start, end } = monthRange(req.query.month);

        const eventsResult = await pool.query(
            `SELECT ce.calendar_event_id, ce.group_id, ce.title, ce.event_date, ce.end_date,
                    et.label_th, et.color, g.subject_code, g.subject_name
             FROM calendar_events ce
             JOIN group_members gm ON gm.group_id = ce.group_id AND gm.user_id = $1
             JOIN event_types et ON et.event_type_id = ce.event_type_id
             JOIN groups g ON g.group_id = ce.group_id
             WHERE ce.event_date >= $2 AND ce.event_date < $3
             ORDER BY ce.event_date ASC`,
            [req.user.userId, start, end]
        );
        const deadlinesResult = await pool.query(
            `SELECT t.task_id, t.group_id, t.title, t.due_date, g.subject_code, g.subject_name
             FROM tasks t
             JOIN group_members gm ON gm.group_id = t.group_id AND gm.user_id = $1
             JOIN groups g ON g.group_id = t.group_id
             WHERE t.due_date >= $2 AND t.due_date < $3
             ORDER BY t.due_date ASC`,
            [req.user.userId, start, end]
        );

        const events = eventsResult.rows.map((r) => ({
            kind: 'event',
            id: r.calendar_event_id,
            groupId: r.group_id,
            groupLabel: `${r.subject_code} · ${r.subject_name}`,
            title: r.title,
            date: r.event_date.toISOString().slice(0, 10),
            endDate: r.end_date ? r.end_date.toISOString().slice(0, 10) : null,
            label: r.label_th,
            color: r.color
        }));
        const deadlines = deadlinesResult.rows.map((r) => ({
            kind: 'deadline',
            id: r.task_id,
            taskId: r.task_id,
            groupId: r.group_id,
            groupLabel: `${r.subject_code} · ${r.subject_name}`,
            title: r.title,
            date: r.due_date.toISOString().slice(0, 10),
            endDate: null,
            label: 'กำหนดส่งงาน',
            color: '#DC2626'
        }));

        const merged = [...events, ...deadlines].sort((a, b) => a.date.localeCompare(b.date));
        res.json(merged);
    } catch (err) {
        console.error('Error fetching calendar events:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Create a calendar event for a group (leader only)
app.post('/api/group/:id/calendar-events', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { title, eventDate, endDate, eventTypeId } = req.body;
    if (!title || !title.trim() || title.trim().length > 200) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อกิจกรรมให้ถูกต้อง (ไม่เกิน 200 ตัวอักษร)' });
    }
    if (!eventDate || Number.isNaN(Date.parse(eventDate))) {
        return res.status(400).json({ error: 'กรุณาเลือกวันที่ให้ถูกต้อง' });
    }
    const eventTypeIdInt = parseInt(eventTypeId, 10);
    if (!Number.isInteger(eventTypeIdInt)) {
        return res.status(400).json({ error: 'กรุณาเลือกประเภทกิจกรรม' });
    }

    try {
        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่เพิ่มกิจกรรมได้' });
        }
        const typeCheck = await pool.query('SELECT 1 FROM event_types WHERE event_type_id = $1', [eventTypeIdInt]);
        if (typeCheck.rows.length === 0) {
            return res.status(400).json({ error: 'ประเภทกิจกรรมไม่ถูกต้อง' });
        }

        const result = await pool.query(
            `INSERT INTO calendar_events (group_id, title, event_date, end_date, event_type_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING calendar_event_id`,
            [groupId, title.trim(), toUtcMidnight(eventDate), endDate ? toUtcMidnight(endDate) : null, eventTypeIdInt, req.user.userId]
        );

        console.log('Calendar event created:', result.rows[0].calendar_event_id, 'in group', groupId);
        logActivity(req.user.userId, 'create_calendar_event', 'group', groupId, req);
        checkAndAwardAchievements(req.user.userId, 'calendar_events_created');
        res.status(201).json({ message: 'เพิ่มกิจกรรมสำเร็จ', calendarEventId: result.rows[0].calendar_event_id });
    } catch (err) {
        console.error('Error creating calendar event:', err);
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

//Get my peer-evaluation progress + given evaluations + (gated) received results for this group
app.get('/api/group/:id/evaluations/me', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        if (!(await isGroupMember(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }

        const memberCountResult = await pool.query('SELECT COUNT(*)::int AS c FROM group_members WHERE group_id = $1', [groupId]);
        const total = Math.max(memberCountResult.rows[0].c - 1, 0);

        const givenResult = await pool.query(
            `SELECT pe.evaluatee_id, pe.comment, pes.criterion, pes.score
             FROM peer_evaluations pe
             JOIN peer_evaluation_scores pes ON pes.peer_evaluation_id = pe.peer_evaluation_id
             WHERE pe.group_id = $1 AND pe.evaluator_id = $2`,
            [groupId, req.user.userId]
        );
        const givenMap = new Map();
        for (const row of givenResult.rows) {
            if (!givenMap.has(row.evaluatee_id)) givenMap.set(row.evaluatee_id, { evaluateeId: row.evaluatee_id, comment: row.comment, scores: {} });
            givenMap.get(row.evaluatee_id).scores[row.criterion] = row.score;
        }
        const given = [...givenMap.values()];
        const completed = given.length;
        const isComplete = total === 0 || completed >= total;

        let received = null;
        if (isComplete) {
            const avgResult = await pool.query(
                `SELECT pes.criterion, ROUND(AVG(pes.score)::numeric, 2) AS avg_score
                 FROM peer_evaluations pe
                 JOIN peer_evaluation_scores pes ON pes.peer_evaluation_id = pe.peer_evaluation_id
                 WHERE pe.group_id = $1 AND pe.evaluatee_id = $2
                 GROUP BY pes.criterion`,
                [groupId, req.user.userId]
            );
            const commentsResult = await pool.query(
                `SELECT pe.comment, pe.peer_evaluation_id
                 FROM peer_evaluations pe
                 WHERE pe.group_id = $1 AND pe.evaluatee_id = $2`,
                [groupId, req.user.userId]
            );
            const averages = {};
            avgResult.rows.forEach((r) => { averages[r.criterion] = Number(r.avg_score); });
            const comments = commentsResult.rows.map((r) => r.comment).filter((c) => c && c.trim());
            for (let i = comments.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [comments[i], comments[j]] = [comments[j], comments[i]];
            }
            received = { evaluatorCount: commentsResult.rows.length, averages, comments };
        }

        res.json({ progress: { total, completed, isComplete }, given, received });
    } catch (err) {
        console.error('Error fetching my peer evaluations:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

//Give / update peer evaluations for every other teammate at once (upsert, all-or-nothing)
app.post('/api/group/:id/evaluations', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }

    const CRITERIA = ['responsibility', 'quality', 'communication', 'punctuality', 'teamwork'];
    const { evaluations } = req.body;
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
        return res.status(400).json({ error: 'กรุณาให้คะแนนเพื่อนร่วมทีมก่อนบันทึก' });
    }
    const invalidEntry = evaluations.some((e) =>
        !Number.isInteger(e.evaluateeId) || e.evaluateeId === req.user.userId || !e.scores ||
        CRITERIA.some((c) => !Number.isInteger(e.scores[c]) || e.scores[c] < 1 || e.scores[c] > 5)
    );
    if (invalidEntry) {
        return res.status(400).json({ error: 'กรุณาให้คะแนนครบทุกหัวข้อ (1-5 คะแนน)' });
    }

    const client = await pool.connect();
    try {
        if (!(await isGroupMember(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }

        const membersResult = await pool.query('SELECT user_id FROM group_members WHERE group_id = $1', [groupId]);
        const expectedIds = new Set(membersResult.rows.map((r) => r.user_id).filter((id) => id !== req.user.userId));
        const submittedIds = new Set(evaluations.map((e) => e.evaluateeId));
        const sameSize = expectedIds.size === submittedIds.size;
        const sameMembers = sameSize && [...expectedIds].every((id) => submittedIds.has(id));
        if (!sameMembers) {
            return res.status(400).json({ error: 'รายชื่อสมาชิกมีการเปลี่ยนแปลง กรุณาโหลดหน้าใหม่' });
        }

        await client.query('BEGIN');
        for (const e of evaluations) {
            const comment = (e.comment || '').trim() || null;
            const peResult = await client.query(
                `INSERT INTO peer_evaluations (group_id, evaluator_id, evaluatee_id, comment)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (group_id, evaluator_id, evaluatee_id) DO UPDATE SET comment = EXCLUDED.comment
                 RETURNING peer_evaluation_id`,
                [groupId, req.user.userId, e.evaluateeId, comment]
            );
            const peId = peResult.rows[0].peer_evaluation_id;
            await client.query(
                `INSERT INTO peer_evaluation_scores (peer_evaluation_id, criterion, score) VALUES
                   ($1, 'responsibility', $2), ($1, 'quality', $3), ($1, 'communication', $4),
                   ($1, 'punctuality', $5), ($1, 'teamwork', $6)
                 ON CONFLICT (peer_evaluation_id, criterion) DO UPDATE SET score = EXCLUDED.score`,
                [peId, e.scores.responsibility, e.scores.quality, e.scores.communication, e.scores.punctuality, e.scores.teamwork]
            );
        }
        await client.query('COMMIT');

        console.log('Peer evaluations saved:', req.user.userId, '->', [...submittedIds].join(','), 'in group', groupId);
        logActivity(req.user.userId, 'submit_peer_evaluation', 'group', groupId, req);
        checkAndAwardAchievements(req.user.userId, 'evaluations_submitted');
        res.json({ message: 'บันทึกการประเมินทั้งหมดสำเร็จ' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saving peer evaluations:', err);
        if (err.code === '23514') {
            return res.status(400).json({ error: 'ไม่สามารถประเมินตัวเองได้' });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } finally {
        client.release();
    }
});

//Team-wide peer evaluation summary (leader only, gated on the leader's own progress)
app.get('/api/group/:id/evaluations/summary', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    try {
        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่ดูภาพรวมคะแนนทีมได้' });
        }

        const memberCountResult = await pool.query('SELECT COUNT(*)::int AS c FROM group_members WHERE group_id = $1', [groupId]);
        const total = Math.max(memberCountResult.rows[0].c - 1, 0);
        const myGivenResult = await pool.query(
            'SELECT COUNT(DISTINCT evaluatee_id)::int AS c FROM peer_evaluations WHERE group_id = $1 AND evaluator_id = $2',
            [groupId, req.user.userId]
        );
        const completed = myGivenResult.rows[0].c;
        const isUnlocked = total === 0 || completed >= total;
        if (!isUnlocked) {
            return res.json({ isUnlocked: false, progress: { total, completed }, members: [] });
        }

        const avgResult = await pool.query(
            `SELECT gm.user_id AS evaluatee_id, pes.criterion, ROUND(AVG(pes.score)::numeric, 2) AS avg_score
             FROM group_members gm
             LEFT JOIN peer_evaluations pe ON pe.evaluatee_id = gm.user_id AND pe.group_id = gm.group_id
             LEFT JOIN peer_evaluation_scores pes ON pes.peer_evaluation_id = pe.peer_evaluation_id
             WHERE gm.group_id = $1
             GROUP BY gm.user_id, pes.criterion`,
            [groupId]
        );
        const countResult = await pool.query(
            `SELECT gm.user_id AS evaluatee_id, COUNT(DISTINCT pe.evaluator_id)::int AS evaluator_count
             FROM group_members gm
             LEFT JOIN peer_evaluations pe ON pe.evaluatee_id = gm.user_id AND pe.group_id = gm.group_id
             WHERE gm.group_id = $1
             GROUP BY gm.user_id`,
            [groupId]
        );
        const commentsResult = await pool.query(
            `SELECT evaluatee_id, comment FROM peer_evaluations WHERE group_id = $1 AND comment IS NOT NULL AND comment <> ''`,
            [groupId]
        );
        const byUser = new Map(countResult.rows.map((r) => [r.evaluatee_id, { userId: r.evaluatee_id, evaluatorCount: r.evaluator_count, averages: {}, comments: [] }]));
        avgResult.rows.forEach((r) => {
            if (r.criterion == null) return;
            byUser.get(r.evaluatee_id).averages[r.criterion] = Number(r.avg_score);
        });
        commentsResult.rows.forEach((r) => {
            const entry = byUser.get(r.evaluatee_id);
            if (entry) entry.comments.push(r.comment);
        });
        // shuffle each member's comments so ordering can never be correlated with evaluator identity
        byUser.forEach((entry) => {
            for (let i = entry.comments.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [entry.comments[i], entry.comments[j]] = [entry.comments[j], entry.comments[i]];
            }
        });

        res.json({ isUnlocked: true, progress: { total, completed }, members: [...byUser.values()] });
    } catch (err) {
        console.error('Error fetching team evaluation summary:', err);
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
        const isAdminCaller = await isAdmin(req.user.userId);
        if (!isLeaderCaller && !isSelf && !isAdminCaller) {
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
        logActivity(req.user.userId, isSelf ? 'leave_group' : 'kick_member', 'group', groupId, req);
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

        if (!(await isGroupLeader(req.user.userId, groupId)) && !(await isAdmin(req.user.userId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมหรือผู้ดูแลระบบเท่านั้นที่ลบกลุ่มได้' });
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
        logActivity(req.user.userId, 'delete_group', 'group', groupId, req);
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

const REPORT_TYPE_VALUES = ['chat_message', 'user'];

//Submit a moderation report (chat message or user) - feeds the admin moderation queue
app.post('/api/group/:id/reports', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.id, 10);
    if (!Number.isInteger(groupId)) {
        return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
    }
    const { type, targetId, detail } = req.body;
    if (!REPORT_TYPE_VALUES.includes(type)) {
        return res.status(400).json({ error: 'ประเภทการรายงานไม่ถูกต้อง' });
    }
    const targetIdInt = parseInt(targetId, 10);
    if (!Number.isInteger(targetIdInt)) {
        return res.status(400).json({ error: 'ไม่พบสิ่งที่ต้องการรายงาน' });
    }
    if (type === 'user' && targetIdInt === req.user.userId) {
        return res.status(400).json({ error: 'ไม่สามารถรายงานตัวเองได้' });
    }

    try {
        if (!(await isGroupMember(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'คุณไม่ใช่สมาชิกของกลุ่มนี้' });
        }

        const result = await pool.query(
            `INSERT INTO reports (type, group_id, reporter_id, target_id, detail)
             VALUES ($1, $2, $3, $4, $5) RETURNING report_id`,
            [type, groupId, req.user.userId, targetIdInt, (detail || '').trim() || null]
        );

        console.log('Report submitted:', result.rows[0].report_id, 'type', type, 'by', req.user.userId);
        logActivity(req.user.userId, 'submit_report', 'report', result.rows[0].report_id, req);
        res.status(201).json({ message: 'ส่งรายงานสำเร็จ ทีมงานจะตรวจสอบโดยเร็วที่สุด' });
    } catch (err) {
        console.error('Error submitting report:', err);
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
        logActivity(req.user.userId, 'create_task', 'task', task.task_id, req);
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
        logActivity(req.user.userId, 'update_task', 'task', task.task_id, req);
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
        logActivity(req.user.userId, 'delete_task', 'task', taskId, req);
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
                logActivity(req.user.userId, 'upload_attachment', 'task', taskId, req);
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
        logActivity(req.user.userId, 'delete_attachment', 'task', taskId, req);
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
        logActivity(req.user.userId, 'start_task', 'task', taskId, req);
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
        logActivity(req.user.userId, 'submit_task', 'task', taskId, req);
        checkAndAwardAchievements(req.user.userId, 'tasks_submitted');
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
        const taskResult = await pool.query('SELECT group_id, status FROM tasks WHERE task_id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบงานนี้' });
        }
        const { group_id: groupId, status: taskStatus } = taskResult.rows[0];

        if (!(await isGroupLeader(req.user.userId, groupId))) {
            return res.status(403).json({ error: 'เฉพาะหัวหน้าทีมเท่านั้นที่ตรวจงานได้' });
        }

        if (taskStatus !== 'under_review') {
            return res.status(400).json({ error: 'งานนี้ไม่ได้อยู่ในสถานะรอตรวจ (อาจถูกตรวจไปแล้ว หรือยังไม่ได้ส่งงาน)' });
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
        logActivity(req.user.userId, 'review_task', 'task', taskId, req);
        checkAndAwardAchievements(req.user.userId, 'tasks_reviewed');
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

