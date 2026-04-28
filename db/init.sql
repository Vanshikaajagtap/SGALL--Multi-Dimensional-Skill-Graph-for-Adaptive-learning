-- ============================================================
--  SkillWeave — Database Initialization Script
--  PostgreSQL 16+
--  Includes: DDL, Triggers, Stored Functions, Seed Data
-- ============================================================

-- ---- CLEAN SLATE ----
DROP TRIGGER IF EXISTS trg_auto_gap ON ATTEMPTS;
DROP FUNCTION IF EXISTS auto_detect_gap();
DROP FUNCTION IF EXISTS find_root_cause(INT, INT);
DROP TABLE IF EXISTS KNOWLEDGEGAP;
DROP TABLE IF EXISTS ATTEMPTS;
DROP TABLE IF EXISTS PREREQUISITES;
DROP TABLE IF EXISTS CONCEPT;
DROP TABLE IF EXISTS STUDENT;

-- ============================================================
--  1. DDL — TABLE DEFINITIONS (5NF)
-- ============================================================

CREATE TABLE STUDENT (
    student_id     SERIAL PRIMARY KEY,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL DEFAULT '$2b$12$LJ3m4ys3Lk0TSwHBQbCdue0mZr.fz8Er6BNcvGS7YMfIkPfSMXKMi',  -- default: "password123"
    contact_no     BIGINT,
    degree_program VARCHAR(50),
    study_year     INT CHECK (study_year BETWEEN 1 AND 4),
    dob            DATE NOT NULL
);

CREATE TABLE CONCEPT (
    concept_id   SERIAL PRIMARY KEY,
    concept_name VARCHAR(100) NOT NULL,
    difficulty   VARCHAR(20) CHECK (difficulty IN ('Beginner','Intermediate','Advanced'))
);

CREATE TABLE PREREQUISITES (
    parent_id INT,
    child_id  INT,
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY (parent_id) REFERENCES CONCEPT(concept_id) ON DELETE CASCADE,
    FOREIGN KEY (child_id)  REFERENCES CONCEPT(concept_id) ON DELETE CASCADE
);

CREATE TABLE ATTEMPTS (
    attempt_id        SERIAL PRIMARY KEY,
    student_id        INT NOT NULL,
    concept_id        INT NOT NULL,
    score             DECIMAL(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    time_spent_mins   INT,
    attempt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES CONCEPT(concept_id) ON DELETE CASCADE
);

CREATE TABLE KNOWLEDGEGAP (
    gap_id      SERIAL PRIMARY KEY,
    student_id  INT NOT NULL,
    concept_id  INT NOT NULL,
    severity    VARCHAR(20) CHECK (severity IN ('Critical','Warning')),
    detected_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES CONCEPT(concept_id) ON DELETE CASCADE,
    UNIQUE (student_id, concept_id)
);

-- ============================================================
--  2. TRIGGER — Automated Knowledge Gap Detection
--     Fires after every INSERT on ATTEMPTS.
--     score < 35 → 'Critical'
--     score < 50 → 'Warning'
--     score >= 50 → remove any existing gap for this pair
-- ============================================================

CREATE OR REPLACE FUNCTION auto_detect_gap()
RETURNS TRIGGER AS $$
DECLARE
    v_severity VARCHAR(20);
BEGIN
    IF NEW.score < 35 THEN
        v_severity := 'Critical';
    ELSIF NEW.score < 50 THEN
        v_severity := 'Warning';
    ELSE
        -- Student passed; clear any prior gap
        DELETE FROM KNOWLEDGEGAP
        WHERE student_id = NEW.student_id
          AND concept_id = NEW.concept_id;
        RETURN NEW;
    END IF;

    -- Upsert: insert or escalate severity
    INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity, detected_on)
    VALUES (NEW.student_id, NEW.concept_id, v_severity, CURRENT_TIMESTAMP)
    ON CONFLICT (student_id, concept_id)
    DO UPDATE SET severity    = EXCLUDED.severity,
                  detected_on = EXCLUDED.detected_on;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_gap
AFTER INSERT ON ATTEMPTS
FOR EACH ROW
EXECUTE FUNCTION auto_detect_gap();

-- ============================================================
--  3. STORED FUNCTION — Root-Cause Traversal (Recursive CTE)
--     Given a student and a concept, walk UP the prerequisite
--     chain and find the highest-order unmastered prerequisite.
-- ============================================================

