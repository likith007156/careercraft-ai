import os
import json
import random
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

def mask_secret(msg):
    """Masks the sensitive API key from logs/print statements to prevent leaks."""
    if not msg:
        return ""
    msg_str = str(msg)
    if API_KEY and len(API_KEY) > 10 and API_KEY in msg_str:
        masked = API_KEY[:8] + "..." + API_KEY[-8:]
        msg_str = msg_str.replace(API_KEY, masked)
    return msg_str

# Initialize Anthropic client if key is present
client = None
if API_KEY and not API_KEY.startswith("your_key_here"):
    try:
        client = Anthropic(api_key=API_KEY)
    except Exception as e:
        print(mask_secret(f"Error initializing Anthropic client: {e}"))
        client = None

def get_claude_response(prompt, system_prompt="You are a helpful IT career mentor and teacher.", response_json=False):
    """Sends a request to Claude API. If it fails or is not configured, returns None."""
    if not client:
        return None
    try:
        messages = [{"role": "user", "content": prompt}]
        # Set json schema formatting if requested
        if response_json:
            system_prompt += " You must respond strictly with a valid JSON object. Do not include markdown code blocks (like ```json ... ```) in your response, just the raw JSON text."
        
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=4000,
            system=system_prompt,
            messages=messages,
            temperature=0.2 if response_json else 0.7,
            timeout=30.0
        )
        content_text = response.content[0].text.strip()
        
        # Clean JSON blocks if AI ignored instructions and added fences
        if response_json:
            if content_text.startswith("```json"):
                content_text = content_text[7:]
            if content_text.endswith("```"):
                content_text = content_text[:-3]
            content_text = content_text.strip()
            
        return content_text
    except Exception as e:
        print(mask_secret(f"Claude API Error: {e}"))
        return None

# ==========================================
# LOCAL SMART MOCK RESPONSES GENERATOR
# ==========================================

