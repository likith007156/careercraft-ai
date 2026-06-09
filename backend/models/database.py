import sqlite3
import os
from dotenv import load_dotenv


# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

DB_PATH = os.getenv("DATABASE_URL", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "database", "careercraft.db"))

def get_db_connection():
    """Establishes a connection to the SQLite database and configures row factory to return dicts."""
    # Ensure parent directory of DB exists
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initializes the database schema by creating all required tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # TABLE: topics_learned
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS topics_learned (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_name TEXT NOT NULL,
        subtopic_name TEXT NOT NULL,
        date_learned TEXT NOT NULL,
        time_spent_minutes INTEGER DEFAULT 0,
        completion_percentage INTEGER DEFAULT 0,
        last_quiz_score INTEGER DEFAULT NULL,
        next_review_date TEXT DEFAULT NULL,
        mastery_level INTEGER DEFAULT 1, -- (1-5)
        times_reviewed INTEGER DEFAULT 0,
        weak_flag INTEGER DEFAULT 0, -- boolean (0 or 1)
        consecutive_perfects INTEGER DEFAULT 0,
        UNIQUE(topic_name, subtopic_name)
    )
    """)

    # TABLE: quiz_history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_taken TEXT NOT NULL,
        quiz_type TEXT NOT NULL, -- e.g., 'POST_LESSON', 'DAILY_MORNING', 'WEAKNESS_DRILL', 'WEEKLY_MEGA', 'COMPANY_SPECIFIC'
        topic_name TEXT NOT NULL,
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        user_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL, -- boolean (0 or 1)
        ai_explanation TEXT,
        difficulty_level TEXT NOT NULL -- e.g., 'Easy', 'Medium', 'Hard'
    )
    """)

    # TABLE: daily_tasks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        task_type TEXT NOT NULL, -- e.g., 'STUDY', 'PRACTICE', 'QUIZ'
        topic_name TEXT NOT NULL,
        task_description TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0, -- boolean (0 or 1)
        xp_points INTEGER DEFAULT 10,
        time_estimate_mins INTEGER DEFAULT 15
    )
    """)

    # TABLE: mock_interviews
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mock_interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        company_name TEXT NOT NULL,
        interview_type TEXT NOT NULL, -- 'HR', 'TECHNICAL', 'MIXED'
        question TEXT NOT NULL,
        user_answer TEXT NOT NULL,
        ai_score INTEGER DEFAULT 0, -- 0-100
        ai_feedback TEXT,
        better_answer TEXT
    )
    """)

    # TABLE: user_progress
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        overall_score REAL DEFAULT 0.0,
        python_score REAL DEFAULT 0.0,
        ai_score REAL DEFAULT 0.0,
        sql_score REAL DEFAULT 0.0,
        communication_score REAL DEFAULT 0.0,
        aptitude_score REAL DEFAULT 0.0,
        dsa_score REAL DEFAULT 0.0,
        streak_count INTEGER DEFAULT 0,
        total_xp INTEGER DEFAULT 0,
        current_level INTEGER DEFAULT 1
    )
    """)

    # TABLE: flaws_detected
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS flaws_detected (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flaw_type TEXT NOT NULL, -- 'TECHNICAL', 'COMMUNICATION', 'INTERVIEW'
        flaw_description TEXT NOT NULL,
        first_detected_date TEXT NOT NULL,
        frequency_count INTEGER DEFAULT 1,
        is_fixed INTEGER DEFAULT 0, -- boolean (0 or 1)
        related_topic TEXT
    )
    """)

    # TABLE: user_notes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        content TEXT NOT NULL,
        date_created TEXT NOT NULL,
        date_modified TEXT NOT NULL,
        is_bookmarked INTEGER DEFAULT 0 -- boolean (0 or 1)
    )
    """)

    # TABLE: flashcards
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        front_text TEXT NOT NULL,
        back_text TEXT NOT NULL,
        difficulty TEXT DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
        last_reviewed TEXT DEFAULT NULL,
        next_review TEXT DEFAULT NULL
    )
    """)
    
    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

def query_db(query, args=(), one=False):
    """Utility to query the database and return dictionaries."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    # Convert sqlite3.Row to dict
    result = [dict(row) for row in rv]
    return (result[0] if result else None) if one else result

def execute_db(query, args=()):
    """Utility to execute insert/update/delete operations."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(query, args)
    conn.commit()
    lastrowid = cur.lastrowid
    conn.close()
    return lastrowid
