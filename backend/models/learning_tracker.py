import datetime
from backend.models.database import query_db, execute_db

def get_user_progress():
    """Retrieves or initializes the current user progress record in database."""
    today = datetime.date.today().isoformat()
    progress = query_db("SELECT * FROM user_progress ORDER BY date DESC LIMIT 1", one=True)
    
    if not progress:
        # Create initial row
        execute_db(
            """INSERT INTO user_progress 
               (date, overall_score, python_score, ai_score, sql_score, 
                communication_score, aptitude_score, dsa_score, streak_count, total_xp, current_level) 
               VALUES (?, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0, 1)""",
            (today,)
        )
        progress = query_db("SELECT * FROM user_progress ORDER BY date DESC LIMIT 1", one=True)
        
    return progress

def add_xp(amount):
    """Adds XP to the user's total, recalculates level, and updates current progress row."""
    progress = get_user_progress()
    total_xp = progress["total_xp"] + amount
    
    # Calculate Level: Level 1 to 10. Each level requires more XP.
    # Level 1: 0-100, Level 2: 100-300, Level 3: 300-600, Level 4: 600-1000,
    # Level 5: 1000-1500, Level 6: 1500-2100, Level 7: 2100-2800,
    # Level 8: 2800-3600, Level 9: 3600-4500, Level 10: 4500+
    xp_brackets = [100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]
    current_level = 1
    for i, bracket in enumerate(xp_brackets):
        if total_xp >= bracket:
            current_level = i + 2
        else:
            break
    current_level = min(10, current_level)
    
    execute_db(
        "UPDATE user_progress SET total_xp = ?, current_level = ? WHERE id = ?",
        (total_xp, current_level, progress["id"])
    )
    
    # Update readiness score
    recalculate_readiness()
    
    return {"total_xp": total_xp, "current_level": current_level, "gained_xp": amount}

def update_streak():
    """Updates study streak count depending on when the user last participated."""
    progress = get_user_progress()
    today = datetime.date.today()
    last_date_str = progress["date"]
    
    # If the current row's date matches today, do not increment streak again
    if last_date_str == today.isoformat():
        return progress["streak_count"]
        
    # Calculate difference
    last_date = datetime.date.fromisoformat(last_date_str)
    delta = today - last_date
    
    new_streak = progress["streak_count"]
    if delta.days == 1:
        # Studied yesterday, increment streak
        new_streak += 1
    elif delta.days > 1:
        # Broke streak, reset to 1
        new_streak = 1
        
    # Create or update progress row for today
    execute_db(
        """INSERT OR REPLACE INTO user_progress 
           (id, date, overall_score, python_score, ai_score, sql_score, 
            communication_score, aptitude_score, dsa_score, streak_count, total_xp, current_level) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (progress["id"], today.isoformat(), progress["overall_score"], progress["python_score"],
         progress["ai_score"], progress["sql_score"], progress["communication_score"],
         progress["aptitude_score"], progress["dsa_score"], new_streak, progress["total_xp"], progress["current_level"])
    )
    
    return new_streak

def recalculate_readiness():
    """
    Computes overall Interview Readiness Score based on:
    - Technical skills average: 40% weight
    - Communication score: 25% weight
    - Mock interview average: 25% weight
    - Consistency (streak): 10% weight
    """
    progress = get_user_progress()
    
    # 1. Technical skills average
    # Query topics learned and their average completion or last quiz scores
    tech_stats = query_db(
        """SELECT topic_name, AVG(completion_percentage) as avg_score 
           FROM topics_learned 
           WHERE topic_name IN ('Python Programming', 'SQL & Database', 'AI & GenAI Concepts', 'Data Structures & Algorithms', 'Computer Science Basics')
           GROUP BY topic_name"""
    )
    python_score = 0.0
    sql_score = 0.0
    ai_score = 0.0
    dsa_score = 0.0
    cs_score = 0.0
    
    for row in tech_stats:
        if row["topic_name"] == "Python Programming":
            python_score = row["avg_score"] or 0.0
        elif row["topic_name"] == "SQL & Database":
            sql_score = row["avg_score"] or 0.0
        elif row["topic_name"] == "AI & GenAI Concepts":
            ai_score = row["avg_score"] or 0.0
        elif row["topic_name"] == "Data Structures & Algorithms":
            dsa_score = row["avg_score"] or 0.0
        elif row["topic_name"] == "Computer Science Basics":
            cs_score = row["avg_score"] or 0.0
            
    tech_avg = (python_score + sql_score + ai_score + dsa_score + cs_score) / 5.0 if tech_stats else 0.0
    
    # 2. Communication score
    comm_stats = query_db(
        """SELECT AVG(completion_percentage) as avg_score 
           FROM topics_learned 
           WHERE topic_name IN ('Written Communication', 'Spoken Communication')""",
        one=True
    )
    comm_score = comm_stats["avg_score"] if comm_stats and comm_stats["avg_score"] is not None else 0.0
    
    # 3. Mock interview average
    interview_stats = query_db(
        "SELECT AVG(ai_score) as avg_score FROM mock_interviews",
        one=True
    )
    interview_score = interview_stats["avg_score"] if interview_stats and interview_stats["avg_score"] is not None else 0.0
    
    # 4. Consistency (streak) score: 10% weight. Max out streak contribution at 30 days.
    streak_val = min(100.0, (progress["streak_count"] / 30.0) * 100.0)
    
    # 5. Aptitude/Reasoning score
    apt_stats = query_db(
        """SELECT AVG(completion_percentage) as avg_score 
           FROM topics_learned 
           WHERE topic_name IN ('Quantitative Aptitude', 'Logical Reasoning', 'Verbal Reasoning')""",
        one=True
    )
    aptitude_score = apt_stats["avg_score"] if apt_stats and apt_stats["avg_score"] is not None else 0.0
    
    # Combine weights
    overall_score = (tech_avg * 0.40) + (comm_score * 0.25) + (interview_score * 0.25) + (streak_val * 0.10)
    overall_score = round(min(100.0, max(0.0, overall_score)), 1)
    
    # Save back
    execute_db(
        """UPDATE user_progress 
           SET overall_score = ?, python_score = ?, sql_score = ?, ai_score = ?, 
               dsa_score = ?, communication_score = ?, aptitude_score = ?
           WHERE id = ?""",
        (overall_score, python_score, sql_score, ai_score, dsa_score, comm_score, aptitude_score, progress["id"])
    )
    
    return overall_score