def get_mock_lesson(topic, subtopic, level):
    """Generates structured content for a lesson locally."""
    # Build a nice mock teaching lesson
    explanation = f"Welcome to the lesson on **{subtopic}** under **{topic}** (Level: {level}).\n\n"
    
    if "Python" in topic:
        if "Variables" in subtopic:
            explanation += """### Introduction to Variables
In Python, variables are created when you assign a value to them. Unlike other programming languages, Python has no command for declaring a variable. A variable is created the moment you first assign a value to it.

```python
# Declaring variables of different types
x = 5          # x is of type int
y = "John"     # y is now of type str
pi = 3.14159   # pi is of type float
is_active = True # is_active is of type bool

print(x)
print(y)
```

### Dynamic Typing
Python is dynamically-typed, meaning you don't need to state what type of data the variable holds. You can even change the type after it has been set:
```python
x = 4       # x is of type int
x = "Sally" # x is now of type str
```

### Naming Rules
* A variable name must start with a letter or the underscore character.
* A variable name cannot start with a number.
* A variable name can only contain alpha-numeric characters and underscores (A-z, 0-9, and _ ).
* Variable names are case-sensitive (`age`, `Age` and `AGE` are three different variables).
"""
        elif "Conditions" in subtopic or "Loops" in subtopic:
            explanation += """### Conditional Statements (if, elif, else)
Python supports the usual logical conditions from mathematics. These conditions can be used in several ways, most commonly in 'if statements' and loops.

```python
a = 200
b = 33
if b > a:
  print("b is greater than a")
elif a == b:
  print("a and b are equal")
else:
  print("a is greater than b")
```

### Loops (for and while)
Python has two primitive loop commands:
1. `while` loops: executes a set of statements as long as a condition is true.
2. `for` loops: used for iterating over a sequence (that is either a list, a tuple, a dictionary, a set, or a string).

```python
# While Loop
i = 1
while i < 6:
  print(i)
  i += 1

# For Loop
fruits = ["apple", "banana", "cherry"]
for x in fruits:
  print(x)
```
"""
        else:
            explanation += f"""### Understanding {subtopic} in Python
Here is an overview of {subtopic}. We cover standard declarations, usages, and best practices.

```python
# Example demonstrating {subtopic}
def example_demo():
    print("Welcome to {subtopic} in Python!")
    
example_demo()
```
Refer to the key takeaways below to consolidate your understanding.
"""
    elif "SQL" in topic:
        if "SELECT" in subtopic or "Basic SELECT queries" in subtopic:
            explanation += """### Basic SELECT Query Structure
The `SELECT` statement is used to select data from a database. The data returned is stored in a result table, called the result-set.

```sql
SELECT column1, column2, ...
FROM table_name;
```

### Selecting All Columns
To select all columns from a table, use the `*` wildcard:
```sql
SELECT * FROM Customers;
```

### Selecting Distinct values
The `SELECT DISTINCT` statement is used to return only distinct (different) values:
```sql
SELECT DISTINCT Country FROM Customers;
```
"""
        elif "JOINS" in subtopic:
            explanation += """### SQL JOINS
A `JOIN` clause is used to combine rows from two or more tables, based on a related column between them.

Here are the different types of the JOINs in SQL:
* `(INNER) JOIN`: Returns records that have matching values in both tables
* `LEFT (OUTER) JOIN`: Returns all records from the left table, and the matched records from the right table
* `RIGHT (OUTER) JOIN`: Returns all records from the right table, and the matched records from the left table
* `FULL (OUTER) JOIN`: Returns all records when there is a match in either left or right table

```sql
-- Inner Join Example
SELECT Orders.OrderID, Customers.CustomerName
FROM Orders
INNER JOIN Customers ON Orders.CustomerID = Customers.CustomerID;
```
"""
        else:
            explanation += f"""### SQL Database concepts: {subtopic}
SQL is structural and handles data modeling. Let's look at {subtopic} syntax and application scenarios.

```sql
-- Query example for {subtopic}
SELECT * FROM {subtopic.lower().replace(' ', '_')}
WHERE status = 'Active';
```
See the notes below for aggregate queries and schemas.
"""
    elif "AI & GenAI" in topic:
        explanation += f"""### Core Concepts of {subtopic}
Generative AI and Large Language Models (LLMs) have transformed software engineering. Here is an overview of {subtopic} and why it matters.

* **What it does**: Explains how data patterns are parsed and generative models are built.
* **Prompt Engineering**: The art of structured text formatting to direct model outputs.
* **Retrieval-Augmented Generation (RAG)**: Linking external data sources to LLMs without fine-tuning them.
* **AI Agents**: Autonomous loops that plan, use tools, and execute workflows to solve complex user tasks.

This is highly asked in Cognizant, TCS, and Google interviews.
"""
    else:
        explanation += f"""### Mastering {subtopic}
This lesson covers {subtopic} to prepare you for standard IT selection tests (Cognizant GenC/Elevate, TCS NQT, etc.).

We cover:
1. Core terminology and standard definitions
2. Step-by-step problem-solving templates
3. Walkthroughs of popular exam questions
"""

    return {
        "topic": topic,
        "subtopic": subtopic,
        "read_time_mins": 4,
        "content": explanation,
        "key_points": [
            f"Understand the syntax/principles of {subtopic}.",
            "Practice hands-on coding/queries or logical exercises.",
            "Learn how to optimize and handle exceptions.",
            "Expect direct and scenario-based interview questions on this topic."
        ]
    }

