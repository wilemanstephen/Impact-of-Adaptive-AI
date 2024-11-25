import random
import os
import json
import matplotlib.pyplot as plt

class SnakeGameAI:
    def __init__(self):
        self.block_size = 20
        self.rows = 20
        self.cols = 20
        self.snake_speed = 8
        self.max_games = 1000
        self.snake_body = []
        self.food_items = []
        self.score = 0
        self.game_over = False
        self.survival_times = []
        self.current_time = 0
        self.death_reason = ""
        self.difficulty = "Easy"
        self.obstacles = []
        self.ai_snakes = []

    def reset(self):
        self.snake_body = [[self.block_size * 5, self.block_size * 5]]
        self.food_items = []
        self.obstacles = []
        self.ai_snakes = []
        self.place_food()
        self.score = 0
        self.game_over = False
        self.current_time = 0
        self.death_reason = ""
        self.difficulty = "Normal"

    def place_food(self):
        food_x, food_y = 0, 0
        while True:
            food_x = random.randint(0, self.cols - 1) * self.block_size
            food_y = random.randint(0, self.rows - 1) * self.block_size
            if not any(part[0] == food_x and part[1] == food_y for part in self.snake_body):
                break
        self.food_items = [[food_x, food_y]]

    def activate_defensive_mode(self):
        self.difficulty = "Defensive"
        for _ in range(7):
            self.place_obstacle()

    def activate_offensive_mode(self):
        self.difficulty = "Offensive"
        self.obstacles = []
        self.place_ai_snake()

    def activate_optimal_mode(self):
        self.difficulty = "Optimal"
        for _ in range(10):
            self.place_obstacle()
        self.place_ai_snake()
        self.place_ai_snake()

    def place_obstacle(self):
        obstacle_x, obstacle_y = 0, 0
        while True:
            obstacle_x = random.randint(0, self.cols - 1) * self.block_size
            obstacle_y = random.randint(0, self.rows - 1) * self.block_size
            if not any(part[0] == obstacle_x and part[1] == obstacle_y for part in self.snake_body):
                break
        self.obstacles.append([obstacle_x, obstacle_y])

    def place_ai_snake(self):
        ai_snake = {
            "x": random.randint(0, self.cols - 1) * self.block_size,
            "y": random.randint(0, self.rows - 1) * self.block_size,
            "velocity_x": 0,
            "velocity_y": 0,
            "body": []
        }
        ai_snake["body"].append([ai_snake["x"], ai_snake["y"]])
        self.ai_snakes.append(ai_snake)

    def get_next_move(self, head_x, head_y):
        if len(self.food_items) > 0:
            target_food = self.food_items[0]
            if head_x < target_food[0]:
                return 1, 0
            elif head_x > target_food[0]:
                return -1, 0
            elif head_y < target_food[1]:
                return 0, 1
            elif head_y > target_food[1]:
                return 0, -1
        return 0, 0

    def play_game(self):
        velocity_x, velocity_y = 0, -1
        while not self.game_over:
            head_x, head_y = self.snake_body[0]
            velocity_x, velocity_y = self.get_next_move(head_x, head_y)
            head_x += velocity_x * self.block_size
            head_y += velocity_y * self.block_size
            
            if head_x < 0 or head_x >= self.cols * self.block_size or head_y < 0 or head_y >= self.rows * self.block_size:
                self.game_over = True
                self.death_reason = "Hit a wall"
                break
            if [head_x, head_y] in self.snake_body:
                self.game_over = True
                self.death_reason = "Hit its own tail"
                break
            for obstacle in self.obstacles:
                if [head_x, head_y] == obstacle:
                    self.game_over = True
                    self.death_reason = "Hit a spike"
                    break
            for ai_snake in self.ai_snakes:
                for segment in ai_snake["body"]:
                    if [head_x, head_y] == segment:
                        self.game_over = True
                        self.death_reason = "Hit an AI snake"
                        break
                if self.game_over:
                    break
            if self.game_over:
                break
            
            self.snake_body = [[head_x, head_y]] + self.snake_body[:-1]
            
            if [head_x, head_y] == self.food_items[0]:
                self.snake_body.append(self.snake_body[-1])
                self.score += 10 if self.difficulty == 'Easy' else 15 if self.difficulty == 'Defensive' else 20 if self.difficulty == 'Offensive' else 25
                if self.score >= 5 and self.difficulty == 'Easy':
                    self.activate_defensive_mode()
                elif self.score >= 20 and self.difficulty == 'Defensive':
                    self.activate_offensive_mode()
                elif self.score >= 30 and self.difficulty == 'Offensive':
                    self.activate_optimal_mode()
                self.place_food()
                if self.score >= 15 and self.difficulty != "Optimal":
                    self.activate_optimal_mode()
                elif self.score >= 10 and self.difficulty != "Offensive":
                    self.activate_offensive_mode()
                elif self.score >= 5 and self.difficulty != "Defensive":
                    self.activate_defensive_mode()
            
            self.current_time += 1

        self.survival_times.append(self.current_time // 60 * 100 + self.current_time % 60)
        self.save_game_stats()

    def run_simulation(self):
        for game_number in range(self.max_games):
            self.reset()
            self.play_game()
        self.save_statistics()

    def save_game_stats(self):
        game_stats = {
            "Score": self.score,
            "Time of survival": self.current_time,
            "Difficulty when the snake died": self.difficulty,
            "Way the snake died": self.death_reason
        }
        
        if not os.path.exists("games_snake"): 
            os.makedirs("games_snake")
        
        with open(f"games_snake/game_{len(self.survival_times)}.json", "w") as f:
            json.dump(game_stats, f, indent=4)

    def save_statistics(self):
        if not os.path.exists("stats_snake"):
            os.makedirs("stats_snake")
        
        stats = {
            "survival_times": self.survival_times,
            "max_time": max(self.survival_times),
            "min_time": min(self.survival_times),
            "avg_time": sum(self.survival_times) / len(self.survival_times)
        }
        
        with open("stats_snake/survival_stats.json", "w") as f:
            json.dump(stats, f, indent=4)
        
        formatted_times = [f"{time // 100:02d}:{time % 100:02d}" for time in self.survival_times]
        plt.plot(range(1, len(self.survival_times) + 1), [time // 100 * 60 + time % 100 for time in self.survival_times], label='Survival Time')
        plt.xlabel("Game Number")
        plt.ylabel("Survival Time (seconds)")
        plt.title("Survival Time Evolution Over 1000 Games")
        best_time = max(self.survival_times)
        best_score = max([json.load(open(f"games_snake/game_{i + 1}.json"))['Score'] for i in range(len(self.survival_times))])
        max_difficulty = max([json.load(open(f"games_snake/game_{i + 1}.json"))['Difficulty when the snake died'] for i in range(len(self.survival_times))], key=lambda x: ["Normal", "Defensive", "Offensive", "Optimal"].index(x))
        plt.legend([
            f"Best Survival Time: {best_time // 100} min {best_time % 100} sec", 
            f"Best Score: {best_score}", 
            f"Max Difficulty Reached: {max_difficulty}"
        ], loc='upper center')
        plt.savefig("stats_snake/survival_time_evolution.jpg")
        plt.close()

if __name__ == "__main__":
    ai_snake_game = SnakeGameAI()
    ai_snake_game.run_simulation()