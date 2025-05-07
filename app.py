from flask import Flask, render_template, jsonify, request, redirect, url_for
import requests
import base64
import urllib.parse
import os

app = Flask(__name__)

# Spotify Credentials (Replace with your Client ID and Secret)
SPOTIFY_CLIENT_ID = 'a35589b0fae4486399adea450949c43b'
SPOTIFY_CLIENT_SECRET = '46536ebad464496186d8601b1c0f0e6c'
SPOTIFY_REDIRECT_URI = 'http://localhost:5000/callback'

# Data
prev_exercises = [
    {"name": "Tadasana", "description": "Stand tall, stretch upward.", "video": "https://www.youtube.com/watch?v=66Oh0eFNsjo", "duration": 30},
    {"name": "Masai Jump", "description": "Jump vertically (3 sets of 20).", "video": "https://www.youtube.com/watch?v=3Twwu1ADpoU", "duration": 300},
    {"name": "Cobra Pose", "description": "Lift chest from prone position.", "video": "https://www.youtube.com/watch?v=66Oh0eFNsjo", "duration": 30}
]

year_plan = {
    "beginner": [
        {"month": 1, "exercises": [
            {"name": "Bodyweight Squats", "description": "3 sets of 10.", "video": "https://www.youtube.com/watch?v=aclHkVaku9U", "duration": 180},
            {"name": "Push-ups (Knee)", "description": "3 sets of 8.", "video": "https://www.youtube.com/watch?v=IODxDxX7oi4", "duration": 180}
        ]},
        {"month": 2, "exercises": [
            {"name": "Lunges", "description": "3 sets of 10 per leg.", "video": "https://www.youtube.com/watch?v=QOVaHwm-Q6U", "duration": 180},
            {"name": "Plank", "description": "3 sets of 20s.", "video": "https://www.youtube.com/watch?v=pSHjTRCQxIw", "duration": 60}
        ]}
    ],
    "medium": [
        {"month": 1, "exercises": [
            {"name": "Jump Squats", "description": "3 sets of 12.", "video": "https://www.youtube.com/watch?v=A3h6uZc7b3c", "duration": 180},
            {"name": "Push-ups (Standard)", "description": "3 sets of 12.", "video": "https://www.youtube.com/watch?v=IODxDxX7oi4", "duration": 180}
        ]}
    ],
    "advanced": [
        {"month": 1, "exercises": [
            {"name": "Plyometric Push-ups", "description": "3 sets of 10.", "video": "https://www.youtube.com/watch?v=5r5z1z3YQ6c", "duration": 180},
            {"name": "Pistol Squats", "description": "3 sets of 8 per leg.", "video": "https://www.youtube.com/watch?v=k1PD7D3r3Ek", "duration": 180}
        ]}
    ]
}

meals = [
    {"name": "Breakfast", "description": "Oatmeal, banana, egg.", "nutrients": "Carbs, protein"},
    {"name": "Lunch", "description": "Chicken wrap, avocado.", "nutrients": "Protein, fats"},
    {"name": "Dinner", "description": "Salmon, quinoa, broccoli.", "nutrients": "Protein, carbs"}
]

resources = {
    "exercise_videos": [
        {"title": "Masai Jump Tutorial", "url": "https://www.youtube.com/watch?v=3Twwu1ADpoU", "reddit": "https://www.reddit.com/r/bodyweightfitness", "x": "https://x.com/Fitness"},
        {"title": "Tadasana Guide", "url": "https://www.youtube.com/watch?v=66Oh0eFNsjo", "reddit": "https://www.reddit.com/r/yoga", "x": "https://x.com/YogaJournal"}
    ],
    "important_videos": [
        {"title": "Beginner Fitness", "url": "https://www.youtube.com/watch?v=ml6fY2rXz4Y"},
        {"title": "Nutrition Basics", "url": "https://www.youtube.com/watch?v=zvMBmJkC_2s"}
    ]
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/exercise_todo')
def exercise_todo():
    return render_template('exercise_todo.html')

@app.route('/custom_todo')
def custom_todo():
    return render_template('custom_todo.html')

@app.route('/exercise_videos')
def exercise_videos():
    return render_template('exercise_videos.html')

@app.route('/important_videos')
def important_videos():
    return render_template('important_videos.html')

@app.route('/songs')
def songs():
    return render_template('songs.html')

@app.route('/blog')
def blog():
    return render_template('blog.html')

@app.route('/code_editor')
def code_editor():
    return render_template('code_editor.html')

@app.route('/api/prev_exercises')
def get_prev_exercises():
    return jsonify(prev_exercises)

@app.route('/api/year_plan')
def get_year_plan():
    return jsonify(year_plan)

@app.route('/api/meals')
def get_meals():
    return jsonify(meals)

@app.route('/api/resources')
def get_resources():
    return jsonify(resources)

@app.route('/api/update_links', methods=['POST'])
def update_links():
    data = request.get_json()
    if 'resource' in data:
        category = data['resource']['category']
        title = data['resource']['title']
        url = data['resource']['url']
        reddit = data['resource'].get('reddit', '')
        x = data['resource'].get('x', '')
        for res in resources[category]:
            if res['title'] == title:
                res.update({"url": url, "reddit": reddit, "x": x})
                break
        else:
            resources[category].append({"title": title, "url": url, "reddit": reddit, "x": x})
    return jsonify({"status": "success"})

@app.route('/api/delete_resource', methods=['POST'])
def delete_resource():
    data = request.get_json()
    category = data['category']
    title = data['title']
    resources[category] = [res for res in resources[category] if res['title'] != title]
    return jsonify({"status": "success"})

@app.route('/spotify_login')
def spotify_login():
    scope = 'user-read-playback-state user-modify-playback-state streaming'
    auth_url = 'https://accounts.spotify.com/authorize?' + urllib.parse.urlencode({
        'response_type': 'code',
        'client_id': SPOTIFY_CLIENT_ID,
        'scope': scope,
        'redirect_uri': SPOTIFY_REDIRECT_URI
    })
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_url = 'https://accounts.spotify.com/api/token'
    auth_str = base64.b64encode(f'{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}'.encode()).decode()
    headers = {'Authorization': f'Basic {auth_str}'}
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIFY_REDIRECT_URI
    }
    response = requests.post(token_url, headers=headers, data=data)
    token_data = response.json()
    access_token = token_data.get('access_token')
    return render_template('songs.html', spotify_token=access_token)

@app.route('/api/save_code', methods=['POST'])
def save_code():
    data = request.get_json()
    filename = data.get('filename')
    content = data.get('content')
    try:
        with open(filename, 'w') as f:
            f.write(content)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/read_code', methods=['POST'])
def read_code():
    data = request.get_json()
    filename = data.get('filename')
    try:
        with open(filename, 'r') as f:
            content = f.read()
        return jsonify({"status": "success", "content": content})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True)