def get_mock_quiz(topic, content, count, quiz_type):
    """Generates structured quiz questions locally."""
    # Generates quiz format
    questions = []
    
    # We will generate different types of questions depending on the topic
    q_types = ["MCQ"]
    if "Python" in topic:
        q_types = ["MCQ", "PREDICT_OUTPUT"]
    elif "SQL" in topic:
        q_types = ["MCQ", "WRITE_QUERY"]
    elif "Communication" in topic:
        q_types = ["MCQ", "FIND_ERROR"]
    elif "Aptitude" in topic or "Reasoning" in topic:
        q_types = ["MCQ", "SOLVE_PROBLEM"]
    
    for i in range(count):
        q_type = random.choice(q_types)
        
        if q_type == "PREDICT_OUTPUT":
            question_text = f"What is the output of the following Python code?\n\n```python\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))\n```"
            options = ["3", "4", "An error occurs", "None"]
            correct = "4"
            explanation = "In Python, lists are mutable objects. `y = x` copies the reference to the list, not the list itself. Modifying `y` changes `x` as well."
        elif q_type == "WRITE_QUERY":
            question_text = f"Write a SQL query to find all records from the `Employees` table where `Salary` is greater than 50000, ordered by `LastName` ascending."
            options = [
                "SELECT * FROM Employees WHERE Salary > 50000 ORDER BY LastName ASC;",
                "SELECT Salary > 50000 FROM Employees SORT BY LastName;",
                "FROM Employees SELECT ALL WHERE Salary > 50000 ORDER BY LastName;",
                "SELECT * FROM Employees HAVING Salary > 50000 ASC;"
            ]
            correct = "SELECT * FROM Employees WHERE Salary > 50000 ORDER BY LastName ASC;"
            explanation = "The correct SELECT syntax uses WHERE for filtering rows and ORDER BY column ASC/DESC for sorting."
        elif q_type == "FIND_ERROR":
            question_text = "Identify the grammatical error in the following formal email sentence:\n\n'The team have completed the project and submitted it to the manager yesterday.'"
            options = [
                "Change 'have' to 'has' because 'team' is a singular collective noun.",
                "Change 'submitted' to 'submit'.",
                "Remove 'yesterday'.",
                "Change 'to the' to 'at the'."
            ]
            correct = "Change 'have' to 'has' because 'team' is a singular collective noun."
            explanation = "Collective nouns like 'team' are treated as singular in formal American English, so 'has' is grammatically correct."
        elif q_type == "SOLVE_PROBLEM":
            question_text = "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?"
            options = ["120 meters", "150 meters", "324 meters", "180 meters"]
            correct = "150 meters"
            explanation = "Speed = 60 * (5/18) m/sec = 50/3 m/sec. Distance = Speed * Time = (50/3) * 9 = 150 meters."
        else:
            # Standard MCQ
            question_text = f"Which of the following is a primary characteristic of {topic} (related to {content[:30]}...)?"
            options = [
                "Optimized state management and structure",
                "Lack of modularity and scaling issues",
                "Heavy dependency on deprecated compiler formats",
                "Incompatibility with modern API protocols"
            ]
            correct = "Optimized state management and structure"
            explanation = f"This option represents standard engineering best practices in {topic}."
            
        questions.append({
            "id": i + 1,
            "question": question_text,
            "options": options,
            "correct_answer": correct,
            "explanation": explanation,
            "question_type": q_type,
            "difficulty": random.choice(["Easy", "Medium", "Hard"])
        })
        
    return {"questions": questions}

# ==========================================
# CLAUDE API WRAPPERS IMPLEMENTATION
# ==========================================

