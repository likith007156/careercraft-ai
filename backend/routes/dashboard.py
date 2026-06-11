import datetime
import json
import os
from flask import Blueprint, jsonify, request
from backend.models.database import query_db, execute_db
from backend.models.learning_tracker import get_user_progress, add_xp, update_streak
from backend.services.claude_service import generate_daily_tasks, generate_daily_motivation

dashboard_bp = Blueprint("dashboard", __name__)

SETTINGS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "user_settings.json")

def get_settings():
    """Reads user settings from a JSON file, initializing if missing."""
    if not os.path.exists(SETTINGS_PATH):
        default = {"username": "Kiran", "company_focus": "Cognizant"}
        os.makedirs(os.path.dirname(SETTINGS_PATH), exist_ok=True)
        with open(SETTINGS_PATH, "w") as f:
            json.dump(default, f)
        return default
    try:
        with open(SETTINGS_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {"username": "Kiran", "company_focus": "Cognizant"}

def save_settings(settings):
    """Saves user settings to JSON file."""
    os.makedirs(os.path.dirname(SETTINGS_PATH), exist_ok=True)
    with open(SETTINGS_PATH, "w") as f:
        json.dump(settings, f)

@dashboard_bp.route("/api/dashboard", methods=["GET"])
def get_dashboard_data():
    settings = get_settings()
    
    # Update streak daily
    streak_count = update_streak()
    
    progress = get_user_progress()
    
    # Format today's date & day
    today = datetime.date.today()
    day_name = today.strftime("%A")
    date_str = today.strftime("%B %d, %Y")
    
    # Greetings text — use client's local hour if provided, else server UTC
    try:
        tz_offset = int(request.args.get("tz_offset", 0))
    except (ValueError, TypeError):
        tz_offset = 0
    hour = (datetime.datetime.utcnow().hour + tz_offset) % 24
    greeting = "Good morning"
    if 12 <= hour < 17:
        greeting = "Good afternoon"
    elif hour >= 17:
        greeting = "Good evening"
        
    greeting_msg = f"{greeting}, {settings['username']}!"
    
    # Retrieve top 3 weak areas
    weak_areas = query_db(
        "SELECT topic_name, subtopic_name, mastery_level FROM topics_learned WHERE weak_flag = 1 ORDER BY mastery_level ASC LIMIT 3"
    )
    
    # If no explicitly flagged weak areas, take lowest completion scores
    if not weak_areas:
        weak_areas = query_db(
            "SELECT topic_name, subtopic_name, mastery_level FROM topics_learned ORDER BY completion_percentage ASC LIMIT 3"
        )
        
    # Get today's daily tasks
    today_str = today.isoformat()
    tasks = query_db("SELECT * FROM daily_tasks WHERE date = ?", (today_str,))
    
    # If no tasks generated for today, generate them using Claude
    if not tasks:
        # Get weak topics
        weak_topics_list = [t["topic_name"] for t in weak_areas]
        # Get recently learned topics
        learned_topics = query_db("SELECT DISTINCT topic_name FROM topics_learned LIMIT 5")
        learned_topics_list = [t["topic_name"] for t in learned_topics]
        
        task_data = generate_daily_tasks(weak_topics_list, learned_topics_list)
        for t in task_data.get("tasks", []):
            execute_db(
                "INSERT INTO daily_tasks (date, task_type, topic_name, task_description, is_completed, xp_points, time_estimate_mins) VALUES (?, ?, ?, ?, 0, ?, ?)",
                (today_str, t["task_type"], t["topic_name"], t["task_description"], t.get("xp_points", 15), t.get("time_estimate_mins", 30))
            )
        tasks = query_db("SELECT * FROM daily_tasks WHERE date = ?", (today_str,))
        
    # Stats calculation
    mastered_this_week = query_db(
        "SELECT count(*) as count FROM topics_learned WHERE mastery_level >= 4 AND date_learned >= ?",
        ((today - datetime.timedelta(days=7)).isoformat(),),
        one=True
    )["count"]
    
    avg_score_row = query_db(
        "SELECT AVG(last_quiz_score) as avg_score FROM topics_learned WHERE last_quiz_score IS NOT NULL",
        one=True
    )
    avg_score = round(avg_score_row["avg_score"], 1) if avg_score_row and avg_score_row["avg_score"] is not None else 0.0
    
    # Motivation quote
    user_stats = {
        "company": settings["company_focus"],
        "streak": streak_count,
        "xp": progress["total_xp"],
        "level": progress["current_level"]
    }
    motivational_quote = generate_daily_motivation(user_stats).get("quote", "Keep working hard toward your goals!")
    
    return jsonify({
        "greeting": greeting_msg,
        "date": date_str,
        "day": day_name,
        "streak": streak_count,
        "readiness_score": progress["overall_score"],
        "level": progress["current_level"],
        "total_xp": progress["total_xp"],
        "company_focus": settings["company_focus"],
        "schedule": tasks,
        "weak_areas": weak_areas,
        "stats": {
            "mastered_count": mastered_this_week,
            "quiz_average": avg_score,
            "streak_days": streak_count,
            "total_xp": progress["total_xp"]
        },
        "motivational_quote": motivational_quote
    })

@dashboard_bp.route("/api/dashboard/company", methods=["POST"])
def update_company():
    data = request.json or {}
    company = data.get("company_focus")
    if not company:
        return jsonify({"error": "Company focus is required"}), 400
        
    settings = get_settings()
    settings["company_focus"] = company
    save_settings(settings)
    
    # Recalculate motivation & update streak
    return jsonify({"success": True, "company_focus": company})

@dashboard_bp.route("/api/dashboard/name", methods=["POST"])
def update_name():
    data = request.json or {}
    name = data.get("username")
    if not name:
        return jsonify({"error": "Name is required"}), 400
        
    settings = get_settings()
    settings["username"] = name
    save_settings(settings)
    return jsonify({"success": True, "username": name})

@dashboard_bp.route("/api/dashboard/tasks/complete", methods=["POST"])
def complete_task():
    data = request.json or {}
    task_id = data.get("task_id")
    if not task_id:
        return jsonify({"error": "Task ID is required"}), 400
        
    task = query_db("SELECT * FROM daily_tasks WHERE id = ?", (task_id,), one=True)
    if not task:
        return jsonify({"error": "Task not found"}), 404
        
    if task["is_completed"]:
        return jsonify({"message": "Task already completed"}), 200
        
    execute_db("UPDATE daily_tasks SET is_completed = 1 WHERE id = ?", (task_id,))
    
    # Award XP
    xp_gained = task["xp_points"]
    res = add_xp(xp_gained)
    
    return jsonify({
        "success": True,
        "message": f"Task completed! Gained {xp_gained} XP.",
        "xp_gained": xp_gained,
        "total_xp": res["total_xp"],
        "current_level": res["current_level"]
    })

@dashboard_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "database": "connected",
        "timestamp": datetime.datetime.now().isoformat()
    })
