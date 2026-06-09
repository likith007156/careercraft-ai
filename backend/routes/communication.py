from flask import Blueprint, jsonify, request
from backend.models.database import query_db, execute_db
from backend.models.learning_tracker import add_xp
from backend.services.claude_service import analyze_communication, get_claude_response
import datetime
import random
import json

communication_bp = Blueprint("communication", __name__)

DAILY_VOCAB = [
    {
        "word": "Leverage",
        "meaning": "Use something to maximum advantage.",
        "example": "We can leverage our open-source tools to build CareerCraft AI faster.",
        "tip": "Great for explaining technical choices in interviews."
    },
    {
        "word": "Synergy",
        "meaning": "The interaction of elements that when combined produce a total effect that is greater than the sum of the individual contributions.",
        "example": "Our team exhibited excellent synergy during the hackathon.",
        "tip": "Use this in HR behavior questions to describe team projects."
    },
    {
        "word": "Scalable",
        "meaning": "Able to be measured or graded according to a scale; specifically, an architecture that handles growth smoothly.",
        "example": "SQLite is great for development, but PostgreSQL is more scalable for millions of users.",
        "tip": "Use when describing database or backend choices."
    },
    {
        "word": "Iterate",
        "meaning": "Perform repeatedly; specifically, updating code templates based on developer trials.",
        "example": "We plan to iterate on the user interface based on user feedback.",
        "tip": "Shows you follow Agile principles."
    },
    {
        "word": "Obsolete",
        "meaning": "No longer produced or used; out of date.",
        "example": "Traditional code structures are becoming obsolete with AI assistance.",
        "tip": "Useful when discussing the impact of Generative AI."
    }
]

GD_TOPICS = [
    "AI will replace coding jobs - for or against",
    "Remote work vs office work: Which is more productive?",
    "Social media impact on youth: Connection or distraction?",
    "Technology in education: Bridging gaps or widening them?"
]

@communication_bp.route("/api/communication/vocabulary", methods=["GET"])
def get_vocabulary():
    return jsonify({"vocabulary": DAILY_VOCAB})

@communication_bp.route("/api/communication/write/evaluate", methods=["POST"])
def evaluate_writing():
    data = request.json or {}
    text = data.get("text", "").strip()
    email_type = data.get("email_type", "Formal request email")
    
    if not text:
        return jsonify({"error": "Email text is required"}), 400
        
    analysis = analyze_communication(text, f"Email writing: {email_type}")
    
    # Award XP for writing practice
    xp_res = add_xp(35)
    
    # Update written communication completion in topics_learned
    # Select or create topic row
    existing = query_db("SELECT id, completion_percentage FROM topics_learned WHERE topic_name = 'Written Communication' AND subtopic_name = 'Formal email writing'", one=True)
    if existing:
        new_completion = min(100, existing["completion_percentage"] + 15)
        execute_db(
            "UPDATE topics_learned SET completion_percentage = ?, date_learned = ? WHERE id = ?",
            (new_completion, datetime.date.today().isoformat(), existing["id"])
        )
    else:
        execute_db(
            "INSERT INTO topics_learned (topic_name, subtopic_name, date_learned, completion_percentage, times_reviewed, mastery_level) VALUES (?, ?, ?, ?, 0, 2)",
            ("Written Communication", "Formal email writing", datetime.date.today().isoformat(), 25)
        )
        
    return jsonify({
        "success": True,
        "analysis": analysis,
        "xp_gained": 35,
        "total_xp": xp_res["total_xp"],
        "current_level": xp_res["current_level"]
    })

@communication_bp.route("/api/communication/speak/evaluate", methods=["POST"])
def evaluate_speaking():
    data = request.json or {}
    text = data.get("text", "").strip()
    topic = data.get("topic", "Introduce yourself")
    
    if not text:
        return jsonify({"error": "Transcribed text is required"}), 400
        
    analysis = analyze_communication(text, f"Speaking evaluation: {topic}")
    
    # Compute pace (WPM: Words Per Minute)
    # Assume typical speaking time is 60 seconds
    word_count = len(text.split())
    pace_desc = "Standard"
    if word_count < 90:
        pace_desc = "Too slow (less than 90 WPM). Try to speak more fluently."
    elif word_count > 150:
        pace_desc = "Too fast (more than 150 WPM). Slow down and enunciate."
    else:
        pace_desc = "Optimal (110-140 WPM). Excellent speaking speed!"
        
    analysis["pace_description"] = pace_desc
    analysis["word_count"] = word_count
    
    # Award XP for speaking practice
    xp_res = add_xp(45)
    
    # Update spoken communication completion in topics_learned
    existing = query_db("SELECT id, completion_percentage FROM topics_learned WHERE topic_name = 'Spoken Communication' AND subtopic_name = 'Introduction speech'", one=True)
    if existing:
        new_completion = min(100, existing["completion_percentage"] + 15)
        execute_db(
            "UPDATE topics_learned SET completion_percentage = ?, date_learned = ? WHERE id = ?",
            (new_completion, datetime.date.today().isoformat(), existing["id"])
        )
    else:
        execute_db(
            "INSERT INTO topics_learned (topic_name, subtopic_name, date_learned, completion_percentage, times_reviewed, mastery_level) VALUES (?, ?, ?, ?, 0, 2)",
            ("Spoken Communication", "Introduction speech", datetime.date.today().isoformat(), 25)
        )
        
    return jsonify({
        "success": True,
        "analysis": analysis,
        "xp_gained": 45,
        "total_xp": xp_res["total_xp"],
        "current_level": xp_res["current_level"]
    })

