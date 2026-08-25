version 1.0

CREATE TYPE user_role         AS ENUM ('student', 'advisor', 'admin');
CREATE TYPE group_role        AS ENUM ('leader', 'member');
CREATE TYPE task_status       AS ENUM ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE review_status     AS ENUM ('pending', 'approved', 'rejected', 'revision_requested');
CREATE TYPE notification_type AS ENUM ('new_task', 'new_message', 'due_date_reminder', 'evaluation');
CREATE TYPE report_type AS ENUM ('chat_message', 'user', 'file');
CREATE TYPE eval_criterion AS ENUM (
    'responsibility', 'quality', 'communication', 'punctuality', 'teamwork'
);

CREATE TABLE gender (
    gender_id   SERIAL PRIMARY KEY,
    gender_type VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE skills (
    skill_id   SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE event_types (
    event_type_id SERIAL PRIMARY KEY,
    name          VARCHAR(50) NOT NULL UNIQUE,
    label_th      VARCHAR(100) NOT NULL,
    color         VARCHAR(20),
    icon_name     VARCHAR(50)
);

CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    gender_id     INTEGER REFERENCES gender(gender_id) ON DELETE SET NULL,
    system_role   user_role NOT NULL DEFAULT 'student',
    avatar_path   VARCHAR(255),
	student_id    VARCHAR(20) UNIQUE,
    firstname     VARCHAR(100) NOT NULL,
    lastname      VARCHAR(100) NOT NULL,
    nickname      VARCHAR(50) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    birth_date    DATE,
    phone         VARCHAR(20),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active     BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE user_skills (
    user_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE groups (
    group_id     SERIAL PRIMARY KEY,
    group_code   VARCHAR(20) NOT NULL UNIQUE,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    advisor_name VARCHAR(150),
    created_by   INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
    group_member_id SERIAL PRIMARY KEY,
    group_id        INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role            group_role NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (group_id, user_id)
);

CREATE TABLE tasks (
    task_id     SERIAL PRIMARY KEY,
    group_id    INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    assigned_to INTEGER REFERENCES users(user_id) ON DELETE RESTRICT,
    due_date    TIMESTAMPTZ,
    status      task_status NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_attachments (
    task_attachment_id SERIAL PRIMARY KEY,
    task_id            INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    file_name          VARCHAR(255) NOT NULL,
    file_path          TEXT NOT NULL,
    uploaded_by        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_submissions (
    task_id      INTEGER PRIMARY KEY REFERENCES tasks(task_id) ON DELETE CASCADE,
    submitted_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    note         TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_reviews (
    task_review_id SERIAL PRIMARY KEY,
    task_id        INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    reviewed_by    INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    review_status  review_status NOT NULL DEFAULT 'pending',
    comment        TEXT,
    reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    group_id   INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    content    TEXT NOT NULL,
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE points (
    point_id      SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id      INTEGER REFERENCES groups(group_id) ON DELETE CASCADE,
    task_id       INTEGER REFERENCES tasks(task_id) ON DELETE SET NULL,
    points_earned INTEGER NOT NULL,
    reason        VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE peer_evaluations (
    peer_evaluation_id SERIAL PRIMARY KEY,
    group_id     INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    evaluator_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    evaluatee_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (evaluator_id <> evaluatee_id),
    UNIQUE (group_id, evaluator_id, evaluatee_id)
);

CREATE TABLE peer_evaluation_scores (
    peer_evaluation_id INTEGER NOT NULL REFERENCES peer_evaluations(peer_evaluation_id) ON DELETE CASCADE,
    criterion           eval_criterion NOT NULL,
    score                SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
    PRIMARY KEY (peer_evaluation_id, criterion)
);

CREATE TABLE calendar_events (
    calendar_event_id SERIAL PRIMARY KEY,
    group_id          INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    title             VARCHAR(200) NOT NULL,
    event_date        TIMESTAMPTZ NOT NULL,
	end_date          TIMESTAMPTZ,
    event_type_id     INTEGER NOT NULL REFERENCES event_types(event_type_id) ON DELETE RESTRICT,
    created_by        INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_settings (
    notification_setting_id SERIAL PRIMARY KEY,
    user_id                  INTEGER NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    new_task                 BOOLEAN NOT NULL DEFAULT TRUE,
    new_message               BOOLEAN NOT NULL DEFAULT TRUE,
    due_date_reminder         BOOLEAN NOT NULL DEFAULT TRUE,
    evaluation                 BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type             notification_type NOT NULL,
    title            VARCHAR(200) NOT NULL,
    message          TEXT NOT NULL,
    target_type      VARCHAR(50),
    target_id        INTEGER,
    is_read          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
    activity_log_id SERIAL PRIMARY KEY,
    user_id          INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action           VARCHAR(100) NOT NULL,
    target_type      VARCHAR(50),
    target_id        INTEGER,
    ip_address       INET,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system_settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE reports (
    report_id    SERIAL PRIMARY KEY,
    type         report_type NOT NULL,
    group_id     INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    reporter_id  INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_id    INTEGER,
    detail       TEXT,
    status       review_status NOT NULL DEFAULT 'pending',
    resolved_by  INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE achievements (
    achievement_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    img_path VARCHAR(255),
    metric VARCHAR(50) NOT NULL,
    threshold INTEGER NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE user_achievements (
    user_achievement_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

INSERT INTO gender (gender_type) VALUES
('ชาย'),
('หญิง'),
('ไม่ระบุ');

INSERT INTO event_types (name, label_th, color, icon_name) VALUES
('meeting', 'ประชุม', '#2563EB', 'people'),
('presentation', 'นำเสนอ/เดโม', '#16A34A', 'calendar'),
('workshop', 'เวิร์กช็อป', '#8B5CF6', 'time'),
('other', 'อื่นๆ', '#6B7280', 'calendar');

INSERT INTO skills (skill_name) VALUES
('Frontend'), ('Backend'), ('UI/UX Design'), ('Database'), ('DevOps'), ('AI/ML'),
('Presentation'), ('Documentation'), ('Testing'), ('Project Management'),
('Data Science'), ('Mobile Application'), ('Python'), ('Java'), ('C#'), ('C++'), ('C'),
('Software'), ('Cyber Security');

INSERT INTO achievements (name, description, metric, threshold, points_reward) VALUES
('นักสำรวจทีม', 'เข้าร่วมกลุ่มครบ 5 กลุ่ม', 'groups_joined', 5, 20),
('นักส่งงานมือใหม่', 'ส่งงานสำเร็จครบ 5 ครั้ง', 'tasks_submitted', 5, 25),
('นักส่งงานตัวยง', 'ส่งงานสำเร็จครบ 25 ครั้ง', 'tasks_submitted', 25, 100),
('หัวหน้าทีมตัวจริง', 'ตรวจงานครบ 10 ครั้ง', 'tasks_reviewed', 10, 50),
('นักประเมินผล', 'ประเมินเพื่อนร่วมทีมครบ 5 ครั้ง', 'evaluations_submitted', 5, 25),
('นักวางแผน', 'สร้างกิจกรรมในปฏิทินครบ 5 ครั้ง', 'calendar_events_created', 5, 20);




CREATE INDEX idx_users_gender_id ON users(gender_id);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_points_group_id ON points(group_id);
CREATE INDEX idx_points_task_id ON points(task_id);
CREATE INDEX idx_peer_evaluations_group_id ON peer_evaluations(group_id);
CREATE INDEX idx_peer_evaluations_evaluatee_id ON peer_evaluations(evaluatee_id);
CREATE INDEX idx_calendar_events_group_id ON calendar_events(group_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_target ON activity_logs(target_type, target_id);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_achievements_metric ON achievements(metric);
 
COMMIT;
