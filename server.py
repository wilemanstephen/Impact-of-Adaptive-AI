from flask import Flask, request, jsonify
from datetime import datetime
import os
import json

app = Flask(__name__)

def get_user_folder(username):
    folder_path = os.path.join('games', username)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    return folder_path

def get_next_game_number(username, difficulty):
    folder_path = get_user_folder(username)
    game_files = [f for f in os.listdir(folder_path) if f.startswith(f"{username}_{difficulty}")]
    return len(game_files) + 1

@app.route('/log', methods=['POST'])
def log_game():
    data = request.get_json()
    username = data.get('username', '').strip()
    difficulty = data.get('difficulty', '').strip()
    log = data.get('log', '')

    if not username or not difficulty or not log:
        return jsonify({'error': 'Missing required fields'}), 400

    game_number = get_next_game_number(username, difficulty)
    game_filename = f"{username}_{difficulty}_game{game_number}.json"
    folder_path = get_user_folder(username)
    game_filepath = os.path.join(folder_path, game_filename)

    with open(game_filepath, 'w') as game_file:
        json.dump({'log': log}, game_file)

    return jsonify({'message': 'Game logged successfully'})

@app.route('/games/<username>/<game_id>', methods=['GET'])
def get_game(username, game_id):
    folder_path = get_user_folder(username)
    game_filepath = os.path.join(folder_path, f"{game_id}.json")

    if not os.path.exists(game_filepath):
        return jsonify({'error': 'Game not found'}), 404

    with open(game_filepath, 'r') as game_file:
        game_data = json.load(game_file)

    return jsonify(game_data)

if __name__ == '__main__':
    if not os.path.exists('games'):
        os.makedirs('games')
    app.run(debug=True)