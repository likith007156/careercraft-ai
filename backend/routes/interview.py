from flask import Blueprint, jsonify, request
from backend.models.database import query_db, execute_db
from backend.models.learning_tracker import add_xp
from backend.services.claude_service import conduct_interview, evaluate_interview_answer, detect_flaws
import datetime

interview_bp = Blueprint("interview", __name__)

@interview_bp.route("/api/interview/start", methods=["POST"])
def start_interview_session():
    data = request.json or {}
    company = data.get("company_name", "Cognizant")
    interview_type = data.get("interview_type", "MIXED") # HR | TECHNICAL | MIXED
    difficulty = data.get("difficulty", "Medium")
    
    # Generate the first question (question_number=1, history=[])
    res = conduct_interview(company, interview_type, 1, [])
    
    return jsonify({
        "session_active": True,
        "current_question_number": 1,
        "question": res["question"],
        "question_type": res["question_type"],
        "history": []
    })

@interview_bp.route("/api/interview/answer", methods=["POST"])
def submit_interview_answer():
    """
    Submits current answer, evaluates it, and generates the next question.
    JSON body:
    {
        "company_name": "Cognizant",
        "interview_type": "MIXED",
        "question": "Question text...",
        "user_answer": "Student answer...",
        "question_number": 2,
        "history": [{"question": "...", "user_answer": "...", "score": 8, "feedback": "...", "better_answer": "..."}],
        "is_final": false
    }
    """
    data = request.json or {}
    company = data.get("company_name", "Cognizant")
    interview_type = data.get("interview_type", "MIXED")
    question = data.get("question")
    user_answer = data.get("user_answer", "").strip()
    question_number = data.get("question_number", 1)
    history = data.get("history", [])
    is_final = data.get("is_final", False)
    
    if not question:
        return jsonify({"error": "Question parameter is required"}), 400
        
    # 1. Evaluate current answer
    eval_res = evaluate_interview_answer(question, user_answer, company)
    
    # Append current question & answer to history
    new_history = history.copy()
    new_history.append({
        "question": question,
        "user_answer": user_answer,
        "score": eval_res["score"],
        "feedback": eval_res["feedback"],
        "better_answer": eval_res["better_answer"]
    })
    
    # 2. If final question, return evaluation only
    if is_final:
        return jsonify({
            "evaluation": eval_res,
            "history": new_history,
            "next_question": None,
            "next_question_number": None
        })
        
    # 3. Generate next question (incremented question_number)
    next_question_number = question_number + 1
    next_res = conduct_interview(company, interview_type, next_question_number, new_history)
    
    return jsonify({
        "evaluation": eval_res,
        "history": new_history,
        "next_question": next_res["question"],
        "next_question_number": next_question_number,
        "next_question_type": next_res["question_type"]
    })

@interview_bp.route("/api/interview/save", methods=["POST"])
def save_mock_interview():
    """
    Saves a completed mock interview session to the database.
    Calculates overall score, awards XP, and runs flaw detection.
    JSON body:
    {
        "company_name": "Cognizant",
        "interview_type": "MIXED",
        "history": [...]
    }
    """
    data = request.json or {}
    company = data.get("company_name", "Cognizant")
    interview_type = data.get("interview_type", "MIXED")
    history = data.get("history", [])
    
    if not history:
        return jsonify({"error": "Interview history is empty"}), 400
        
    # Calculate overall score as the average of each answer's score
    scores = [h["score"] for h in history if "score" in h]
    avg_score = int((sum(scores) / len(scores)) * 10) if scores else 0 # Scale to 100
    
    # Compile questions, answers, feedback, better answers
    # We will log the summary details into mock_interviews
    # To store multiple questions in a single row, we concatenate or log representative ones
    # Usually, mock_interviews table schema has:
    # id, date, company_name, interview_type, question, user_answer, ai_score, ai_feedback, better_answer
    # We will insert a record for the general interview session, linking details
    rep_question = history[0]["question"]
    rep_answer = history[0]["user_answer"]
    rep_feedback = f"Analyzed {len(history)} questions. " + "; ".join([f"Q{i+1}: {h['feedback']}" for i, h in enumerate(history)])[:1000]
    rep_better = history[0]["better_answer"]
    
    db_id = execute_db(
        """INSERT INTO mock_interviews 
           (date, company_name, interview_type, question, user_answer, ai_score, ai_feedback, better_answer) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (datetime.date.today().isoformat(), company, interview_type, rep_question, rep_answer, avg_score, rep_feedback, rep_better)
    )
    
    # Award large XP for finishing a whole interview session
    xp_earned = 150 + (avg_score * 2) # Base 150 + performance bonus
    res_xp = add_xp(xp_earned)
    
    # Run flaw detector in background
    try:
        # Pass user_answer and question pairings to flaw detector
        flaw_logs = []
        for h in history:
            flaw_logs.append({
                "question": h["question"],
                "user_answer": h["user_answer"],
                "is_correct": h["score"] >= 7
            })
            
        flaw_res = detect_flaws(flaw_logs)
        for f in flaw_res.get("flaws", []):
            # Write to database if it doesn't already exist active
            existing = query_db(
                "SELECT id FROM flaws_detected WHERE flaw_description = ? AND is_fixed = 0",
                (f["flaw_description"],),
                one=True
            )
            if not existing:
                execute_db(
                    """INSERT INTO flaws_detected 
                       (flaw_type, flaw_description, first_detected_date, frequency_count, is_fixed, related_topic) 
                       VALUES (?, ?, ?, 1, 0, ?)""",
                    (f["flaw_type"], f["flaw_description"], datetime.date.today().isoformat(), f["related_topic"])
                )
    except Exception as e:
        print(f"Error checking flaws in mock interview: {e}")
        
    return jsonify({
        "success": True,
        "interview_id": db_id,
        "overall_score": avg_score,
        "xp_gained": xp_earned,
        "total_xp": res_xp["total_xp"],
        "current_level": res_xp["current_level"]
    })

@interview_bp.route("/api/interview/history", methods=["GET"])
def get_interview_history():
    history = query_db("SELECT * FROM mock_interviews ORDER BY date DESC")
    
    # Generate simple trends
    scores = [row["ai_score"] for row in history]
    average_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    
    return jsonify({
        "history": history,
        "average_score": average_score,
        "total_interviews": len(history)
    })
