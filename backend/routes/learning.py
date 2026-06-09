from flask import Blueprint, jsonify, request
from backend.models.database import query_db, execute_db
from backend.models.learning_tracker import get_user_progress, add_xp
from backend.models.spaced_repetition import update_spaced_repetition
from backend.models.quiz_engine import create_lesson_quiz
from backend.services.claude_service import generate_lesson, explain_concept_differently
from backend.limiter import limiter
import datetime

learning_bp = Blueprint("learning", __name__)

SYLLABUS = {
    "Technical": [
        {
            "topic": "Python Programming",
            "subtopics": [
                "Variables and Data Types",
                "Conditions and Loops",
                "Functions",
                "Lists, Tuples, Dictionaries",
                "Object Oriented Programming",
                "File Handling",
                "Error Handling",
                "Libraries (NumPy, Pandas basics)",
                "AI/API integration with Python"
            ]
        },
        {
            "topic": "Data Structures & Algorithms",
            "subtopics": [
                "Arrays and Strings",
                "Stack and Queue",
                "Linked Lists",
                "Sorting Algorithms",
                "Searching Algorithms",
                "Recursion basics",
                "Time Complexity basics"
            ]
        },
        {
            "topic": "SQL & Database",
            "subtopics": [
                "Basic SELECT queries",
                "WHERE, ORDER BY, GROUP BY",
                "JOINS (Inner, Left, Right)",
                "Subqueries",
                "Aggregate Functions",
                "Indexing basics",
                "DBMS concepts"
            ]
        },
        {
            "topic": "AI & GenAI Concepts",
            "subtopics": [
                "What is AI, ML, DL",
                "What is an LLM",
                "What is GenAI",
                "Prompt Engineering",
                "What is RAG",
                "What is an AI Agent",
                "Tools and Memory in agents",
                "Real world AI applications"
            ]
        },
        {
            "topic": "Computer Science Basics",
            "subtopics": [
                "OOP concepts",
                "Computer Networks basics",
                "Operating Systems basics",
                "SDLC and Agile basics"
            ]
        }
    ],
    "Aptitude & Reasoning": [
        {
            "topic": "Quantitative Aptitude",
            "subtopics": [
                "Number systems",
                "Percentages",
                "Profit and Loss",
                "Time and Work",
                "Speed Distance Time"
            ]
        },
        {
            "topic": "Logical Reasoning",
            "subtopics": [
                "Series completion",
                "Coding decoding",
                "Blood relations",
                "Seating arrangement",
                "Syllogisms"
            ]
        },
        {
            "topic": "Verbal Reasoning",
            "subtopics": [
                "Reading comprehension",
                "Sentence completion",
                "Error identification",
                "Synonyms and Antonyms"
            ]
        }
    ],
    "Communication": [
        {
            "topic": "Written Communication",
            "subtopics": [
                "Formal email writing",
                "Report writing",
                "Grammar rules",
                "Vocabulary building"
            ]
        },
        {
            "topic": "Spoken Communication",
            "subtopics": [
                "Introduction speech",
                "Describing your project",
                "Group discussion skills",
                "Presentation techniques"
            ]
        }
    ]
}

@learning_bp.route("/api/learning/paths", methods=["GET"])
def get_paths():
    """Gets syllabus paths along with current database mastery status for colors."""
    studied = query_db("SELECT * FROM topics_learned")
    status_map = {}
    for row in studied:
        key = f"{row['topic_name']} - {row['subtopic_name']}"
        status_map[key] = {
            "completion": row["completion_percentage"],
            "mastery_level": row["mastery_level"],
            "last_score": row["last_quiz_score"],
            "weak_flag": row["weak_flag"],
            "times_reviewed": row["times_reviewed"]
        }
        
    result_syllabus = {}
    for section, topics in SYLLABUS.items():
        result_syllabus[section] = []
        for item in topics:
            topic_name = item["topic"]
            subtopics_data = []
            for sub in item["subtopics"]:
                key = f"{topic_name} - {sub}"
                status = status_map.get(key, {
                    "completion": 0,
                    "mastery_level": 1,
                    "last_score": None,
                    "weak_flag": 0,
                    "times_reviewed": 0
                })
                
                # Determine mastery tag color:
                # Grey = Not yet started (completion = 0)
                # Red = Studied but weak (completion > 0 and weak_flag = 1, or score < 70)
                # Yellow = Learning (70-85%)
                # Green = Strong (above 85%)
                # Gold star = Mastered (mastery_level = 5)
                color = "grey"
                if status["completion"] > 0:
                    if status["mastery_level"] == 5:
                        color = "gold"
                    elif status["weak_flag"] == 1 or (status["last_score"] is not None and status["last_score"] < 70):
                        color = "red"
                    elif status["last_score"] is not None and 70 <= status["last_score"] <= 85:
                        color = "yellow"
                    else:
                        color = "green"
                        
                subtopics_data.append({
                    "name": sub,
                    "color": color,
                    "completion": status["completion"],
                    "mastery_level": status["mastery_level"],
                    "last_score": status["last_score"],
                    "times_reviewed": status["times_reviewed"]
                })
            result_syllabus[section].append({
                "topic": topic_name,
                "subtopics": subtopics_data
            })
            
    return jsonify({"syllabus": result_syllabus})

