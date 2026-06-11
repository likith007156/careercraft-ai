from flask import Blueprint, jsonify, request
from backend.models.database import query_db, execute_db
from backend.models.learning_tracker import get_user_progress, add_xp, recalculate_readiness
from backend.services.claude_service import generate_project_explanation, get_claude_response
import datetime

progress_bp = Blueprint("progress", __name__)

RESOURCES_DATA = {
    "Python": [
        {"name": "CS50P Harvard", "description": "Introduction to programming with Python (free, youtube).", "type": "Video", "time": "15 hours", "difficulty": "Beginner", "url": "https://www.youtube.com/playlist?list=PLhQjrBD2T3817j27-gWi5-Zy_cJ7hdAV9"},
        {"name": "freeCodeCamp Python Course", "description": "Full course for beginners covering syntax and OOP.", "type": "Video", "time": "4 hours", "difficulty": "Beginner", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"},
        {"name": "Python.org Tutorial", "description": "Official documentation and step-by-step tutorial.", "type": "Website", "time": "6 hours", "difficulty": "Intermediate", "url": "https://docs.python.org/3/tutorial/"}
    ],
    "SQL": [
        {"name": "W3Schools SQL", "description": "Interactive, bite-sized tutorials with code runners.", "type": "Website", "time": "5 hours", "difficulty": "Beginner", "url": "https://www.w3schools.com/sql/"},
        {"name": "SQLZoo", "description": "Practice SQL queries on real databases directly.", "type": "Website", "time": "8 hours", "difficulty": "Intermediate", "url": "https://sqlzoo.net/"}
    ],
    "AI & GenAI": [
        {"name": "DeepLearning.AI", "description": "Short, highly relevant GenAI developer courses.", "type": "Website", "time": "2 hours", "difficulty": "Intermediate", "url": "https://www.deeplearning.ai/short-courses/"},
        {"name": "Anthropic Claude Docs", "description": "Prompting techniques and API guides for developers.", "type": "Website", "time": "3 hours", "difficulty": "Advanced", "url": "https://docs.anthropic.com/"}
    ],
    "DSA": [
        {"name": "GeeksforGeeks DSA", "description": "Comprehensive theory and structured problem sets.", "type": "Website", "time": "20 hours", "difficulty": "Intermediate", "url": "https://www.geeksforgeeks.org/data-structures/"},
        {"name": "Striver A2Z DSA Sheet", "description": "Highly recommended coding sheet for placement prep.", "type": "Website", "time": "40 hours", "difficulty": "Advanced", "url": "https://takeuforward.org/strivers-a2z-dsa-course/"}
    ],
    "Aptitude": [
        {"name": "IndiaBIX", "description": "Free practice questions for quantitative and logical reasoning.", "type": "Website", "time": "12 hours", "difficulty": "Medium", "url": "https://www.indiabix.com/"},
        {"name": "PrepInsta Placement Prep", "description": "Company-specific previous papers (TCS, Cognizant, Infosys).", "type": "Website", "time": "10 hours", "difficulty": "Medium", "url": "https://prepinsta.com/"}
    ],
    "Communication": [
        {"name": "BBC Learning English", "description": "Excellent video playlist on professional speech patterns.", "type": "Video", "time": "8 hours", "difficulty": "Beginner", "url": "https://www.youtube.com/user/bbclearningenglish"}
    ]
}

# ==========================================
# 1. PROGRESS ANALYTICS & CHARTS
# ==========================================

@progress_bp.route("/api/progress/analytics", methods=["GET"])
def get_analytics_data():
    # Recalculate readiness to keep scores updated
    readiness_score = recalculate_readiness()
    
    progress = get_user_progress()
    
    # 1. Radar Chart Data (Scores 1-10)
    # Convert database percentage scores (0-100) to 1-10 scale
    radar_data = {
        "Python": max(1, round((progress["python_score"] or 0) / 10, 1)),
        "SQL & DB": max(1, round((progress["sql_score"] or 0) / 10, 1)),
        "AI/GenAI": max(1, round((progress["ai_score"] or 0) / 10, 1)),
        "DSA": max(1, round((progress["dsa_score"] or 0) / 10, 1)),
        "CS Basics": 5.0, # Default static base
        "Comm": max(1, round((progress["communication_score"] or 0) / 10, 1)),
        "Aptitude": max(1, round((progress["aptitude_score"] or 0) / 10, 1))
    }
    
    # 2. Daily Score Trend (last 30 days)
    trend_rows = query_db("SELECT date, overall_score FROM user_progress ORDER BY date ASC LIMIT 30")
    
    # 3. Weekly Study Time (aggregated minutes)
    study_time_data = query_db(
        "SELECT topic_name, SUM(time_spent_minutes) as total_mins FROM topics_learned GROUP BY topic_name"
    )
    
    # 4. Mastery Map (all subtopics status)
    topics_list = query_db("SELECT topic_name, subtopic_name, completion_percentage, mastery_level FROM topics_learned")
    
    # Calculate % syllabus complete
    # total syllabus subtopics count = 57
    syllabus_subtopics_count = 57
    studied_count = len([t for t in topics_list if (t["completion_percentage"] or 0) > 0])
    completion_rate = round((studied_count / syllabus_subtopics_count) * 100, 1) if syllabus_subtopics_count else 0.0
    
    # 5. Streak Calendar (days studied in last year)
    streak_dates = query_db(
        "SELECT DISTINCT date_learned FROM topics_learned WHERE completion_percentage > 0 UNION SELECT DISTINCT date_taken FROM quiz_history"
    )
    streak_days = [row["date_learned"] for row in streak_dates if row["date_learned"]]
    
    # 6. Weekly Report summary from Claude
    stats_summary = f"""
    Overall readiness score: {readiness_score}%
    Python: {progress['python_score']}%
    SQL: {progress['sql_score']}%
    GenAI: {progress['ai_score']}%
    Communication: {progress['communication_score']}%
    Aptitude: {progress['aptitude_score']}%
    Streak Count: {progress['streak_count']} days
    Total XP: {progress['total_xp']}
    Syllabus Completion: {completion_rate}%
    """
    
    prompt = f"""
    Generate a concise plain-English weekly report summary (max 3 sentences) for a student's placement preparation platform dashboard.
    Current performance statistics:
    {stats_summary}
    Provide actionable feedback: what they improved, what still needs attention, and what their primary focus should be for the upcoming week.
    """
    weekly_summary = get_claude_response(prompt)
    if not weekly_summary:
        weekly_summary = f"This week you made progress. Your readiness score is {readiness_score}%. Keep focusing on your weaker topics to scale up your score."
        
    return jsonify({
        "readiness_score": readiness_score,
        "radar": radar_data,
        "trend": trend_rows,
        "study_time": study_time_data,
        "mastery_map": topics_list,
        "completion_rate": completion_rate,
        "streak_calendar": streak_days,
        "weekly_report": weekly_summary,
        "estimated_days_to_ready": max(5, int((100 - readiness_score) * 0.4))
    })

# ==========================================
# 2. MY PROJECT EXPLAINER
# ==========================================

@progress_bp.route("/api/project/explain", methods=["POST"])
def explain_project():
    data = request.json or {}
    project_details = {
        "project_name": data.get("project_name", "Portfolio Project"),
        "problem_solved": data.get("problem_solved", ""),
        "tech_used": data.get("tech_used", []),
        "role": data.get("role", "Developer"),
        "key_features": data.get("key_features", ""),
        "challenges": data.get("challenges", ""),
        "results": data.get("results", ""),
        "duration": data.get("duration", "")
    }
    
    # Generate answers and script
    res = generate_project_explanation(project_details)
    
    # Award XP for project configuration
    add_xp(50)
    
    return jsonify({
        "success": True,
        "results": res,
        "xp_gained": 50
    })

# ==========================================
# 3. FLAW DETECTOR
# ==========================================

@progress_bp.route("/api/progress/flaws", methods=["GET"])
def get_detected_flaws():
    flaws = query_db("SELECT * FROM flaws_detected")
    return jsonify({"flaws": flaws})

@progress_bp.route("/api/progress/flaws/fix", methods=["POST"])
def fix_detected_flaw():
    data = request.json or {}
    flaw_id = data.get("flaw_id")
    if not flaw_id:
        return jsonify({"error": "Flaw ID is required"}), 400
        
    execute_db("UPDATE flaws_detected SET is_fixed = 1 WHERE id = ?", (flaw_id,))
    add_xp(80) # Large XP bonus for correcting a personal flaw!
    
    return jsonify({
        "success": True,
        "message": "Flaw marked as fixed! 80 XP awarded.",
        "xp_gained": 80
    })

# ==========================================
# 4. RESOURCE LIBRARY
# ==========================================

@progress_bp.route("/api/progress/resources", methods=["GET"])
def get_resources_list():
    return jsonify({"resources": RESOURCES_DATA})

# ==========================================
# 5. USER NOTES CRUD
# ==========================================

@progress_bp.route("/api/notes", methods=["GET"])
def get_notes():
    notes = query_db("SELECT * FROM user_notes ORDER BY date_modified DESC")
    return jsonify({"notes": notes})

@progress_bp.route("/api/notes", methods=["POST"])
def save_note():
    data = request.json or {}
    note_id = data.get("id")
    topic = data.get("topic", "General")
    content = data.get("content", "")
    is_bookmarked = data.get("is_bookmarked", 0)
    
    today_str = datetime.datetime.now().isoformat()
    
    if note_id:
        # Update
        execute_db(
            "UPDATE user_notes SET topic = ?, content = ?, date_modified = ?, is_bookmarked = ? WHERE id = ?",
            (topic, content, today_str, is_bookmarked, note_id)
        )
        saved_id = note_id
    else:
        # Create
        saved_id = execute_db(
            "INSERT INTO user_notes (topic, content, date_created, date_modified, is_bookmarked) VALUES (?, ?, ?, ?, ?)",
            (topic, content, today_str, today_str, is_bookmarked)
        )
        add_xp(10)
        
    return jsonify({"success": True, "note_id": saved_id})

@progress_bp.route("/api/notes/delete", methods=["POST"])
def delete_note():
    data = request.json or {}
    note_id = data.get("id")
    if not note_id:
        return jsonify({"error": "Note ID is required"}), 400
    execute_db("DELETE FROM user_notes WHERE id = ?", (note_id,))
    return jsonify({"success": True})

# ==========================================
# 6. FLASHCARDS CRUD
# ==========================================

@progress_bp.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    cards = query_db("SELECT * FROM flashcards")
    return jsonify({"flashcards": cards})

@progress_bp.route("/api/flashcards", methods=["POST"])
def save_flashcard():
    data = request.json or {}
    card_id = data.get("id")
    topic = data.get("topic", "General")
    front = data.get("front_text", "")
    back = data.get("back_text", "")
    difficulty = data.get("difficulty", "Medium")
    
    if card_id:
        execute_db(
            "UPDATE flashcards SET topic = ?, front_text = ?, back_text = ?, difficulty = ? WHERE id = ?",
            (topic, front, back, difficulty, card_id)
        )
        saved_id = card_id
    else:
        saved_id = execute_db(
            "INSERT INTO flashcards (topic, front_text, back_text, difficulty) VALUES (?, ?, ?, ?)",
            (topic, front, back, difficulty)
        )
        add_xp(10)
        
    return jsonify({"success": True, "card_id": saved_id})

@progress_bp.route("/api/flashcards/review", methods=["POST"])
def review_flashcard():
    data = request.json or {}
    card_id = data.get("id")
    rating = data.get("rating", "medium") # easy, medium, hard
    
    if not card_id:
        return jsonify({"error": "Card ID is required"}), 400
        
    today = datetime.date.today()
    days_to_add = 3
    if rating == "easy":
        days_to_add = 7
    elif rating == "hard":
        days_to_add = 1
        
    next_review = (today + datetime.timedelta(days=days_to_add)).isoformat()
    execute_db(
        "UPDATE flashcards SET last_reviewed = ?, next_review = ?, difficulty = ? WHERE id = ?",
        (today.isoformat(), next_review, rating.capitalize(), card_id)
    )
    
    add_xp(5)
    return jsonify({"success": True, "next_review": next_review})

@progress_bp.route("/api/flashcards/delete", methods=["POST"])
def delete_flashcard():
    data = request.json or {}
    card_id = data.get("id")
    if not card_id:
        return jsonify({"error": "Card ID is required"}), 400
    execute_db("DELETE FROM flashcards WHERE id = ?", (card_id,))
    return jsonify({"success": True})

@progress_bp.route("/api/assessment/submit", methods=["POST"])
def submit_assessment():
    data = request.json or {}
    results = data.get("scores", {}) # dict of topic name -> score (1 to 10)
    
    # 1. Generate study plan via Claude
    from backend.services.claude_service import generate_study_plan
    plan_data = generate_study_plan(results)
    days = plan_data.get("days", [])
    
    # 2. Insert study plan into daily_tasks table for the next 30 days
    today = datetime.date.today()
    
    # Clear any existing daily tasks to start fresh
    execute_db("DELETE FROM daily_tasks")
    
    for day_item in days:
        day_num = day_item.get("day", 1)
        topic = day_item.get("topic", "Python Programming")
        subtopic = day_item.get("subtopic", "Variables")
        desc = day_item.get("task_description", "Study topic basics.")
        mins = day_item.get("time_estimate_mins", 60)
        
        # Calculate date for this day
        task_date = (today + datetime.timedelta(days=day_num - 1)).isoformat()
        
        # For each day, we create 3 tasks: Study, Practice, Quiz
        # Morning STUDY
        execute_db(
            """INSERT INTO daily_tasks (date, task_type, topic_name, task_description, is_completed, xp_points, time_estimate_mins)
               VALUES (?, 'STUDY', ?, ?, 0, 15, ?)""",
            (task_date, topic, f"Morning: Study {subtopic}. {desc}", int(mins * 0.5))
        )
        # Afternoon PRACTICE
        execute_db(
            """INSERT INTO daily_tasks (date, task_type, topic_name, task_description, is_completed, xp_points, time_estimate_mins)
               VALUES (?, 'PRACTICE', ?, ?, 0, 25, ?)""",
            (task_date, topic, f"Afternoon: Practice coding/writing exercises for {subtopic}.", int(mins * 0.4))
        )
        # Evening QUIZ
        execute_db(
            """INSERT INTO daily_tasks (date, task_type, topic_name, task_description, is_completed, xp_points, time_estimate_mins)
               VALUES (?, 'QUIZ', ?, ?, 0, 10, ?)""",
            (task_date, topic, f"Evening: Review quiz on {subtopic}.", 15)
        )
        
        # Also, register the studied topics in topics_learned table as "Not started" (completion = 0)
        # but matching our study plan topics so they appear in sidebar coding colors!
        existing_topic = query_db("SELECT id FROM topics_learned WHERE topic_name = ? AND subtopic_name = ?", (topic, subtopic), one=True)
        if not existing_topic:
            execute_db(
                "INSERT INTO topics_learned (topic_name, subtopic_name, date_learned, completion_percentage, times_reviewed, mastery_level) VALUES (?, ?, ?, 0, 0, 1)",
                (topic, subtopic, task_date)
            )

    # 3. Create or update user_progress row
    python_score = results.get("Python Programming", 5) * 10
    sql_score = results.get("SQL & Database", 5) * 10
    ai_score = results.get("AI & GenAI Concepts", 5) * 10
    dsa_score = results.get("Data Structures & Algorithms", 5) * 10
    comm_score = (results.get("Written Communication", 5) + results.get("Spoken Communication", 5)) * 5
    apt_score = (results.get("Quantitative Aptitude", 5) + results.get("Logical Reasoning", 5)) * 5
    
    # Calculate initial overall score (weighted)
    # Tech: Python, SQL, AI, DSA -> avg * 40%
    tech_avg = (python_score + sql_score + ai_score + dsa_score) / 4.0
    overall = (tech_avg * 0.40) + (comm_score * 0.25) + (apt_score * 0.25) + (1 * 10) # 1 day streak * 10%
    overall = round(min(100.0, max(0.0, overall)), 1)
    
    execute_db("DELETE FROM user_progress")
    execute_db(
        """INSERT INTO user_progress 
           (date, overall_score, python_score, ai_score, sql_score, 
            communication_score, aptitude_score, dsa_score, streak_count, total_xp, current_level) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 100, 1)""",
        (today.isoformat(), overall, python_score, ai_score, sql_score, comm_score, apt_score, dsa_score)
    )
    
    return jsonify({
        "success": True,
        "message": "Assessment registered. 30-day study plan generated!",
        "plan": days,
        "overall_score": overall
    })

