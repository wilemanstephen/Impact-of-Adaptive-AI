import tkinter as tk
from tkinter import messagebox
import random
import os
import json
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.patches as mpatches

class TicTacToe:
    def __init__(self):
        self.username = None
        self.base_directory = None
        self.create_login_popup()

    def create_login_popup(self):
        self.login_popup = tk.Tk()
        self.login_popup.title("Login")
        self.login_popup.geometry("300x150")
        self.login_popup.configure(bg="#333")

        tk.Label(self.login_popup, text="Enter your username:", bg="#333", fg="white",
                 font=("Arial", 12)).pack(pady=10)

        self.username_entry = tk.Entry(self.login_popup, font=("Arial", 12))
        self.username_entry.pack(pady=5)

        tk.Button(self.login_popup, text="Start Game", bg="#555", fg="white", font=("Arial", 12),
                  command=self.start_game).pack(pady=10)

        self.login_popup.mainloop()

    def start_game(self):
        self.username = self.username_entry.get().strip()
        if self.username:
            self.login_popup.destroy()
            self.create_user_directory()
            self.init_game()
        else:
            messagebox.showerror("Error", "Username cannot be empty.")

    def create_user_directory(self):
        root_directory = os.path.join(os.getcwd(), "Game Data TIC TAC TOE")
        os.makedirs(root_directory, exist_ok=True)
        self.base_directory = os.path.join(root_directory, self.username)
        os.makedirs(os.path.join(self.base_directory, "games"), exist_ok=True)
        os.makedirs(os.path.join(self.base_directory, "stats"), exist_ok=True)

    def save_game_log(self, winner, loser, moves, winning_moves):
        game_log = {
            "Difficulty": self.current_difficulty,
            "Winner": winner,
            "Loser": loser,
            "Moves": moves,
            "Winning Move": winning_moves
        }

        games_folder = os.path.join(self.base_directory, "games")
        game_files = len([name for name in os.listdir(games_folder) if name.endswith('.json')])
        game_filename = os.path.join(games_folder, f'game_{game_files + 1}.json')

        with open(game_filename, 'w') as json_file:
            json.dump(game_log, json_file, indent=4)

        self.update_stats()

    def init_game(self):
        self.root = tk.Tk()
        self.root.title("Tic Tac Toe")
        self.root.configure(bg="#333")

        self.difficulties = ["Easy", "Defensive", "Offensive", "Optimal"]
        self.current_difficulty = "Easy"
        self.player = 'X'
        self.ai = 'O'
        self.board = [None] * 9
        self.player_score = 0
        self.ai_score = 0
        self.moves = []

        self.cells = []
        self.create_ui()
        self.update_difficulty()
        self.root.mainloop()

    def create_ui(self):
        self.info_label = tk.Label(self.root, text=f"Difficulty: {self.current_difficulty}\nPlayer: {self.username}",
                                   bg="#333", fg="white", font=("Arial", 16))
        self.info_label.pack(pady=10)

        self.grid_frame = tk.Frame(self.root, bg="#333")
        self.grid_frame.pack()

        for i in range(9):
            button = tk.Button(self.grid_frame, text="", font=("Arial", 20), width=5, height=2,
                                bg="#333", fg="white", command=lambda i=i: self.player_turn(i))
            button.grid(row=i // 3, column=i % 3, padx=5, pady=5)
            self.cells.append(button)

        self.reset_button = tk.Button(self.root, text="Reset", bg="#555", fg="white",
                                       font=("Arial", 12), command=self.reset_game)
        self.reset_button.pack(pady=10)

    def player_turn(self, index):
        if self.board[index] is None:
            self.make_move(index, self.player)
            self.moves.append(f"X: {index}")
            if not self.check_game_over(self.player):
                self.ai_turn()

    def ai_turn(self):
        index = self.get_ai_move()
        self.make_move(index, self.ai)
        self.moves.append(f"O: {index}")
        self.check_game_over(self.ai)

    def make_move(self, index, player):
        self.board[index] = player
        self.cells[index].config(text=player, fg="blue" if player == 'X' else "red")

    def get_ai_move(self):
        if self.current_difficulty == "Easy":
            return self.random_move()
        elif self.current_difficulty == "Defensive":
            return self.defensive_move()
        elif self.current_difficulty == "Offensive":
            return self.offensive_move()
        else:
            return self.optimal_move()

    def random_move(self):
        return random.choice([i for i in range(9) if self.board[i] is None])

    def defensive_move(self):
        move = self.find_critical_move(self.ai)
        if move is not None:
            return move
        move = self.find_critical_move(self.player)
        if move is not None:
            return move
        return self.random_move()

    def offensive_move(self):
        move = self.find_critical_move(self.player)
        if move is not None:
            return move
        move = self.find_critical_move(self.ai)
        if move is not None:
            return move
        return self.random_move()

    def optimal_move(self):
        move = self.offensive_move()
        if move is not None:
            return move
        move = self.defensive_move()
        if move is not None:
            return move
        return self.random_move()

    def find_critical_move(self, player):
        win_combos = [
            [0, 1, 2], 
            [3, 4, 5], 
            [6, 7, 8],
            [0, 3, 6], 
            [1, 4, 7], 
            [2, 5, 8],
            [0, 4, 8], 
            [2, 4, 6]
        ]
        for combo in win_combos:
            values = [self.board[i] for i in combo]
            if values.count(player) == 2 and values.count(None) == 1:
                return combo[values.index(None)]
        return None

    def check_game_over(self, player):
        win_combos = [
            [0, 1, 2], 
            [3, 4, 5], 
            [6, 7, 8],
            [0, 3, 6], 
            [1, 4, 7], 
            [2, 5, 8],
            [0, 4, 8], 
            [2, 4, 6]
        ]
        for combo in win_combos:
            if all(self.board[i] == player for i in combo):
                self.highlight_winner(combo)
                if player == self.player:
                    messagebox.showinfo("Game Over", "You win!")
                    self.player_score += 1
                    self.save_game_log("X", "O", self.moves, combo)
                else:
                    messagebox.showinfo("Game Over", "You lose!")
                    self.ai_score += 1
                    self.save_game_log("O", "X", self.moves, combo)
                self.reset_game()
                return True
        if all(self.board[i] is not None for i in range(9)):
            messagebox.showinfo("Game Over", "It's a tie!")
            self.save_game_log("Tie", "Tie", self.moves, [])
            self.reset_game()
            return True
        return False

    def highlight_winner(self, combo):
        for index in combo:
            self.cells[index].config(bg="turquoise")

    def reset_game(self):
        self.board = [None] * 9
        self.moves = []
        for cell in self.cells:
            cell.config(text="", bg="#333")
        self.update_difficulty()

    def update_difficulty(self):
        net_score = self.player_score - self.ai_score
        if net_score >= 6:
            self.current_difficulty = "Optimal"
        elif net_score >= 4:
            self.current_difficulty = "Offensive"
        elif net_score >= 2:
            self.current_difficulty = "Defensive"
        else:
            self.current_difficulty = "Easy"
        self.info_label.config(text=f"Difficulty: {self.current_difficulty}\nPlayer: {self.username}")

    def update_stats(self):
        games_folder = os.path.join(self.base_directory, "games")
        stats_folder = os.path.join(self.base_directory, "stats")

        x_wins, o_wins, ties = 0, 0, 0
        x_win_ratios = []
        o_win_ratios = []

        for game_file in os.listdir(games_folder):
            if game_file.endswith('.json'):
                with open(os.path.join(games_folder, game_file), 'r') as json_file:
                    game_log = json.load(json_file)

                    if game_log["Winner"] == "X":
                        x_wins += 1
                    elif game_log["Winner"] == "O":
                        o_wins += 1
                    else:
                        ties += 1

                    total_games = x_wins + o_wins + ties
                    x_win_ratios.append((x_wins / total_games) * 100)
                    o_win_ratios.append((o_wins / total_games) * 100)

        plt.figure(figsize=(10, 6))
        plt.plot(range(1, len(x_win_ratios) + 1), x_win_ratios, label="X Win %", color='blue')
        plt.plot(range(1, len(o_win_ratios) + 1), o_win_ratios, label="O Win %", color='red')
        plt.fill_between(range(1, len(x_win_ratios) + 1), x_win_ratios, o_win_ratios, where=(np.array(x_win_ratios) >= np.array(o_win_ratios)), color='blue', alpha=0.1)
        plt.fill_between(range(1, len(x_win_ratios) + 1), x_win_ratios, o_win_ratios, where=(np.array(o_win_ratios) > np.array(x_win_ratios)), color='red', alpha=0.1)
        plt.xlabel("Number of Games")
        plt.ylabel("Win Percentage")
        plt.ylim(0, 100)
        plt.title(f"{self.username}: X vs O Win Rates")

        x_win_patch = mpatches.Patch(color='blue', label=f"Final X Win %: {x_win_ratios[-1]:.2f}%")
        o_win_patch = mpatches.Patch(color='red', label=f"Final O Win %: {o_win_ratios[-1]:.2f}%")
        tie_patch = mpatches.Patch(color='gray', label=f"Overall Tie %: {(ties / total_games) * 100:.2f}%")

        plt.legend(handles=[x_win_patch, o_win_patch, tie_patch], loc="upper left", prop={'size': 10})
        plt.savefig(os.path.join(stats_folder, "timeline.jpg"))
        plt.close()

        self.create_heatmaps(stats_folder, games_folder)

    def create_heatmaps(self, stats_folder, games_folder):
        win_count = np.zeros((3, 3))
        lose_count = np.zeros((3, 3))
        tie_count = np.zeros((3, 3))
        game_count = np.zeros((3, 3))

        for game_file in os.listdir(games_folder):
            if game_file.endswith('.json'):
                with open(os.path.join(games_folder, game_file), 'r') as json_file:
                    game_log = json.load(json_file)
                    first_move = int(game_log["Moves"][0].split(': ')[1])

                    row, col = divmod(first_move, 3)
                    game_count[row][col] += 1

                    if game_log["Winner"] == "X":
                        win_count[row][col] += 1
                    elif game_log["Winner"] == "O":
                        lose_count[row][col] += 1
                    else:
                        tie_count[row][col] += 1

        win_rate = np.divide(win_count, game_count, out=np.zeros_like(win_count), where=game_count != 0) * 100
        lose_rate = np.divide(lose_count, game_count, out=np.zeros_like(lose_count), where=game_count != 0) * 100
        tie_rate = np.divide(tie_count, game_count, out=np.zeros_like(tie_count), where=game_count != 0) * 100

        self.generate_heatmap(stats_folder, win_rate, "Win Rate", "Greens", "HEATMAP_WIN.jpg")
        self.generate_heatmap(stats_folder, lose_rate, "Lose Rate", "Reds", "HEATMAP_LOSS.jpg")
        self.generate_heatmap(stats_folder, tie_rate, "Tie Rate", "Greys", "HEATMAP_TIE.jpg")

    def generate_heatmap(self, stats_folder, rate_matrix, title, cmap, filename):
        plt.figure(figsize=(8, 8))
        plt.imshow(rate_matrix, cmap=cmap, interpolation='nearest', vmin=0, vmax=100)
        for i in range(3):
            for j in range(3):
                text_color = 'white' if rate_matrix[i, j] > 50 else 'black'
                plt.text(j, i, f'{rate_matrix[i, j]:.1f}%', ha='center', va='center', color=text_color, fontsize=12)
        plt.xticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
        plt.yticks(ticks=[0, 1, 2], labels=['0', '1', '2'])
        plt.xlabel('Column')
        plt.ylabel('Row')
        plt.title(f"{title} Heatmap ({self.username})")
        plt.colorbar(label=f'{title} (%)')
        plt.savefig(os.path.join(stats_folder, filename))
        plt.close()

if __name__ == "__main__":
    game = TicTacToe()