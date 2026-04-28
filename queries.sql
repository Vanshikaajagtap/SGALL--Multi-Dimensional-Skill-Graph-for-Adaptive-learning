SELECT
  (SELECT COUNT(*) FROM STUDENT)                               AS total_students,
  (SELECT COUNT(*) FROM CONCEPT)                               AS total_concepts,
  (SELECT COUNT(*) FROM ATTEMPTS)                              AS total_attempts,
  (SELECT COUNT(*) FROM KNOWLEDGEGAP)                          AS total_gaps,
  (SELECT COUNT(*) FROM KNOWLEDGEGAP WHERE severity='Critical') AS critical_gaps,
  (SELECT ROUND(AVG(score), 2) FROM ATTEMPTS)                  AS overall_avg_score,
  (SELECT COUNT(*) FROM (
    SELECT student_id FROM ATTEMPTS
    GROUP BY student_id HAVING AVG(score) >= 60
  ) t)                                                         AS passing_students;