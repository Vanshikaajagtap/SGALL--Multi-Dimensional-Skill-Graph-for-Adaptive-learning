DROP TABLE IF EXISTS KNOWLEDGEGAP;
DROP TABLE IF EXISTS ATTEMPTS;
DROP TABLE IF EXISTS PREREQUISITES;
DROP TABLE IF EXISTS CONCEPT;
DROP TABLE IF EXISTS STUDENT;

 
CREATE TABLE STUDENT (
    student_id     INT PRIMARY KEY,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    contact_no     BIGINT,
    degree_program VARCHAR(50),
    study_year     INT CHECK (study_year BETWEEN 1 AND 4),
    dob            DATE NOT NULL
);

CREATE TABLE CONCEPT (
    concept_id   INT PRIMARY KEY,
    concept_name VARCHAR(100) NOT NULL,
    difficulty   VARCHAR(20) CHECK (difficulty IN ('Beginner','Intermediate','Advanced'))
);

CREATE TABLE PREREQUISITES (
    parent_id INT,
    child_id  INT,
    PRIMARY KEY (parent_id, child_id),
    FOREIGN KEY (parent_id) REFERENCES CONCEPT(concept_id),
    FOREIGN KEY (child_id)  REFERENCES CONCEPT(concept_id)
);

CREATE TABLE ATTEMPTS (
    attempt_id        SERIAL PRIMARY KEY,
    student_id        INT,
    concept_id        INT,
    score             DECIMAL(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    time_spent_mins   INT,
    attempt_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (concept_id) REFERENCES CONCEPT(concept_id)
);

CREATE TABLE KNOWLEDGEGAP (
    gap_id      SERIAL PRIMARY KEY,
    student_id  INT,
    concept_id  INT,
    severity    VARCHAR(20) CHECK (severity IN ('Critical','Warning')),
    detected_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (concept_id) REFERENCES CONCEPT(concept_id)
);
 
-- ---- STUDENTS (10 rows) ----
INSERT INTO STUDENT VALUES (1,  'Aryan',  'Khan',   'aryan.k@srm.edu',  9876543210, 'B.Tech AI/ML', 2, '2004-05-10');
INSERT INTO STUDENT VALUES (2,  'Priya',  'Sharma', 'priya.s@srm.edu',  9876543211, 'B.Tech AI/ML', 2, '2004-08-22');
INSERT INTO STUDENT VALUES (3,  'Rohan',  'Mehta',  'rohan.m@srm.edu',  9876543212, 'B.Tech CS',    3, '2003-11-15');
INSERT INTO STUDENT VALUES (4,  'Sneha',  'Iyer',   'sneha.i@srm.edu',  9876543213, 'B.Tech AI/ML', 1, '2005-02-28');
INSERT INTO STUDENT VALUES (5,  'Vikram', 'Nair',   'vikram.n@srm.edu', 9876543214, 'B.Tech CS',    3, '2003-07-04');
INSERT INTO STUDENT VALUES (6,  'Aisha',  'Patel',  'aisha.p@srm.edu',  9876543215, 'B.Tech AI/ML', 2, '2004-12-01');
INSERT INTO STUDENT VALUES (7,  'Dev',    'Gupta',  'dev.g@srm.edu',    9876543216, 'B.Tech CS',    4, '2002-09-18');
INSERT INTO STUDENT VALUES (8,  'Meera',  'Reddy',  'meera.r@srm.edu',  9876543217, 'B.Tech AI/ML', 1, '2005-04-14');
INSERT INTO STUDENT VALUES (9,  'Karan',  'Singh',  'karan.s@srm.edu',  9876543218, 'B.Tech CS',    2, '2004-06-30');
INSERT INTO STUDENT VALUES (10, 'Tanvi',  'Joshi',  'tanvi.j@srm.edu',  9876543219, 'B.Tech AI/ML', 3, '2003-03-25');

-- ---- CONCEPTS (14 nodes) ----
INSERT INTO CONCEPT VALUES (101, 'Linear Algebra',                'Beginner');
INSERT INTO CONCEPT VALUES (102, 'Calculus',                      'Beginner');
INSERT INTO CONCEPT VALUES (103, 'Python Programming',            'Beginner');
INSERT INTO CONCEPT VALUES (104, 'Probability & Statistics',      'Beginner');
INSERT INTO CONCEPT VALUES (105, 'Discrete Mathematics',          'Beginner');
INSERT INTO CONCEPT VALUES (106, 'Data Structures',               'Intermediate');
INSERT INTO CONCEPT VALUES (107, 'Data Preprocessing',            'Intermediate');
INSERT INTO CONCEPT VALUES (108, 'SQL & Databases',               'Intermediate');
INSERT INTO CONCEPT VALUES (109, 'Machine Learning Fundamentals', 'Intermediate');
INSERT INTO CONCEPT VALUES (110, 'Neural Networks',               'Advanced');
INSERT INTO CONCEPT VALUES (111, 'Deep Learning',                 'Advanced');
INSERT INTO CONCEPT VALUES (112, 'Computer Vision',               'Advanced');
INSERT INTO CONCEPT VALUES (113, 'Natural Language Processing',   'Advanced');
INSERT INTO CONCEPT VALUES (114, 'Reinforcement Learning',        'Advanced');

-- ---- PREREQUISITES (DAG edges) ----
INSERT INTO PREREQUISITES VALUES (103, 106);
INSERT INTO PREREQUISITES VALUES (105, 106);
INSERT INTO PREREQUISITES VALUES (101, 109);
INSERT INTO PREREQUISITES VALUES (102, 109);
INSERT INTO PREREQUISITES VALUES (104, 109);
INSERT INTO PREREQUISITES VALUES (106, 109);
INSERT INTO PREREQUISITES VALUES (107, 109);
INSERT INTO PREREQUISITES VALUES (101, 110);
INSERT INTO PREREQUISITES VALUES (102, 110);
INSERT INTO PREREQUISITES VALUES (109, 110);
INSERT INTO PREREQUISITES VALUES (110, 111);
INSERT INTO PREREQUISITES VALUES (111, 112);
INSERT INTO PREREQUISITES VALUES (111, 113);
INSERT INTO PREREQUISITES VALUES (109, 114);
INSERT INTO PREREQUISITES VALUES (104, 114);

-- ---- ATTEMPTS (50 rows) ----
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (1,  101, 82.00, 60);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (1,  102, 75.00, 55);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (1,  109, 68.00, 90);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (1,  110, 38.00, 70);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (1,  110, 45.00, 80);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (2,  101, 91.00, 50);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (2,  102, 88.00, 45);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (2,  104, 85.00, 40);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (2,  109, 90.00, 80);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (2,  110, 87.00, 75);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (2,  111, 82.00, 90);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (3,  101, 42.00, 65);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (3,  102, 55.00, 60);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (3,  109, 44.00, 95);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (3,  110, 32.00, 85);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (4,  101, 70.00, 55);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (4,  103, 78.00, 50);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (4,  105, 65.00, 45);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (5,  103, 88.00, 40);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (5,  106, 72.00, 65);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (5,  107, 48.00, 70);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (5,  109, 60.00, 90);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (5,  112, 35.00, 80);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (6,  101, 79.00, 60);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (6,  104, 83.00, 55);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (6,  107, 77.00, 50);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (6,  109, 74.00, 85);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (6,  110, 66.00, 90);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (7,  109, 92.00, 70);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (7,  110, 89.00, 75);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (7,  111, 91.00, 85);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (7,  112, 86.00, 80);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (7,  113, 84.00, 90);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (8,  101, 60.00, 70);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (8,  102, 43.00, 65);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (8,  103, 72.00, 50);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (9,  101, 58.00, 55);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (9,  104, 62.00, 60);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (9,  106, 55.00, 65);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (9,  109, 47.00, 95);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (9,  109, 53.00, 85);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (10, 101, 85.00, 50);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (10, 102, 80.00, 45);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (10, 109, 88.00, 75);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (10, 110, 81.00, 80);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (10, 111, 76.00, 85);
INSERT INTO ATTEMPTS (student_id, concept_id, score, time_spent_mins) VALUES (10, 113, 79.00, 90);

-- ---- KNOWLEDGE GAPS ----
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (1,  110, 'Critical');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (3,  101, 'Warning');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (3,  109, 'Critical');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (3,  110, 'Critical');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (5,  107, 'Warning');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (5,  112, 'Critical');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (8,  102, 'Warning');
INSERT INTO KNOWLEDGEGAP (student_id, concept_id, severity) VALUES (9,  109, 'Critical');
 