def generate_lesson(topic, subtopic, level):
    """Generates lesson content."""
    prompt = f"""
    You are an expert IT instructor. Generate a highly detailed, clear, and comprehensive lesson on the subtopic "{subtopic}" which belongs to the main topic "{topic}".
    The target student is at level "{level}" (on a 1 to 10 scale). 
    
    Structure the lesson nicely with:
    - Estimated read time in minutes.
    - 4-5 bulleted key points to remember.
    - Detailed explanation of the concepts.
    - Practical code snippets (formatted in markdown) or queries or worked-out examples.
    - Tips for IT recruitment interviews (especially for Cognizant, TCS, and Infosys).
    
    Respond STRICTLY in JSON format with the following keys:
    {{
        "topic": "{topic}",
        "subtopic": "{subtopic}",
        "read_time_mins": <integer_number_of_minutes>,
        "content": "<detailed_lesson_markdown_string>",
        "key_points": [
            "point 1",
            "point 2",
            ...
        ]
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for generate_lesson: {e}")
            
    # Fallback
    return get_mock_lesson(topic, subtopic, level)

def generate_quiz_questions(topic, content, count=5, quiz_type="POST_LESSON"):
    """Generates quiz questions based on topic and content."""
    prompt = f"""
    Generate {count} high-quality quiz questions for the topic "{topic}".
    Reference content or lesson overview: "{content[:500]}"
    Quiz Type: {quiz_type}
    
    We need a mix of question types matching the topic:
    - Python: MCQs and 'PREDICT_OUTPUT' (snippets of code).
    - SQL: MCQs and 'WRITE_QUERY' (asking them to write the SQL query).
    - Communication: MCQs and 'FIND_ERROR' (sentence corrections).
    - Aptitude/Reasoning: MCQs and 'SOLVE_PROBLEM' (worked math/logical puzzles).
    - Other theory: standard conceptual MCQs.
    
    Each question must contain:
    - The question text
    - Exactly 4 options
    - The correct_answer (must exactly match one of the options)
    - A clear 2-3 line AI explanation of why it is correct.
    - A difficulty rating ('Easy', 'Medium', 'Hard').
    
    Respond STRICTLY in JSON format with the following schema:
    {{
        "questions": [
            {{
                "id": 1,
                "question": "question text",
                "options": ["option A", "option B", "option C", "option D"],
                "correct_answer": "correct option matching exactly",
                "explanation": "explanation of the correct choice",
                "question_type": "MCQ | PREDICT_OUTPUT | WRITE_QUERY | FIND_ERROR | SOLVE_PROBLEM",
                "difficulty": "Easy | Medium | Hard"
            }},
            ...
        ]
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for generate_quiz_questions: {e}")
            
    # Fallback
    return get_mock_quiz(topic, content, count, quiz_type)

def evaluate_quiz_answer(question, correct_answer, user_answer):
    """Evaluates a quiz answer that is written out (or MCQ check)."""
    prompt = f"""
    You are an evaluator. A student is answering a quiz question.
    Question: {question}
    Expected correct answer: {correct_answer}
    Student's answer: {user_answer}
    
    Evaluate if the student's answer is correct or conceptually correct.
    Respond strictly in JSON format with:
    {{
        "is_correct": true/false,
        "score_percentage": 0 to 100,
        "ai_explanation": "2-3 lines explaining why the student is right or wrong, and what the correct solution is.",
        "remember_tip": "A short, catchy tip or formula to remember for this concept."
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for evaluate_quiz_answer: {e}")
            
    # Fallback logic
    is_correct = (user_answer.strip().lower() == correct_answer.strip().lower())
    # SQL query or text check fallback
    if not is_correct and len(user_answer) > 5:
        # Simple similarity check
        if any(w in user_answer.lower() for w in ["select", "from", "where", "join"]):
            is_correct = True # Mock approve SQL queries that contain keywords
            
    return {
        "is_correct": is_correct,
        "score_percentage": 100 if is_correct else 0,
        "ai_explanation": f"The correct answer is '{correct_answer}'. " + ("Great job!" if is_correct else "Review the core syntax and try again."),
        "remember_tip": "Always double check for missing semicolons in SQL and proper indentation in Python."
    }

def generate_daily_tasks(weak_topics, learned_topics):
    """Generates study schedule and daily tasks based on performance history."""
    prompt = f"""
    Generate three customized daily preparation tasks for a student.
    Weak Topics (prioritize these): {weak_topics}
    Learned Topics (include some for revision): {learned_topics}
    
    Tasks must cover:
    1. Morning study task (concept/theory, 30-45 mins)
    2. Afternoon practice task (hands-on coding/writing, 45-60 mins)
    3. Evening review quiz task (15 mins)
    
    Respond strictly in JSON format with:
    {{
        "tasks": [
            {{
                "task_type": "STUDY | PRACTICE | QUIZ",
                "topic_name": "Topic name here",
                "task_description": "Specific, actionable instructions on what to study or practice.",
                "xp_points": 10,
                "time_estimate_mins": 30
            }},
            ...
        ]
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for generate_daily_tasks: {e}")
            
    # Fallback
    tasks = []
    if weak_topics:
        morning_topic = weak_topics[0]
    elif learned_topics:
        morning_topic = learned_topics[0]
    else:
        morning_topic = "Python Programming"
        
    tasks.append({
        "task_type": "STUDY",
        "topic_name": morning_topic,
        "task_description": f"Review fundamental concepts of {morning_topic} and write down key definitions.",
        "xp_points": 15,
        "time_estimate_mins": 30
    })
    tasks.append({
        "task_type": "PRACTICE",
        "topic_name": morning_topic,
        "task_description": f"Solve 2 practice problems or coding exercises related to {morning_topic}.",
        "xp_points": 25,
        "time_estimate_mins": 45
    })
    tasks.append({
        "task_type": "QUIZ",
        "topic_name": morning_topic,
        "task_description": f"Take a quick 5-question refresher quiz on {morning_topic}.",
        "xp_points": 10,
        "time_estimate_mins": 15
    })
    return {"tasks": tasks}

def conduct_interview(company, interview_type, question_number, history):
    """Generates the next interview question based on history and company focus."""
    prompt = f"""
    You are an expert interviewer for {company}. You are conducting a mock interview of type "{interview_type}".
    This is question number {question_number} of the interview.
    
    Previous conversation history (question-answer pairs):
    {json.dumps(history[-4:]) if history else 'No history. This is the first question.'}
    
    Generate the next natural interview question. 
    - If it's the first question, ask standard greeting/ice breaker questions (e.g., 'Tell me about yourself').
    - If it's technical, ask about Python, SQL, DSA, or AI.
    - If HR, ask behavioral or company-centric questions.
    - Keep questions professional, realistic, and clear.
    
    Respond strictly in JSON format with:
    {{
        "question": "The next interview question text.",
        "question_type": "TECHNICAL | HR | BEHAVIORAL"
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for conduct_interview: {e}")
            
    # Fallback questions bank
    hr_questions = [
        "Tell me about yourself and walk me through your background.",
        f"Why do you want to join {company} specifically?",
        "Where do you see yourself in 5 years?",
        "Describe your greatest strength and how it will help you succeed.",
        "Tell me about a challenging situation you faced in a project and how you overcame it."
    ]
    tech_questions = [
        "What is the difference between a list and a tuple in Python?",
        "Explain the difference between a INNER JOIN and a LEFT JOIN in SQL.",
        "What is an LLM (Large Language Model) and how does Prompt Engineering affect its responses?",
        "Explain the time complexity of Quick Sort compared to Bubble Sort.",
        "How do you handle exceptions in Python? What is the purpose of the 'finally' block?"
    ]
    
    if question_number == 1:
        q = hr_questions[0]
        q_type = "HR"
    elif interview_type == "HR":
        q = hr_questions[question_number % len(hr_questions)]
        q_type = "HR"
    elif interview_type == "TECHNICAL":
        q = tech_questions[question_number % len(tech_questions)]
        q_type = "TECHNICAL"
    else: # Mixed
        if question_number % 2 == 0:
            q = tech_questions[question_number % len(tech_questions)]
            q_type = "TECHNICAL"
        else:
            q = hr_questions[question_number % len(hr_questions)]
            q_type = "HR"
            
    return {"question": q, "question_type": q_type}

def evaluate_interview_answer(question, answer, company):
    """Evaluates an interview answer."""
    prompt = f"""
    Evaluate the following student's answer to an interview question for {company}.
    Question: {question}
    Student's Answer: {answer}
    
    Analyze and score the response.
    Respond strictly in JSON format with:
    {{
        "score": 0 to 10,
        "feedback": "2-3 sentences of feedback highlighting strengths and improvement areas.",
        "better_answer": "A model 2-3 sentence answer that the student should have given to stand out."
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for evaluate_interview_answer: {e}")
            
    # Fallback grading
    word_count = len(answer.split())
    if word_count < 10:
        score = 4
        feedback = "Your answer was too short. Try to elaborate on your points and use structured frameworks (like STAR) to support your statements."
    elif any(f in answer.lower() for f in ["um", "uh", "like", "basically", "you know"]):
        score = 6
        feedback = "Good content, but you used multiple filler words (e.g., like, basically). Practice speaking clearly and with pauses."
    else:
        score = 8
        feedback = "Well structured response. You addressed the core of the question directly. Try to add specific quantified metrics next time."
        
    return {
        "score": score,
        "feedback": feedback,
        "better_answer": f"For the question: '{question}', a good structure starts with direct statement, follows with an example, and finishes with a summary of the outcome/learning."
    }

def analyze_communication(text, exercise_type):
    """Analyzes a written email or spoken answer for grammar, clarity, tone, and filler words."""
    prompt = f"""
    You are an expert communication coach. Analyze the following text written for a "{exercise_type}" exercise.
    Text: {text}
    
    Score each of the following dimensions from 0 to 10:
    - grammar (subject-verb agreement, tenses)
    - clarity (sentence structures, word choice)
    - tone (professionalism, politeness)
    - structure (introduction, body, conclusion)
    - professional_language (vocabulary quality)
    
    Also:
    - Identify grammar mistakes and provide corrections.
    - Provide a completely corrected version.
    - Highlight specific filler words (like 'um', 'uh', 'basically', 'like') and their occurrences count.
    
    Respond strictly in JSON format with:
    {{
        "grammar_score": 0-10,
        "clarity_score": 0-10,
        "tone_score": 0-10,
        "structure_score": 0-10,
        "professional_language_score": 0-10,
        "overall_score": 0-100,
        "corrected_text": "The fully polished version of the user's text.",
        "corrections": [
            {{
                "original": "original phrase with error",
                "corrected": "corrected phrase",
                "explanation": "why this change is needed"
            }}
        ],
        "filler_words": {{
            "um": 0, "like": 0, "basically": 0, "you know": 0
        }}
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for analyze_communication: {e}")
            
    # Fallback communication analysis
    words = text.lower().split()
    fillers = {"um": 0, "like": 0, "basically": 0, "you know": 0}
    for w in words:
        if w in fillers:
            fillers[w] += 1
        elif w == "know" and "you know" in text.lower():
            # Simplistic checker
            fillers["you know"] = text.lower().count("you know")
            
    # Counts
    total_fillers = sum(fillers.values())
    grammar_score = 9 if total_fillers < 2 else 7
    clarity_score = 8 if len(text) > 30 else 5
    
    return {
        "grammar_score": grammar_score,
        "clarity_score": clarity_score,
        "tone_score": 8,
        "structure_score": 7,
        "professional_language_score": 8,
        "overall_score": int((grammar_score + clarity_score + 8 + 7 + 8) * 2),
        "corrected_text": text.replace("basically", "").replace("like", "").replace("um", ""),
        "corrections": [
            {
                "original": "basically, I worked on...",
                "corrected": "I worked on...",
                "explanation": "Avoid using filler words like 'basically' to start your sentences."
            }
        ] if total_fillers > 0 else [],
        "filler_words": fillers
    }

def generate_project_explanation(project_details):
    """Generates pitches, explanations, and answers common project questions."""
    name = project_details.get("project_name", "My Project")
    prompt = f"""
    You are an expert technical interviewer. Review these project details:
    {json.dumps(project_details)}
    
    Generate the following documents to help the student prepare:
    1. A perfect 2-minute verbal explanation script (approx 250 words) to present in interviews.
    2. A short, high-impact 30-second elevator pitch (approx 60-70 words).
    3. Answers to the 10 most common interview questions about this project.
    4. 3 technical follow-up questions specific to this project, along with strong answers.
    5. Improvement suggestions to make the project sound more professional and quantify its impact.
    
    Respond strictly in JSON format with this structure:
    {{
        "verbal_script_2min": "The 2 minute script...",
        "elevator_pitch_30s": "The 30 second pitch...",
        "common_questions": [
            {{
                "question": "e.g., Walk me through your project.",
                "answer": "A perfect, structured model answer."
            }}
        ],
        "technical_deep_dive": [
            {{
                "question": "technical question here",
                "suggested_answer": "suggested answer here"
            }}
        ],
        "impact_improvements": [
            "Use metrics like X% response time reduction instead of 'made it fast'.",
            "Explain your database schema configuration details."
        ]
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for generate_project_explanation: {e}")
            
    # Fallback project response
    return {
        "verbal_script_2min": f"My project '{name}' is designed to solve a critical problem. We used modern web tools to build a responsive architecture. I led the backend integration, structuring database queries and building API gateways. The main challenge was optimization, which we solved by caching. The project successfully achieved its core target.",
        "elevator_pitch_30s": f"'{name}' is an innovative platform that solves key workflow inefficiencies. Utilizing a modern tech stack, it achieves high scalability and seamless user experiences, serving as a standout portfolio project.",
        "common_questions": [
            {"question": "Walk me through your project.", "answer": "Start with the problem statement, list the stack, explain your contributions, and finish with the final result."},
            {"question": "What was the most challenging part?", "answer": "Explain a technical bottleneck (e.g. latency, race conditions) and your systematic solution."},
            {"question": "Why did you choose these technologies?", "answer": "Mention scalability, developer ecosystem support, and ease of deployment."}
        ],
        "technical_deep_dive": [
            {"question": "How did you manage database connection pools?", "suggested_answer": "We configured a client pool with an automatic recycling duration to avoid stale connections."}
        ],
        "impact_improvements": [
            "Quantify your load time improvements (e.g., 'reduced page load latency by 40%').",
            "Elaborate on the data storage configurations."
        ]
    }

def detect_flaws(answer_history):
    """Detects recurring patterns of mistakes (flaws) from the quiz and interview history."""
    prompt = f"""
    You are an automated diagnostic analyzer. Review the user's answer history:
    {json.dumps(answer_history[-10:])}
    
    Scan for recurring patterns of errors (3+ times):
    - Technical errors: confusing assignment vs equality, SQL joins, loops, etc.
    - Communication errors: using fillers (like, basically, um), answers too brief, informal vocabulary.
    - Interview errors: not giving examples, saying 'I think' too much, lack of structure.
    
    Respond strictly in JSON format with:
    {{
        "flaws": [
            {{
                "flaw_type": "TECHNICAL | COMMUNICATION | INTERVIEW",
                "flaw_description": "A specific description of the recurring flaw.",
                "related_topic": "The related topic or syntax element",
                "suggested_fix_task": "A specific practice task to overcome this flaw."
            }}
        ]
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for detect_flaws: {e}")
            
    # Local fallback
    flaws = []
    # Count occurrences in history
    fillers_count = 0
    short_answers = 0
    sql_errors = 0
    for h in answer_history:
        ans = h.get("user_answer", "").lower()
        if any(f in ans for f in ["basically", "um", "like", "you know"]):
            fillers_count += 1
        if len(ans.split()) < 8:
            short_answers += 1
        if "join" in h.get("question", "").lower() and not h.get("is_correct", True):
            sql_errors += 1
            
    if fillers_count >= 2:
        flaws.append({
            "flaw_type": "COMMUNICATION",
            "flaw_description": "You use filler words like 'basically' and 'like' frequently when speaking or writing.",
            "related_topic": "Spoken Communication",
            "suggested_fix_task": "Practice speaking on simple topics for 1 minute without using any filler words."
        })
    if short_answers >= 2:
        flaws.append({
            "flaw_type": "INTERVIEW",
            "flaw_description": "Your interview answers are too short (typically under 10-15 words).",
            "related_topic": "Mock Interviews",
            "suggested_fix_task": "Structure your answers using the STAR technique (Situation, Task, Action, Result) to expand them."
        })
    if sql_errors >= 2:
        flaws.append({
            "flaw_type": "TECHNICAL",
            "flaw_description": "You consistently make syntax errors when writing SQL JOIN queries.",
            "related_topic": "SQL & Database",
            "suggested_fix_task": "Review INNER vs LEFT joins and write 5 basic relational queries."
        })
    return {"flaws": flaws}

def generate_study_plan(assessment_results):
    """Generates a day-by-day 30-day study plan based on initial assessment scores."""
    prompt = f"""
    You are an educational director. Generate a personalized 30-day study plan.
    Initial topic scores (scored 1-10):
    {json.dumps(assessment_results)}
    
    Rules for the study plan:
    - Day-by-day structure (Day 1 to Day 30).
    - Prioritize weaker topics (score below 6) in the first 15 days.
    - Graduate difficulty as days progress.
    - Set clear topic, subtopic, study material, and time estimate (1-2 hours per day).
    
    Respond strictly in JSON format with:
    {{
        "days": [
            {{
                "day": 1,
                "topic": "Python Programming",
                "subtopic": "Variables and Data Types",
                "task_description": "Study variable declarations and dynamic typing. Run 5 practice scripts.",
                "time_estimate_mins": 90,
                "urgency": "High | Medium | Low"
            }},
            ...
        ]
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for generate_study_plan: {e}")
            
    # Mock fallback study plan creator
    days = []
    # Find weak topics from results
    weak_topics = [t for t, score in assessment_results.items() if score < 6]
    other_topics = [t for t, score in assessment_results.items() if score >= 6]
    
    all_topics_ordered = weak_topics + other_topics
    if not all_topics_ordered:
        all_topics_ordered = ["Python Programming", "SQL & Database", "AI & GenAI Concepts", "Data Structures & Algorithms", "Logical Reasoning", "Quantitative Aptitude", "Written Communication", "Spoken Communication"]
        
    for day in range(1, 31):
        topic = all_topics_ordered[(day - 1) % len(all_topics_ordered)]
        subtopics_map = {
            "Python Programming": ["Variables and Data Types", "Conditions and Loops", "Functions", "OOP Basics"],
            "SQL & Database": ["Basic SELECT queries", "JOINS", "Aggregate Functions"],
            "AI & GenAI Concepts": ["What is GenAI", "Prompt Engineering", "RAG & AI Agents"],
            "Data Structures & Algorithms": ["Arrays and Strings", "Stack and Queue", "Sorting Algorithms"],
            "Logical Reasoning": ["Series completion", "Coding decoding", "Blood relations"],
            "Quantitative Aptitude": ["Percentages", "Profit and Loss", "Time and Work"],
            "Written Communication": ["Formal email writing", "Grammar rules"],
            "Spoken Communication": ["Introduction speech", "Project descriptions"]
        }
        sublist = subtopics_map.get(topic, ["Basic overview"])
        subtopic = sublist[(day - 1) // len(all_topics_ordered) % len(sublist)]
        
        days.append({
            "day": day,
            "topic": topic,
            "subtopic": subtopic,
            "task_description": f"Master {subtopic} and practice relevant quiz problems.",
            "time_estimate_mins": 90,
            "urgency": "High" if topic in weak_topics else "Medium"
        })
    return {"days": days}

def generate_daily_motivation(user_stats):
    """Generates an inspirational daily quote customized to current stats."""
    prompt = f"""
    Write a short, engaging, 1-2 sentence motivational message for a student preparing for IT job interviews.
    Current stats: {json.dumps(user_stats)}
    Keep it encouraging, mentioning their current streak or focus company.
    
    Respond strictly in JSON format with:
    {{
        "quote": "Success isn't about being perfect. It's about being consistent. Keep pushing!"
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for generate_daily_motivation: {e}")
            
    # Fallback quotes
    quotes = [
        f"Keep practicing! Your focus on {user_stats.get('company', 'Cognizant')} will pay off step by step.",
        "Consistency beats talent. Keep that fire burning and maintain your study streak!",
        "Every line of code you write and every problem you solve is bringing you closer to your dream job.",
        "Struggling with a topic? That is just your brain growing. Review it today and master it tomorrow!"
    ]
    return {"quote": random.choice(quotes)}

def explain_concept_differently(topic, failed_explanation):
    """Re-explains a concept using a completely new and simple analogy because the student failed a quiz."""
    prompt = f"""
    The student failed a post-lesson quiz on "{topic}".
    The previous explanation was: "{failed_explanation[:300]}..."
    
    Re-explain the concept of "{topic}" using a completely different, highly creative, and simple real-world analogy (like baking, sports, or maps) so a complete beginner can understand it instantly. Keep it under 200 words.
    
    Respond strictly in JSON format with:
    {{
        "explanation": "The new analogy-based explanation markdown string."
    }}
    """
    ai_response = get_claude_response(prompt, response_json=True)
    if ai_response:
        try:
            return json.loads(ai_response)
        except Exception as e:
            print(f"Error parsing AI response for explain_concept_differently: {e}")
            
    # Mock analogies
    analogies = {
        "Python Programming": "Think of variables like labeled storage boxes in a warehouse. You can put shoes in, put a label 'shoes' on it, and later swap the shoes for shirts and change the label.",
        "SQL & Database": "Think of SQL JOINs like a Venn diagram or matching puzzle pieces. An INNER JOIN only keeps the matching pieces that fit together perfectly from both sides. A LEFT JOIN keeps all pieces from the left tray, and only snaps in matching pieces from the right tray if they exist.",
        "AI & GenAI Concepts": "Think of an LLM like an autocomplete dictionary on steroids. It doesn't 'think' like a human; it predicts the most likely next puzzle piece based on millions of book patterns it has seen before."
    }
    explanation = analogies.get(topic, f"Think of {topic} like learning to ride a bicycle. You start with training wheels (basics), take them off (practice), and eventually ride smoothly (mastery). Let's review the fundamental steps again.")
    return {"explanation": explanation}
