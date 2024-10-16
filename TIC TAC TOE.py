from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)

session_dir = 'Game'

if not os.path.exists(session_dir):
    os.makedirs(session_dir)
    print(f"Game directory created at: {session_dir}")

@app.route('/games/<filename>')
def game_file(filename):
    try:
        return send_from_directory(session_dir, filename)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/log', methods=['POST'])
def log_game():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({"message": "Invalid log content."}), 400

    game_count = len([name for name in os.listdir(session_dir) if os.path.isfile(os.path.join(session_dir, name))]) + 1
    filename = f'game{game_count}.json'
    filepath = os.path.join(session_dir, filename)

    with open(filepath, 'w') as log_file:
        json.dump(data, log_file)

    return jsonify({"message": f"Game logged successfully as {filename}"}), 200

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)