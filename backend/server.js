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

app.get('/api/group/data', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT g.group_id, g.group_code, g.subject_code, g.subject_name, g.advisor_name, gm.role,
                    (SELECT COUNT(*)::int FROM group_members gm2 WHERE gm2.group_id = g.group_id) AS member_count
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
            memberCount: r.member_count
        })));
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});




server.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});