@communication_bp.route("/api/communication/gd/start", methods=["POST"])
def start_group_discussion():
    # Pick a random GD topic
    topic = random.choice(GD_TOPICS)
    
    # Opening remarks from virtual participant Rohan
    rohan_remarks = f"Hello everyone, I would like to initiate this discussion. Today we are talking about '{topic}'. In my opinion, this is a very relevant topic. Technology is growing fast, and we must adapt quickly. Rohan, for instance, believes that the impact is double-edged. Let's start with your thoughts."
    
    return jsonify({
        "topic": topic,
        "history": [
            {"speaker": "Moderator", "message": f"Welcome to the Group Discussion. The topic is: '{topic}'. You have 5 rounds to interact with the participants. Speak clearly."},
            {"speaker": "Rohan (Participant)", "message": rohan_remarks}
        ],
        "round": 1
    })

@communication_bp.route("/api/communication/gd/respond", methods=["POST"])
def respond_group_discussion():
    """
    User submits statement, next participant responds, or after 5 rounds we evaluate.
    JSON body:
    {
        "topic": "Topic name",
        "user_message": "User's argument",
        "history": [...],
        "round": 2
    }
    """
    data = request.json or {}
    topic = data.get("topic")
    user_message = data.get("user_message", "").strip()
    history = data.get("history", [])
    current_round = data.get("round", 1)
    
    if not user_message:
        return jsonify({"error": "Your response is required"}), 400
        
    # Append user statement
    new_history = history.copy()
    new_history.append({"speaker": "You", "message": user_message})
    
    # If final round (round 5), evaluate the user's participation
    if current_round >= 5:
        # Evaluate user contributions
        user_statements = [h["message"] for h in new_history if h["speaker"] == "You"]
        combined_text = " ".join(user_statements)
        
        evaluation = analyze_communication(combined_text, f"GD Simulator: {topic}")
        # Add special GD feedback keys
        score = evaluation["overall_score"]
        
        # Award final GD XP
        xp_res = add_xp(100)
        
        return jsonify({
            "history": new_history,
            "completed": True,
            "round": current_round,
            "scorecard": {
                "overall_score": score,
                "analytical_score": evaluation["clarity_score"],
                "politeness_score": evaluation["tone_score"],
                "summary": f"You participated actively for {len(user_statements)} rounds. " + evaluation["corrected_text"][:200],
                "feedback": "Great opening statements. Try to address other participants by name (e.g., 'As Rohan pointed out...') to show active listening skills.",
                "xp_gained": 100,
                "total_xp": xp_res["total_xp"]
            }
        })
        
    # Generate the next virtual participant response (e.g., Sneha or Rohan)
    next_speaker = "Sneha (Participant)" if current_round % 2 == 1 else "Rohan (Participant)"
    
    prompt = f"""
    You are participating in a group discussion on the topic "{topic}".
    The discussion history so far is:
    {json.dumps(new_history[-4:])}
    
    Respond naturally to the user's last statement. Act as a college student participant named {next_speaker.split()[0]}.
    Keep your response brief (2-3 sentences), either slightly agreeing or offering a clean alternative perspective.
    Keep the tone polite and collaborative.
    """
    
    ai_response = get_claude_response(prompt)
    if not ai_response:
        # Fallback response
        opinions = [
            "I agree with your point. In addition to that, we must consider the infrastructural readiness of rural schools.",
            "That is an interesting viewpoint. However, don't you think cost is a major constraint in implementing this technology?",
            "True. But let's also analyze how this affects human relationships and peer-to-peer communication."
        ]
        ai_response = random.choice(opinions)
        
    new_history.append({"speaker": next_speaker, "message": ai_response})
    
    return jsonify({
        "history": new_history,
        "completed": False,
        "round": current_round + 1
    })
