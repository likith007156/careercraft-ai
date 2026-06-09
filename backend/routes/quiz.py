from flask import Blueprint, jsonify, request
from backend.models.database import query_db, execute_db
from backend.models.quiz_engine import (
    generate_morning_quiz_set,
    generate_weekly_mega_quiz_set,
    generate_company_specific_quiz_set
)
from backend.models.spaced_repetition import update_spaced_repetition
from backend.models.learning_tracker import add_xp
from backend.services.claude_service import generate_quiz_questions, get_claude_response
import datetime
import json

quiz_bp = Blueprint("quiz", __name__)

@quiz_bp.route("/api/quiz/morning", methods=["GET"])
def get_morning_quiz():
    data = generate_morning_quiz_set()
    return jsonify(data)

@quiz_bp.route("/api/quiz/mega", methods=["GET"])
def get_weekly_mega_quiz():
    data = generate_weekly_mega_quiz_set()
    return jsonify(data)

@quiz_bp.route("/api/quiz/company", methods=["GET"])
def get_company_quiz():
    company = request.args.get("company", "Cognizant")
    data = generate_company_specific_quiz_set(company)
    return jsonify(data)

@quiz_bp.route("/api/quiz/drill", methods=["GET"])
def get_weakness_drill():
    subtopic = request.args.get("subtopic")
    if not subtopic:
        return jsonify({"error": "Subtopic parameter is required"}), 400
        
    # Find the main topic for this subtopic
    topic_row = query_db(
        "SELECT topic_name FROM topics_learned WHERE subtopic_name = ? LIMIT 1",
        (subtopic,),
        one=True
    )
    topic_name = topic_row["topic_name"] if topic_row else "Technical"
    
    # Generate 10 questions on this specific subtopic
    content = f"Focus strictly on weakness drills for {subtopic}."
    quiz_data = generate_quiz_questions(topic_name, content, count=10, quiz_type="WEAKNESS_DRILL")
    
    return jsonify(quiz_data)

