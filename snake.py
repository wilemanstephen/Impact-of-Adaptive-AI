import pygame
import random
import os
import json
import matplotlib.pyplot as plt

pygame.init()

block_size = 20
rows, cols = 20, 20
board_width, board_height = cols * block_size, rows * block_size

snake_x, snake_y = block_size * 5, block_size * 5
velocity_x, velocity_y = 0, 0

snake_body = []
food_items = []
obstacles = []
ai_snakes = []

score = 0
username = None
game_over = False
is_defensive_mode = False
is_offensive_mode = False
is_optimal_mode = False
is_easy_mode = True

RESPAWN_AI_EVENT = pygame.USEREVENT + 1

snake_speed = 8
ai_snake_speed = 1

time_elapsed = 0

window = pygame.display.set_mode((board_width, board_height))
font = pygame.font.SysFont("Arial", 24)

clock = pygame.time.Clock()

def setup_user_data():
    global username
    base_dir = "User_Data_Snake"
    user_dir = os.path.join(base_dir, username)
    games_dir = os.path.join(user_dir, "games")
    stats_dir = os.path.join(user_dir, "stats")
    os.makedirs(games_dir, exist_ok=True)
    os.makedirs(stats_dir, exist_ok=True)
    return games_dir, stats_dir

def save_game_stats(games_dir):
    game_stats = {
        "Score": score,
        "Difficulty": ("Easy" if is_easy_mode else "Defensive" if is_defensive_mode else "Offensive" if is_offensive_mode else "Optimal"),
        "Snake Length": len(snake_body),
        "Time Elapsed": time_elapsed,
    }
    game_number = len(os.listdir(games_dir)) + 1
    game_file = os.path.join(games_dir, f"game_{game_number}.json")
    with open(game_file, "w") as f:
        json.dump(game_stats, f, indent=4)

def plot_game_statistics(times, scores, thresholds, stats_dir):
    x_points = []
    y_points = []

    for i in range(len(scores)):
        x_points.append(times[i])
        y_points.append(scores[i - 1] if i > 0 else 0)
        x_points.append(times[i])
        y_points.append(scores[i])

    plt.plot(x_points, y_points, label="Game Duration", color="blue")
    plt.axhline(thresholds['Defensive'], color="yellow", linestyle="--", label="Easy to Defensive")
    plt.axhline(thresholds['Offensive'], color="red", linestyle="--", label="Defensive to Offensive")
    plt.axhline(thresholds['Optimal'], color="purple", linestyle="--", label="Offensive to Optimal")

    for threshold in thresholds.values():
        plt.text(0, threshold, f"{threshold}", color="black", fontsize=10, va='center', ha='left')

    plt.xlabel("Time (Duration)")
    plt.ylabel("Score (Points)")
    plt.title("Game Statistics")
    plt.legend()
    plt.grid()
    graph_path = os.path.join(stats_dir, "game_statistics.png")
    plt.savefig(graph_path)
    plt.close()

