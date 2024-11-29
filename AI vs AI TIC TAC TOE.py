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
        [0, 1, 2], 
        [3, 4, 5], 
        [6, 7, 8],
        [0, 3, 6], 
        [1, 4, 7], 
        [2, 5, 8],
        [0, 4, 8], 
        [2, 4, 6]
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
        [0, 1, 2], 
        [3, 4, 5], 
        [6, 7, 8],
        [0, 3, 6], 
        [1, 4, 7], 
        [2, 5, 8],
        [0, 4, 8], 
        [2, 4, 6]
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

    x_win_ratios = x_win_ratios[1:]
    o_win_ratios = o_win_ratios[1:]

    stats_folder = os.path.join('stats_TIC_TAC_TOE', f'{ai1_difficulty}_{ai2_difficulty}')
    if not os.path.exists(stats_folder):
        os.makedirs(stats_folder)

    plt.figure(figsize=(10, 6))
    plt.plot(range(1, len(x_win_ratios) + 1), x_win_ratios, label="X Win %", color='blue')
    plt.plot(range(1, len(o_win_ratios) + 1), o_win_ratios, label="O Win %", color='red')
    plt.fill_between(range(1, len(x_win_ratios) + 1), x_win_ratios, o_win_ratios, where=(np.array(x_win_ratios) >= np.array(o_win_ratios)), color='blue', alpha=0.1)
    plt.fill_between(range(1, len(x_win_ratios) + 1), x_win_ratios, o_win_ratios, where=(np.array(o_win_ratios) > np.array(x_win_ratios)), color='red', alpha=0.1)
    plt.xlabel("Number of Games")
    plt.ylabel("Win Percentage")
    plt.ylim(0, 100)
    plt.title(f"AI vs AI: {ai1_difficulty} (X) vs {ai2_difficulty} (O)")
    
    x_win_patch = mpatches.Patch(color='blue', label=f"Final X Win %: {x_win_ratios[-1]:.2f}%")
    o_win_patch = mpatches.Patch(color='red', label=f"Final O Win %: {o_win_ratios[-1]:.2f}%")
    tie_patch = mpatches.Patch(color='gray', label=f"Overall Tie %: {(ties / num_games) * 100:.2f}%")
    
    plt.legend(handles=[x_win_patch, o_win_patch, tie_patch], loc="upper left", prop={'size': 10})
    plt.savefig(os.path.join(stats_folder, f'{ai1_difficulty}_{ai2_difficulty}.jpg'))
    plt.close()

    return np.array(x_win_ratios), np.array(o_win_ratios), x_wins, o_wins, ties

def create_heatmaps(ai1_difficulty, ai2_difficulty):
    win_count = np.zeros((3, 3))
    lose_count = np.zeros((3, 3))
    tie_count = np.zeros((3, 3))
    game_count = np.zeros((3, 3))

    games_folder = os.path.join('games_TIC_TAC_TOE', f'{ai1_difficulty}_{ai2_difficulty}')
    for game_file in os.listdir(games_folder):
        if game_file.endswith('.json'):
            with open(os.path.join(games_folder, game_file), 'r') as json_file:
                game_log = json.load(json_file)
                winning_moves = game_log["Winning Move"]
                winner = game_log["Winner"]
                first_move = int(game_log["Moves"][0].split(': ')[1])

                row, col = divmod(first_move, 3)
                game_count[row][col] += 1

                if winner == "X":
                    win_count[row][col] += 1
                elif winner == "O":
                    lose_count[row][col] += 1
                else:
                    tie_count[row][col] += 1

    win_rate = np.divide(win_count, game_count, out=np.zeros_like(win_count), where=game_count != 0) * 100
    lose_rate = np.divide(lose_count, game_count, out=np.zeros_like(lose_count), where=game_count != 0) * 100
    tie_rate = np.divide(tie_count, game_count, out=np.zeros_like(tie_count), where=game_count != 0) * 100

    stats_folder = os.path.join('stats_TIC_TAC_TOE', f'{ai1_difficulty}_{ai2_difficulty}')
    if not os.path.exists(stats_folder):
        os.makedirs(stats_folder)

    # Win Rate Heatmap
    plt.figure(figsize=(8, 8))
    plt.imshow(win_rate, cmap='Greens', interpolation='nearest', vmin=0, vmax=100)
    for i in range(3):
        for j in range(3):
            text_color = 'white' if win_rate[i, j] > 50 else 'black'
            plt.text(j, i, f'{win_rate[i, j]:.1f}%', ha='center', va='center', color=text_color, fontsize=12)
    plt.xticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
    plt.yticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
    plt.xlabel('Column')
    plt.ylabel('Row')
    plt.title(f'Win Rate Heatmap ({ai1_difficulty} vs {ai2_difficulty})')
    plt.colorbar(label='Win Rate (%)')
    heatmap_path = os.path.join(stats_folder, f'{ai1_difficulty}_{ai2_difficulty}_HEATMAP_WIN.jpg')
    plt.savefig(heatmap_path)
    plt.close()

    # Lose Rate Heatmap
    plt.figure(figsize=(8, 8))
    plt.imshow(lose_rate, cmap='Reds', interpolation='nearest', vmin=0, vmax=100)
    for i in range(3):
        for j in range(3):
            text_color = 'white' if lose_rate[i, j] > 50 else 'black'
            plt.text(j, i, f'{lose_rate[i, j]:.1f}%', ha='center', va='center', color=text_color, fontsize=12)
    plt.xticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
    plt.yticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
    plt.xlabel('Column')
    plt.ylabel('Row')
    plt.title(f'Lose Rate Heatmap ({ai1_difficulty} vs {ai2_difficulty})')
    plt.colorbar(label='Lose Rate (%)')
    heatmap_path = os.path.join(stats_folder, f'{ai1_difficulty}_{ai2_difficulty}_HEATMAP_LOSE.jpg')
    plt.savefig(heatmap_path)
    plt.close()

    # Tie Rate Heatmap
    plt.figure(figsize=(8, 8))
    plt.imshow(tie_rate, cmap='Greys', interpolation='nearest', vmin=0, vmax=100)
    for i in range(3):
        for j in range(3):
            text_color = 'white' if tie_rate[i, j] > 50 else 'black'
            plt.text(j, i, f'{tie_rate[i, j]:.1f}%', ha='center', va='center', color=text_color, fontsize=12)
    plt.xticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
    plt.yticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
    plt.xlabel('Column')
    plt.ylabel('Row')
    plt.title(f'Tie Rate Heatmap ({ai1_difficulty} vs {ai2_difficulty})')
    plt.colorbar(label='Tie Rate (%)')
    heatmap_path = os.path.join(stats_folder, f'{ai1_difficulty}_{ai2_difficulty}_HEATMAP_TIE.jpg')
    plt.savefig(heatmap_path)
    plt.close()

def main():
    ai1_difficulty = "Defensive"
    ai2_difficulty = "Defensive"
    run_simulations(ai1_difficulty, ai2_difficulty, 1000)
    create_heatmaps(ai1_difficulty, ai2_difficulty)

if __name__ == "__main__":
    main()