from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

session_number = 1
game_count = 1
session_dir = None

if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
    while os.path.exists(f'session_{session_number}'):
        session_number += 1

    session_dir = f'session_{session_number}'
    os.makedirs(session_dir)
    print(f"Session directory created: {session_dir}")

@app.route('/log', methods=['POST'])
def log_game():
    global game_count
    if not session_dir:
        return jsonify({"message": "Session directory not initialized."}), 500

    data = request.json
    log_content = data.get('log')

    if log_content is None:
        return jsonify({"message": "Invalid log content."}), 400

    filename = os.path.join(session_dir, f"game{game_count}.txt")
    with open(filename, 'w') as log_file:
        log_file.write(log_content)
    
    game_count += 1
    return jsonify({"message": f"Game logged successfully as game{game_count - 1}"}), 200

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)