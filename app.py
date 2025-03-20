from openai import OpenAI



from flask import Flask, request, jsonify, render_template, session
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=60)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('user_input', '')

        if 'meal_preferences' not in session:
            session['meal_preferences'] = {
                'diet': 'balanced',
                'allergies': [],
                'favorite_cuisines': []
            }

        meal_response = ""

        # Meal Planning Features
        if "set my diet to" in user_input.lower():
            diet = user_input.split("set my diet to")[-1].strip()
            session['meal_preferences']['diet'] = diet
            meal_response = f"✅ Your diet preference is now set to {diet}."

        elif "i am allergic to" in user_input.lower():
            allergy = user_input.split("i am allergic to")[-1].strip()
            session['meal_preferences']['allergies'].append(allergy)
            meal_response = f"🚫 Noted! We will avoid {allergy} in your meal suggestions."

        elif "suggest a meal" in user_input.lower():
            diet = session['meal_preferences']['diet']
            allergies = session['meal_preferences']['allergies']
            meal_response = f"🍽️ Based on your {diet} diet and allergies ({', '.join(allergies) if allergies else 'none'}), here's a meal suggestion: \n"
            meal_response += "Grilled salmon with quinoa and roasted vegetables."

        session.modified = True

        # AI Response Generation
        messages = [{
            "role": "system",
            "content": "You are a meal planner assistant. Structure responses as follows:\n"
                       "1. First, respond to meal preferences, allergies, or requests.\n"
                       "2. Then, suggest healthy meal options based on the user's input.\n"
                       "3. Provide nutritional insights where applicable."
        }]

        messages.append({"role": "user", "content": user_input})

        completion = client.chat.completions.create(model="gpt-3.5-turbo",
        messages=messages)

        full_response = f"{meal_response}\n{completion.choices[0].message.content}"
        return jsonify({"response": full_response})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"response": "Something went wrong. Please try again."}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