@learning_bp.route("/api/learning/lesson", methods=["GET"])
@limiter.limit("10 per minute")
def get_lesson_content():
    topic = request.args.get("topic")
    subtopic = request.args.get("subtopic")
    if not topic or not subtopic:
        return jsonify({"error": "Parameters topic and subtopic are required"}), 400
        
    progress = get_user_progress()
    lesson = generate_lesson(topic, subtopic, progress["current_level"])
    return jsonify(lesson)

@learning_bp.route("/api/learning/read", methods=["POST"])
@limiter.limit("10 per minute")
def mark_lesson_read():
    """Triggered when student clicks 'I have read this' button. Generates post lesson quiz."""
    data = request.json or {}
    topic = data.get("topic")
    subtopic = data.get("subtopic")
    lesson_content = data.get("content", "General lesson details")
    
    if not topic or not subtopic:
        return jsonify({"error": "Topic and subtopic are required"}), 400
        
    # Generate 5-question Post Lesson Quiz
    questions = create_lesson_quiz(topic, subtopic, lesson_content)
    
    # Track starting time or study event
    existing = query_db("SELECT id FROM topics_learned WHERE topic_name = ? AND subtopic_name = ?", (topic, subtopic), one=True)
    if not existing:
        execute_db(
            "INSERT INTO topics_learned (topic_name, subtopic_name, date_learned, completion_percentage, times_reviewed) VALUES (?, ?, ?, 10, 0)",
            (topic, subtopic, datetime.date.today().isoformat())
        )
        
    return jsonify({
        "success": True,
        "questions": questions
    })

@learning_bp.route("/api/learning/submit_quiz", methods=["POST"])
@limiter.limit("10 per minute")
def submit_lesson_quiz():
    """
    Evaluates post lesson quiz. 
    Must score 70% (at least 4 out of 5 correct) to mark complete.
    If below 70%: AI re-explains differently and returns new quiz.
    """
    data = request.json or {}
    topic = data.get("topic")
    subtopic = data.get("subtopic")
    questions = data.get("questions", [])
    answers = data.get("answers", {}) # dict map: q_id -> user_answer
    failed_explanation = data.get("lesson_content", "")
    
    if not topic or not subtopic:
        return jsonify({"error": "Topic and subtopic are required"}), 400
        
    # Score the answers
    correct_count = 0
    detailed_history = []
    
    for q in questions:
        q_id = str(q["id"])
        user_ans = answers.get(q_id, "").strip()
        correct_ans = q["correct_answer"].strip()
        is_correct = (user_ans.lower() == correct_ans.lower())
        
        if is_correct:
            correct_count += 1
            
        # Log to quiz history
        execute_db(
            """INSERT INTO quiz_history 
               (date_taken, quiz_type, topic_name, question, correct_answer, user_answer, is_correct, ai_explanation, difficulty_level)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (datetime.date.today().isoformat(), "POST_LESSON", f"{topic} - {subtopic}",
             q["question"], correct_ans, user_ans, 1 if is_correct else 0, q.get("explanation"), q.get("difficulty", "Medium"))
        )
        detailed_history.append({
            "question": q["question"],
            "correct_answer": correct_ans,
            "user_answer": user_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation")
        })
        
    score_percentage = int((correct_count / len(questions)) * 100) if questions else 0
    passed = score_percentage >= 70
    
    # Run Spaced Repetition engine
    spaced_res = update_spaced_repetition(topic, subtopic, score_percentage)
    
    xp_gained = 0
    re_explanation = None
    new_questions = None
    
    if passed:
        # Mark completion percentage
        execute_db(
            "UPDATE topics_learned SET completion_percentage = 100 WHERE topic_name = ? AND subtopic_name = ?",
            (topic, subtopic)
        )
        # Award XP: 50 XP bonus for completing lesson
        xp_res = add_xp(50 + (correct_count * 5))
        xp_gained = 50 + (correct_count * 5)
    else:
        # AI re-teaches differently
        re_explain_data = explain_concept_differently(subtopic, failed_explanation)
        re_explanation = re_explain_data.get("explanation")
        
        # Generate new quiz questions
        new_quiz = create_lesson_quiz(topic, subtopic, re_explanation)
        new_questions = new_quiz
        
        # Award small XP for effort
        xp_res = add_xp(10)
        xp_gained = 10
        
    return jsonify({
        "passed": passed,
        "score_percentage": score_percentage,
        "correct_count": correct_count,
        "total_count": len(questions),
        "xp_gained": xp_gained,
        "spaced_repetition": spaced_res,
        "results": detailed_history,
        "re_explanation": re_explanation,
        "new_questions": new_questions
    })