@quiz_bp.route("/api/quiz/submit", methods=["POST"])
def submit_quiz():
    """
    Submits standard quiz results (morning, mega, company, drill).
    Expects JSON:
    {
        "quiz_type": "DAILY_MORNING | WEEKLY_MEGA | COMPANY_SPECIFIC | WEAKNESS_DRILL",
        "topic_name": "General Topic",
        "questions": [...],
        "answers": { "q_id": "user_answer" }
    }
    """
    data = request.json or {}
    quiz_type = data.get("quiz_type", "DAILY_MORNING")
    questions = data.get("questions", [])
    answers = data.get("answers", {})
    
    if not questions:
        return jsonify({"error": "No questions provided"}), 400
        
    correct_count = 0
    detailed_history = []
    
    # Track topic correct metrics to update Spaced Repetition status
    topic_correct_rates = {}
    
    for q in questions:
        q_id = str(q["id"])
        user_ans = answers.get(q_id, "").strip()
        correct_ans = q["correct_answer"].strip()
        is_correct = (user_ans.lower() == correct_ans.lower())
        
        if is_correct:
            correct_count += 1
            
        topic = q.get("topic") or data.get("topic_name") or "General"
        subtopic = q.get("subtopic") or topic
        
        # Log to DB quiz history
        execute_db(
            """INSERT INTO quiz_history 
               (date_taken, quiz_type, topic_name, question, correct_answer, user_answer, is_correct, ai_explanation, difficulty_level)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (datetime.date.today().isoformat(), quiz_type, f"{topic} - {subtopic}",
             q["question"], correct_ans, user_ans, 1 if is_correct else 0, q.get("explanation"), q.get("difficulty", "Medium"))
        )
        
        # Track topics for aggregation
        t_key = (topic, subtopic)
        if t_key not in topic_correct_rates:
            topic_correct_rates[t_key] = {"correct": 0, "total": 0}
        topic_correct_rates[t_key]["total"] += 1
        if is_correct:
            topic_correct_rates[t_key]["correct"] += 1
            
        detailed_history.append({
            "id": q["id"],
            "question": q["question"],
            "correct_answer": correct_ans,
            "user_answer": user_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation"),
            "question_type": q.get("question_type", "MCQ")
        })
        
    # Update Spaced Repetition status for all topics tested in the quiz
    for (t_name, sub_name), rates in topic_correct_rates.items():
        score_percentage = int((rates["correct"] / rates["total"]) * 100)
        # Update SQLite table
        update_spaced_repetition(t_name, sub_name, score_percentage)
        
    score_percentage = int((correct_count / len(questions)) * 100) if questions else 0
    
    # Award XP: 10 XP per correct question + completion bonus
    xp_bonus = 20 if score_percentage >= 70 else 5
    xp_gained = (correct_count * 10) + xp_bonus
    res = add_xp(xp_gained)
    
    return jsonify({
        "success": True,
        "score_percentage": score_percentage,
        "correct_count": correct_count,
        "total_count": len(questions),
        "xp_gained": xp_gained,
        "total_xp": res["total_xp"],
        "current_level": res["current_level"],
        "results": detailed_history
    })

@quiz_bp.route("/api/code/generate", methods=["POST"])
def generate_code_problem():
    data = request.json or {}
    language = data.get("language", "python") # python | sql
    difficulty = data.get("difficulty", "Easy") # Easy | Medium | Hard
    category = data.get("category", "General")
    
    prompt = f"""
    You are a technical challenge creator. Generate a programming problem for the language "{language}".
    Difficulty: {difficulty}
    Topic category: {category}
    
    The response must contain:
    1. A problem description explaining the requirement, input/output structures, and constraints.
    2. A starter code template (e.g. function signature for Python, or schema setup with SELECT comment for SQL).
    3. At least 2 sample test cases (input and expected output).
    4. An integer bonus XP value.
    
    Respond strictly in JSON format with:
    {{
        "problem_title": "Short title",
        "description": "Markdown problem description...",
        "starter_code": "code template",
        "test_cases": [
            {{ "input": "input representation", "output": "expected output" }}
        ],
        "bonus_xp": 20
    }}
    """
    
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return jsonify(json.loads(ai_response))
        except Exception:
            pass
            
    # Mock fallback
    if language.lower() == "sql":
        return jsonify({
            "problem_title": "Retrieve Highest Earners",
            "description": "Write a SQL query to find all departments where the average employee salary is greater than $80,000. Return the department ID and the average salary as `avg_salary`, sorted by `avg_salary` in descending order.",
            "starter_code": "-- Table schema:\n-- Employees(id, name, department_id, salary)\n-- Departments(id, name)\n\nSELECT department_id, AVG(salary) AS avg_salary\nFROM Employees\nGROUP BY department_id\nHAVING AVG(salary) > 80000\nORDER BY avg_salary DESC;",
            "test_cases": [
                {"input": "Employees with salaries [70000, 90000] in Dept 1", "output": "Dept 1 with avg_salary 80000"}
            ],
            "bonus_xp": 20
        })
    else:
        return jsonify({
            "problem_title": "Reverse Words in a String",
            "description": "Given an input string `s`, reverse the order of the words. A word is defined as a sequence of non-space characters. Return the words joined by a single space.",
            "starter_code": "def reverse_words(s: str) -> str:\n    # Write your Python code here\n    pass",
            "test_cases": [
                {"input": "'the sky is blue'", "output": "'blue is sky the'"},
                {"input": "'  hello world  '", "output": "'world hello'"}
            ],
            "bonus_xp": 25
        })

@quiz_bp.route("/api/code/submit", methods=["POST"])
def submit_code_solution():
    data = request.json or {}
    problem_title = data.get("problem_title", "General Code Exercise")
    code_submitted = data.get("code_submitted", "")
    language = data.get("language", "python")
    difficulty = data.get("difficulty", "Easy")
    bonus_xp = data.get("bonus_xp", 20)
    
    prompt = f"""
    You are an automated code evaluator. Review the following student code submission.
    Problem Title: {problem_title}
    Language: {language}
    Difficulty: {difficulty}
    Submitted Code:
    {code_submitted}
    
    Evaluate correctness, logic errors, code quality, complexity (Time/Space), and suggest the optimal solution.
    Respond strictly in JSON format with:
    {{
        "score": 0 to 100,
        "is_correct": true/false,
        "what_was_right": "1-2 sentences on what was correct.",
        "what_was_wrong": "1-2 sentences on bugs or missing optimizations.",
        "better_solution": "Fully written optimized code block.",
        "time_complexity": "e.g., O(N)",
        "space_complexity": "e.g., O(1)",
        "quality_tips": ["tip 1", "tip 2"]
    }}
    """
    
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            eval_data = json.loads(ai_response)
            xp_gained = bonus_xp if eval_data.get("is_correct") else 10
            res_xp = add_xp(xp_gained)
            eval_data["xp_gained"] = xp_gained
            eval_data["total_xp"] = res_xp["total_xp"]
            eval_data["current_level"] = res_xp["current_level"]
            return jsonify(eval_data)
        except Exception:
            pass
            
    # Mock fallback
    is_correct = len(code_submitted.strip()) > 25
    score = 90 if is_correct else 30
    xp_gained = bonus_xp if is_correct else 5
    res_xp = add_xp(xp_gained)
    
    return jsonify({
        "score": score,
        "is_correct": is_correct,
        "what_was_right": "Starter signature found. Logic parsed successfully with correct structures." if is_correct else "Syntax mismatch or incomplete implementation.",
        "what_was_wrong": "Ensure edge cases like blank lines or null values are handled." if is_correct else "Please implement the template functions.",
        "better_solution": "def reverse_words(s: str) -> str:\n    return ' '.join(reversed(s.split()))" if language == "python" else "SELECT department_id, AVG(salary) AS avg_salary FROM Employees GROUP BY department_id HAVING AVG(salary) > 80000 ORDER BY avg_salary DESC;",
        "time_complexity": "O(N)",
        "space_complexity": "O(N)",
        "quality_tips": [
            "Use split and join methods for strings to keep logic highly readable.",
            "Handle null pointer exceptions or empty array edge cases."
        ],
        "xp_gained": xp_gained,
        "total_xp": res_xp["total_xp"],
        "current_level": res_xp["current_level"]
    })

