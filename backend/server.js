const express = require('express');
const http = require("http");
const cors = require('cors');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
        res.json({ token, userId: user.user_id, nickname: user.nickname, studentId: user.student_id, role: user.system_role, message: 'เข้าสู่ระบบสำเร็จ' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
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




server.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});