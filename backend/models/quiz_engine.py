import datetime
import random
from backend.models.database import query_db, execute_db
from backend.services.claude_service import generate_quiz_questions

def get_studied_topics():
    """Returns a list of topic/subtopic dicts that the user has already studied."""
    return query_db("SELECT topic_name, subtopic_name, date_learned, weak_flag FROM topics_learned WHERE completion_percentage > 0")

def create_lesson_quiz(topic_name, subtopic_name, lesson_content):
    """Generates a 5-question quiz for the specific lesson just completed."""
    # Use Claude service to generate questions based on the lesson content
    quiz_data = generate_quiz_questions(
        topic=f"{topic_name} - {subtopic_name}",
        content=lesson_content,
        count=5,
        quiz_type="POST_LESSON"
    )
    return quiz_data["questions"]

def generate_morning_quiz_set():
    """
    Assembles a 10-question morning quiz:
    - 50% (5 questions) from topics learned yesterday
    - 30% (3 questions) from weak topics (last 3 days)
    - 20% (2 questions) from older weak topics
    If not enough studied topics are found, it falls back to any studied topics.
    """
    studied = get_studied_topics()
    if not studied:
        return {"error": "You have not studied any topics yet. Complete a lesson to unlock quizzes!", "questions": []}
        
    today = datetime.date.today()
    yesterday_str = (today - datetime.timedelta(days=1)).isoformat()
    three_days_ago_str = (today - datetime.timedelta(days=3)).isoformat()
    
    yesterday_topics = [t for t in studied if t["date_learned"] == yesterday_str]
    recent_weak = [t for t in studied if t["weak_flag"] == 1 and t["date_learned"] >= three_days_ago_str]
    older_weak = [t for t in studied if t["weak_flag"] == 1 and t["date_learned"] < three_days_ago_str]
    
    # Selection pools
    questions = []
    
    # 1. 5 questions from yesterday's topics
    yesterday_q_count = 5
    if yesterday_topics:
        selected_yesterday = random.sample(yesterday_topics, min(len(yesterday_topics), yesterday_q_count))
        for t in selected_yesterday:
            q_pack = generate_quiz_questions(t["topic_name"], t["subtopic_name"], count=2, quiz_type="DAILY_MORNING")
            questions.extend(q_pack.get("questions", [])[:2])
            
    # 2. 3 questions from recent weak topics
    recent_weak_q_count = 3
    if recent_weak:
        selected_weak = random.sample(recent_weak, min(len(recent_weak), recent_weak_q_count))
        for t in selected_weak:
            q_pack = generate_quiz_questions(t["topic_name"], t["subtopic_name"], count=1, quiz_type="DAILY_MORNING")
            questions.extend(q_pack.get("questions", [])[:1])
            
    # 3. 2 questions from older weak topics
    older_weak_q_count = 2
    if older_weak:
        selected_older = random.sample(older_weak, min(len(older_weak), older_weak_q_count))
        for t in selected_older:
            q_pack = generate_quiz_questions(t["topic_name"], t["subtopic_name"], count=1, quiz_type="DAILY_MORNING")
            questions.extend(q_pack.get("questions", [])[:1])
            
    # Fallback to make sure we have exactly 10 questions from whatever was studied
    needed = 10 - len(questions)
    if needed > 0 and studied:
        # Fill in with any studied topic
        while len(questions) < 10:
            t = random.choice(studied)
            q_pack = generate_quiz_questions(t["topic_name"], t["subtopic_name"], count=1, quiz_type="DAILY_MORNING")
            if q_pack.get("questions"):
                questions.append(q_pack["questions"][0])
            else:
                # Add a mock question to prevent infinite loops
                break
                
    # Truncate to 10
    questions = questions[:10]
    
    # Tag indices
    for i, q in enumerate(questions):
        q["id"] = i + 1
        
    return {"questions": questions}

def generate_weekly_mega_quiz_set():
    """Assembles a 30-question weekly mega quiz combining all studied topics."""
    studied = get_studied_topics()
    if not studied:
        return {"error": "You have not studied any topics yet.", "questions": []}
        
    questions = []
    # Pull questions from various studied topics
    attempts = 0
    while len(questions) < 30 and attempts < 15:
        selected_topics = random.sample(studied, min(len(studied), 10))
        for t in selected_topics:
            q_pack = generate_quiz_questions(t["topic_name"], t["subtopic_name"], count=3, quiz_type="WEEKLY_MEGA")
            questions.extend(q_pack.get("questions", []))
        attempts += 1
        
    random.shuffle(questions)
    questions = questions[:30]
    
    for i, q in enumerate(questions):
        q["id"] = i + 1
        
    return {"questions": questions}

def generate_company_specific_quiz_set(company):
    """
    Generates a 10-question company specific quiz based on the patterns of TCS, Cognizant, Infosys, etc.
    Adapts and uses studied topics but formats questions under specific patterns:
    - Cognizant: GenAI, Python, Communication, Aptitude
    - TCS: NQT style
    - Infosys: Logical/Mathematical
    """
    studied = get_studied_topics()
    if not studied:
        return {"error": "You have not studied any topics yet.", "questions": []}
        
    questions = []
    # Fetch questions based on studied topics matching company requirements
    # Fallback to random studied if empty
    for i in range(10):
        t = random.choice(studied)
        q_pack = generate_quiz_questions(t["topic_name"], f"{company} Pattern: {t['subtopic_name']}", count=1, quiz_type="COMPANY_SPECIFIC")
        if q_pack.get("questions"):
            questions.append(q_pack["questions"][0])
            
    for i, q in enumerate(questions):
        q["id"] = i + 1
        
    return {"questions": questions}