CREATE OR REPLACE FUNCTION find_root_cause(
    p_student_id INT,
    p_concept_id INT
)
RETURNS TABLE (
    concept_id   INT,
    concept_name VARCHAR(100),
    difficulty   VARCHAR(20),
    best_score   DECIMAL(5,2),
    depth        INT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE prereq_chain AS (
        -- Anchor: the concept itself
        SELECT
            c.concept_id,
            c.concept_name,
            c.difficulty,
            0 AS depth
        FROM CONCEPT c
        WHERE c.concept_id = p_concept_id

        UNION ALL

        -- Recursive: walk to parents
        SELECT
            c.concept_id,
            c.concept_name,
            c.difficulty,
            pc.depth + 1
        FROM prereq_chain pc
        JOIN PREREQUISITES p ON p.child_id = pc.concept_id
        JOIN CONCEPT c ON c.concept_id = p.parent_id
    )
    SELECT
        pc.concept_id,
        pc.concept_name,
        pc.difficulty,
        (
            SELECT MAX(a.score)
            FROM ATTEMPTS a
            WHERE a.student_id = p_student_id
              AND a.concept_id = pc.concept_id
        ) AS best_score,
        pc.depth
    FROM prereq_chain pc
    ORDER BY pc.depth DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  4. SEED DATA
-- ============================================================

-- ---- STUDENTS (10 rows) ----
INSERT INTO STUDENT (student_id, first_name, last_name, email, contact_no, degree_program, study_year, dob) VALUES
(1,  'Aryan',  'Khan',   'aryan.k@srm.edu',  9876543210, 'B.Tech AI/ML', 2, '2004-05-10'),
(2,  'Priya',  'Sharma', 'priya.s@srm.edu',  9876543211, 'B.Tech AI/ML', 2, '2004-08-22'),
(3,  'Rohan',  'Mehta',  'rohan.m@srm.edu',  9876543212, 'B.Tech CS',    3, '2003-11-15'),
(4,  'Sneha',  'Iyer',   'sneha.i@srm.edu',  9876543213, 'B.Tech AI/ML', 1, '2005-02-28'),
(5,  'Vikram', 'Nair',   'vikram.n@srm.edu', 9876543214, 'B.Tech CS',    3, '2003-07-04'),
(6,  'Aisha',  'Patel',  'aisha.p@srm.edu',  9876543215, 'B.Tech AI/ML', 2, '2004-12-01'),
(7,  'Dev',    'Gupta',  'dev.g@srm.edu',    9876543216, 'B.Tech CS',    4, '2002-09-18'),
(8,  'Meera',  'Reddy',  'meera.r@srm.edu',  9876543217, 'B.Tech AI/ML', 1, '2005-04-14'),
(9,  'Karan',  'Singh',  'karan.s@srm.edu',  9876543218, 'B.Tech CS',    2, '2004-06-30'),
(10, 'Tanvi',  'Joshi',  'tanvi.j@srm.edu',  9876543219, 'B.Tech AI/ML', 3, '2003-03-25');

-- Reset sequence after explicit IDs
SELECT setval('student_student_id_seq', 10);

-- ---- CONCEPTS (14 nodes) ----
INSERT INTO CONCEPT (concept_id, concept_name, difficulty) VALUES
(101, 'Linear Algebra',                'Beginner'),
(102, 'Calculus',                      'Beginner'),
(103, 'Python Programming',            'Beginner'),
(104, 'Probability & Statistics',      'Beginner'),
(105, 'Discrete Mathematics',          'Beginner'),
(106, 'Data Structures',               'Intermediate'),
(107, 'Data Preprocessing',            'Intermediate'),
(108, 'SQL & Databases',               'Intermediate'),
(109, 'Machine Learning Fundamentals', 'Intermediate'),
(110, 'Neural Networks',               'Advanced'),
(111, 'Deep Learning',                 'Advanced'),
(112, 'Computer Vision',               'Advanced'),
(113, 'Natural Language Processing',   'Advanced'),
(114, 'Reinforcement Learning',        'Advanced');

SELECT setval('concept_concept_id_seq', 114);

-- ---- PREREQUISITES (DAG edges) ----
INSERT INTO PREREQUISITES VALUES
(103, 106),
(105, 106),
(101, 109),
(102, 109),
(104, 109),
(106, 109),
(107, 109),
(101, 110),
(102, 110),
(109, 110),
(110, 111),
(111, 112),
(111, 113),
(109, 114),
(104, 114);

-- ---- ATTEMPTS (50 rows) ----
-- NOTE: The trigger trg_auto_gap will auto-generate KNOWLEDGEGAP rows

INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES
(1,  101, 82.00, 60),
(1,  102, 75.00, 55),
(1,  109, 68.00, 90),
(1,  110, 38.00, 70),
(1,  110, 45.00, 80),
(2,  101, 91.00, 50),
(2,  102, 88.00, 45),
(2,  104, 85.00, 40),
(2,  109, 90.00, 80),
(2,  110, 87.00, 75),
(2,  111, 82.00, 90),
(3,  101, 42.00, 65),
(3,  102, 55.00, 60),
(3,  109, 44.00, 95),
(3,  110, 32.00, 85),
(4,  101, 70.00, 55),
(4,  103, 78.00, 50),
(4,  105, 65.00, 45),
(5,  103, 88.00, 40),
(5,  106, 72.00, 65),
(5,  107, 48.00, 70),
(5,  109, 60.00, 90),
(5,  112, 35.00, 80),
(6,  101, 79.00, 60),
(6,  104, 83.00, 55),
(6,  107, 77.00, 50),
(6,  109, 74.00, 85),
(6,  110, 66.00, 90),
(7,  109, 92.00, 70),
(7,  110, 89.00, 75),
(7,  111, 91.00, 85),
(7,  112, 86.00, 80),
(7,  113, 84.00, 90),
(8,  101, 60.00, 70),
(8,  102, 43.00, 65),
(8,  103, 72.00, 50),
(9,  101, 58.00, 55),
(9,  104, 62.00, 60),
(9,  106, 55.00, 65),
(9,  109, 47.00, 95),
(9,  109, 53.00, 85),
(10, 101, 85.00, 50),
(10, 102, 80.00, 45),
(10, 109, 88.00, 75),
(10, 110, 81.00, 80),
(10, 111, 76.00, 85),
(10, 113, 79.00, 90);
