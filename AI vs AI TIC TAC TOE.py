import random
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os
import json

EASY = "Easy"
DEFENSIVE = "Defensive"
OFFENSIVE = "Offensive"
OPTIMAL = "Optimal"

def ai_move(difficulty, board):
    available_moves = [i for i, v in enumerate(board) if v == " "]
    if difficulty == EASY:
        return random.choice(available_moves)
    elif difficulty == DEFENSIVE:
        if 4 in available_moves:
            return 4
        move = find_critical_move(board, "O")
        if move is not None:
            return move
        return random.choice(available_moves)
    elif difficulty == OFFENSIVE:
        move = find_critical_move(board, "O")
        if move is not None:
            return move
        move = find_critical_move(board, "X")
        if move is not None:
            return move
        return random.choice(available_moves)
    elif difficulty == OPTIMAL:
        return adaptive_strategy(board)
    return random.choice(available_moves)

def find_critical_move(board, player):
    win_combinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]
    for combo in win_combinations:
        values = [board[i] for i in combo]
        if values.count(player) == 2 and values.count(" ") == 1:
            return combo[values.index(" ")]
    return None

def adaptive_strategy(board):
    if " " not in board:
        return None
    difficulties = [OFFENSIVE, DEFENSIVE, EASY]
    for difficulty in difficulties:
        move = ai_move(difficulty, board)
        if move is not None:
            return move
    return random.choice([i for i, v in enumerate(board) if v == " "])

def check_winner(board, player):
    win_combinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]
    for combo in win_combinations:
        if all(board[i] == player for i in combo):
            return True, combo
    return False, []

def simulate_game(ai1_difficulty, ai2_difficulty):
    board = [" "] * 9
    current_player = "X"
    moves = []
    for _ in range(9):
        if current_player == "X":
            move = ai_move(ai1_difficulty, board)
            board[move] = "X"
            moves.append(f"X: {move}")
            is_winner, winning_combo = check_winner(board, "X")
            if is_winner:
                return "X", "O", moves, winning_combo
            current_player = "O"
        else:
            move = ai_move(ai2_difficulty, board)
            board[move] = "O"
            moves.append(f"O: {move}")
            is_winner, winning_combo = check_winner(board, "O")
            if is_winner:
                return "O", "X", moves, winning_combo
            current_player = "X"
    return "Tie", "Tie", moves, []

def run_simulations(ai1_difficulty, ai2_difficulty, num_games=1000):
    x_wins = 0
    o_wins = 0
    ties = 0
    x_win_ratios = [0]
    o_win_ratios = [0]

    games_folder = os.path.join('games_TIC_TAC_TOE', f'{ai1_difficulty}_{ai2_difficulty}')
    if not os.path.exists(games_folder):
        os.makedirs(games_folder)

    for i in range(1, num_games + 1):
        winner, loser, moves, winning_moves = simulate_game(ai1_difficulty, ai2_difficulty)
        if winner == "X":
            x_wins += 1
        elif winner == "O":
            o_wins += 1
        else:
            ties += 1

        x_win_percentage = (x_wins / i) * 100
        o_win_percentage = (o_wins / i) * 100
        x_win_ratios.append(x_win_percentage)
        o_win_ratios.append(o_win_percentage)

        game_log = {
            "Winner": winner,
            "Loser": loser,
            "Moves": moves,
            "Winning Move": winning_moves
        }

        with open(os.path.join(games_folder, f'game_{i}.json'), 'w') as json_file:
            json.dump(game_log, json_file, indent=4)

    return np.array(x_win_ratios), np.array(o_win_ratios), x_wins, o_wins, ties

def main():
    ai1_difficulty = "Offensive"
    ai2_difficulty = "Optimal"
    
    x_win_ratios, o_win_ratios, x_wins, o_wins, ties = run_simulations(ai1_difficulty, ai2_difficulty, 1000)
    
    total_games = x_wins + o_wins + ties
    x_win_percentage = (x_wins / total_games) * 100
    o_win_percentage = (o_wins / total_games) * 100
    tie_percentage = (ties / total_games) * 100
    
    plt.figure(figsize=(10, 6))
    plt.plot(range(len(x_win_ratios)), x_win_ratios, label="X Win %", color='blue')
    plt.plot(range(len(o_win_ratios)), o_win_ratios, label="O Win %", color='red')
    plt.fill_between(range(len(x_win_ratios)), x_win_ratios, o_win_ratios, where=(x_win_ratios >= o_win_ratios), color='blue', alpha=0.1)
    plt.fill_between(range(len(x_win_ratios)), x_win_ratios, o_win_ratios, where=(o_win_ratios > x_win_ratios), color='red', alpha=0.1)
    plt.xlabel("Number of Games")
    plt.ylabel("Win Percentage")
    plt.ylim(0, 100)
    plt.title(f"AI vs AI: {ai1_difficulty} (X) vs {ai2_difficulty} (O)")
    
    x_win_patch = mpatches.Patch(color='blue', label=f"Final X Win %: {x_win_percentage:.2f}%")
    o_win_patch = mpatches.Patch(color='red', label=f"Final O Win %: {o_win_percentage:.2f}%")
    tie_patch = mpatches.Patch(color='gray', label=f"Overall Tie %: {tie_percentage:.2f}%")
    
    plt.legend(handles=[x_win_patch, o_win_patch, tie_patch], loc="upper left", prop={'size': 10})
    
    if not os.path.exists('stats_TIC_TAC_TOE'):
        os.makedirs('stats_TIC_TAC_TOE')
    plt.savefig(f'stats_TIC_TAC_TOE/{ai1_difficulty}_{ai2_difficulty}.jpg')
    plt.show()

if __name__ == "__main__":
    main()