def get_username():
    global username
    input_box = pygame.Rect(board_width // 2 - 100, board_height // 2 - 20, 200, 40)
    active = False
    username = ""
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                exit()
            if event.type == pygame.MOUSEBUTTONDOWN:
                active = input_box.collidepoint(event.pos)
            if event.type == pygame.KEYDOWN and active:
                if event.key == pygame.K_RETURN:
                    return username
                elif event.key == pygame.K_BACKSPACE:
                    username = username[:-1]
                else:
                    username += event.unicode
        window.fill((144, 238, 144))
        text_surface = font.render("Enter Username: " + username, True, (0, 0, 0))
        pygame.draw.rect(window, (255, 255, 255), input_box)
        window.blit(text_surface, (input_box.x + 5, input_box.y + 5))
        pygame.display.flip()

def place_food():
    while True:
        food_x = random.randint(3, cols - 4) * block_size
        food_y = random.randint(3, rows - 4) * block_size
        if not is_food_on_snake(food_x, food_y) and not is_food_on_obstacles(food_x, food_y) and not is_food_on_ai_snakes(food_x, food_y):
            food_items.append((food_x, food_y))
            break

def is_food_on_snake(x, y):
    return any(x == bx and y == by for bx, by in snake_body)

def is_food_on_obstacles(x, y):
    return any(x == ox and y == oy for ox, oy in obstacles)

def is_food_on_ai_snakes(x, y):
    for ai in ai_snakes:
        if any(x == bx and y == by for bx, by in ai["body"]):
            return True
    return False

def place_obstacle():
    while True:
        obs_x = random.randint(0, cols - 1) * block_size
        obs_y = random.randint(0, rows - 1) * block_size
        if (obs_x, obs_y) not in obstacles and not is_food_on_snake(obs_x, obs_y) and (obs_x, obs_y) not in snake_body:
            obstacles.append((obs_x, obs_y))
            break

def draw_snake():
    for x, y in snake_body:
        pygame.draw.circle(window, (65, 105, 225), (x + block_size // 2, y + block_size // 2), block_size // 2 - 2)
    pygame.draw.circle(window, (65, 105, 225), (snake_x + block_size // 2, snake_y + block_size // 2), block_size // 2 - 2)
    pygame.draw.circle(window, (255, 255, 255), (snake_x + block_size // 3, snake_y + block_size // 3), block_size // 10)
    pygame.draw.circle(window, (255, 255, 255), (snake_x + 2 * block_size // 3, snake_y + block_size // 3), block_size // 10)
    pygame.draw.arc(window, (0, 0, 0), (snake_x + block_size // 4, snake_y + block_size // 2, block_size // 2, block_size // 4), 3.14, 0)

def draw_food():
    for x, y in food_items:
        pygame.draw.circle(window, (255, 0, 0), (x + block_size // 2, y + block_size // 2), block_size // 2)

def draw_obstacles():
    for x, y in obstacles:
        pygame.draw.polygon(window, (128, 0, 128), [(x + block_size // 2, y), (x, y + block_size), (x + block_size, y + block_size)])

def change_direction(key):
    global velocity_x, velocity_y
    if key == pygame.K_w and velocity_y != 1:
        velocity_x, velocity_y = 0, -1
    if key == pygame.K_s and velocity_y != -1: 
        velocity_x, velocity_y = 0, 1
    if key == pygame.K_a and velocity_x != 1: 
        velocity_x, velocity_y = -1, 0
    if key == pygame.K_d and velocity_x != -1: 
        velocity_x, velocity_y = 1, 0

def activate_next_mode():
    global is_easy_mode, is_defensive_mode, is_offensive_mode, is_optimal_mode, game_over
    if is_easy_mode and score >= 5:
        is_easy_mode = False
        is_defensive_mode = True
        activate_defensive_mode()
    elif is_defensive_mode and score >= 10:
        is_defensive_mode = False
        is_offensive_mode = True
        activate_offensive_mode()
    elif is_offensive_mode and score >= 15:
        is_offensive_mode = False
        is_optimal_mode = True
        activate_optimal_mode()
    elif is_optimal_mode and score >= 20:
        game_over = True
        pygame.quit()
        return

def activate_defensive_mode():
    for _ in range(random.randint(5, 7)):
        place_obstacle()

def activate_offensive_mode():
    obstacles.clear()
    ai_snakes.append(create_ai_snake())

def activate_optimal_mode():
    for _ in range(7):
        place_obstacle()
    for _ in range(2):
        ai_snakes.append(create_ai_snake())

def create_ai_snake():
    while True:
        ai_x = random.randint(0, cols - 1) * block_size
        ai_y = random.randint(0, rows - 1) * block_size
        if (ai_x, ai_y) not in obstacles:
            return {"x": ai_x, "y": ai_y, "body": [(ai_x, ai_y)], "velocity_x": 0, "velocity_y": 0}

def move_ai_snake(ai):
    target_food = min(food_items, key=lambda f: abs(ai["x"] - f[0]) + abs(ai["y"] - f[1])) if food_items else None
    if target_food:
        if ai["x"] < target_food[0]:
            ai["velocity_x"], ai["velocity_y"] = 1, 0
        elif ai["x"] > target_food[0]:
            ai["velocity_x"], ai["velocity_y"] = -1, 0
        elif ai["y"] < target_food[1]:
            ai["velocity_x"], ai["velocity_y"] = 0, 1
        elif ai["y"] > target_food[1]:
            ai["velocity_x"], ai["velocity_y"] = 0, -1
    next_x = ai["x"] + ai["velocity_x"] * block_size
    next_y = ai["y"] + ai["velocity_y"] * block_size
    if (next_x, next_y) not in obstacles:
        ai["x"], ai["y"] = next_x, next_y
        ai["body"].append((ai["x"], ai["y"]))
        if len(ai["body"]) > len(snake_body):
            ai["body"].pop(0)

def check_ai_eats_food():
    for ai in ai_snakes:
        for i, (food_x, food_y) in enumerate(food_items):
            if abs(ai["x"] - food_x) < block_size and abs(ai["y"] - food_y) < block_size:
                ai["body"].append((food_x, food_y))
                food_items.pop(i)
                place_food()
                break

def check_collisions():
    global game_over, ai_snakes
    if is_defensive_mode and any(snake_x == x and snake_y == y for x, y in obstacles):
        game_over = True
        return
    for ai in ai_snakes[:]:
        if any(abs(ai["x"] - bx) < block_size and abs(ai["y"] - by) < block_size for bx, by in snake_body):
            ai_snakes.remove(ai)
            pygame.time.set_timer(RESPAWN_AI_EVENT, 3000)
            continue
        if abs(snake_x - ai["x"]) < block_size and abs(snake_y - ai["y"] < block_size):
            game_over = True
            return
        if any(abs(snake_x - bx) < block_size and abs(snake_y - by) < block_size for bx, by in ai["body"]):
            game_over = True
            return

def respawn_ai_snake(ai):
    ai_snakes.remove(ai)
    pygame.time.set_timer(pygame.USEREVENT, 3000)
    pygame.event.post(pygame.event.Event(pygame.USEREVENT))

def handle_ai_collisions():
    for ai in ai_snakes:
        if any(abs(snake_x - x) < block_size and abs(snake_y - y) < block_size for x, y in ai["body"]):
            respawn_ai_snake(ai)

def draw_ai_snakes():
    for ai in ai_snakes:
        for x, y in ai["body"]:
            pygame.draw.circle(window, (255, 255, 0), (x + block_size // 2, y + block_size // 2), block_size // 2 - 2)
        head_x, head_y = ai["x"], ai["y"]
        pygame.draw.circle(window, (255, 255, 0), (head_x + block_size // 2, head_y + block_size // 2), block_size // 2 - 2)
        pygame.draw.circle(window, (255, 255, 255), (head_x + block_size // 3, head_y + block_size // 3), block_size // 10)
        pygame.draw.circle(window, (255, 255, 255), (head_x + 2 * block_size // 3, head_y + block_size // 3), block_size // 10)
        pygame.draw.arc(window, (0, 0, 0), (head_x + block_size // 4, head_y + block_size // 2, block_size // 2, block_size // 4), 3.14, 0)

def game_loop():
    global snake_x, snake_y, game_over, score, time_elapsed
    games_dir, stats_dir = setup_user_data()
    thresholds = {"Defensive": 5, "Offensive": 10, "Optimal": 15}
    times = []
    scores = []
    while not game_over:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                change_direction(event.key)
            if event.type == RESPAWN_AI_EVENT:
                ai_snakes.append(create_ai_snake())
                pygame.time.set_timer(RESPAWN_AI_EVENT, 0)
        snake_x += velocity_x * block_size
        snake_y += velocity_y * block_size
        if snake_x < 0 or snake_x >= board_width or snake_y < 0 or snake_y >= board_height:
            game_over = True
            break
        for x, y in snake_body:
            if snake_x == x and snake_y == y:
                game_over = True
                break
        if game_over:
            break
        for i, (food_x, food_y) in enumerate(food_items):
            if abs(snake_x - food_x) < block_size and abs(snake_y - food_y) < block_size:
                snake_body.append((food_x, food_y))
                food_items.pop(i)
                place_food()
                score += 1
                times.append(time_elapsed)
                scores.append(score)
                break
        activate_next_mode()
        if len(snake_body) > 0:
            snake_body.insert(0, (snake_x, snake_y))
            snake_body.pop()
        for ai in ai_snakes:
            move_ai_snake(ai)
        check_ai_eats_food()
        check_collisions()
        handle_ai_collisions()
        window.fill((144, 238, 144))
        draw_food()
        draw_snake()
        if not is_easy_mode:
            draw_obstacles()
            draw_ai_snakes()
        score_text = font.render(f"Score: {score}", True, (255, 255, 255))
        timer_text = font.render(f"Time: {time_elapsed // 60}:{time_elapsed % 60:02}", True, (255, 255, 255))
        window.blit(score_text, (10, 10))
        window.blit(timer_text, (10, 40))
        pygame.display.flip()
        clock.tick(snake_speed)
        time_elapsed += 1
    save_game_stats(games_dir)
    plot_game_statistics(times, scores, thresholds, stats_dir)

get_username()
place_food()
game_loop()