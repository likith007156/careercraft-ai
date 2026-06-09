import datetime
from backend.models.database import execute_db, query_db

def update_spaced_repetition(topic_name, subtopic_name, score_percentage):
    """
    Updates the topics_learned table based on quiz scores using spaced repetition logic.
    - Score < 70%: Mark WEAK, schedule next day (+1 day), increment times reviewed, set weak_flag=1.
    - Score 70-85%: Mark LEARNING, schedule 3 days later, increment times reviewed, set weak_flag=0.
    - Score > 85%: Mark STRONG, schedule 7 days later, increment times reviewed, set weak_flag=0.
    - Perfect score (100%) twice: Mark MASTERED, schedule 14 days later.
    """
    today = datetime.date.today()
    
    # Check if record exists
    existing = query_db(
        "SELECT * FROM topics_learned WHERE topic_name = ? AND subtopic_name = ?",
        (topic_name, subtopic_name),
        one=True
    )
    
    times_reviewed = 0
    mastery_level = 1
    completion_percentage = 0
    consecutive_perfects = 0
    
    if existing:
        times_reviewed = existing["times_reviewed"] + 1
        mastery_level = existing["mastery_level"]
        consecutive_perfects = existing["consecutive_perfects"] if "consecutive_perfects" in existing.keys() else 0
    else:
        times_reviewed = 1
        
    # Track consecutive perfect scores (100% score)
    if score_percentage == 100:
        consecutive_perfects += 1
    else:
        consecutive_perfects = 0
        
    # Determine new status parameters
    weak_flag = 0
    days_to_add = 3
    
    if score_percentage < 70:
        # Score below 70%: WEAK
        mastery_level = max(1, mastery_level - 1)
        weak_flag = 1
        days_to_add = 1
        completion_percentage = max(completion_percentage, 50)
        
        # Add a practice daily task for tomorrow to fix this topic
        tomorrow_str = (today + datetime.timedelta(days=1)).isoformat()
        # Verify if task already exists
        task_exists = query_db(
            "SELECT id FROM daily_tasks WHERE date = ? AND topic_name = ? AND task_type = 'PRACTICE'",
            (tomorrow_str, topic_name),
            one=True
        )
        if not task_exists:
            execute_db(
                "INSERT INTO daily_tasks (date, task_type, topic_name, task_description, is_completed, xp_points, time_estimate_mins) VALUES (?, ?, ?, ?, 0, 20, 30)",
                (tomorrow_str, "PRACTICE", topic_name, f"Review weak topic: {subtopic_name} and complete quiz again.")
            )
            
            # Log a flaw entry if student failed 3 times
            failures = query_db(
                "SELECT count(*) as fails FROM quiz_history WHERE topic_name = ? AND is_correct = 0",
                (topic_name,),
                one=True
            )
            if failures and failures["fails"] >= 3:
                # Add to flaw detector
                flaw_desc = f"You are consistently struggling with {subtopic_name} in {topic_name}. Practice basic exercises."
                flaw_exists = query_db(
                    "SELECT id, frequency_count FROM flaws_detected WHERE related_topic = ? AND is_fixed = 0",
                    (subtopic_name,),
                    one=True
                )
                if flaw_exists:
                    execute_db(
                        "UPDATE flaws_detected SET frequency_count = frequency_count + 1 WHERE id = ?",
                        (flaw_exists["id"],)
                    )
                else:
                    execute_db(
                        "INSERT INTO flaws_detected (flaw_type, flaw_description, first_detected_date, frequency_count, is_fixed, related_topic) VALUES (?, ?, ?, 1, 0, ?)",
                        ("TECHNICAL", flaw_desc, today.isoformat(), subtopic_name)
                    )
                    
    elif score_percentage <= 85:
        # Score 70-85%: LEARNING
        mastery_level = min(3, max(mastery_level, 2))
        days_to_add = 3
        completion_percentage = max(completion_percentage, 80)
        
    else:
        # Score above 85%: STRONG or MASTERED
        days_to_add = 7
        completion_percentage = max(completion_percentage, 95)
        
        # Perfect score twice in a row (consecutive_perfects >= 2) triggers MASTERED
        if score_percentage == 100 and consecutive_perfects >= 2:
            mastery_level = 5 # Mastered
            days_to_add = 14
            completion_percentage = 100
        else:
            mastery_level = min(4, max(mastery_level + 1, 3))
            
    next_review = (today + datetime.timedelta(days=days_to_add)).isoformat()
    
    if existing:
        execute_db(
            """UPDATE topics_learned 
               SET date_learned = ?, last_quiz_score = ?, next_review_date = ?, 
                   mastery_level = ?, times_reviewed = ?, weak_flag = ?, completion_percentage = ?,
                   consecutive_perfects = ?
               WHERE topic_name = ? AND subtopic_name = ?""",
            (today.isoformat(), score_percentage, next_review, mastery_level, 
             times_reviewed, weak_flag, completion_percentage, consecutive_perfects, topic_name, subtopic_name)
        )
    else:
        execute_db(
            """INSERT INTO topics_learned 
               (topic_name, subtopic_name, date_learned, last_quiz_score, next_review_date, 
                mastery_level, times_reviewed, weak_flag, completion_percentage, consecutive_perfects)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (topic_name, subtopic_name, today.isoformat(), score_percentage, next_review,
             mastery_level, times_reviewed, weak_flag, completion_percentage, consecutive_perfects)
        )
        
    return {
        "mastery_level": mastery_level,
        "next_review_date": next_review,
        "weak_flag": weak_flag,
        "completion_percentage": completion_percentage
    }
