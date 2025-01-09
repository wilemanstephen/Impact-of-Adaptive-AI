import pygame
import os
import json

pygame.init()

WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Tic Tac Toe Questionnaire")

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (100, 149, 237)
GRAY = (200, 200, 200)
RED = (255, 69, 58)

FONT = pygame.font.Font(None, 36)
TITLE_FONT = pygame.font.Font(None, 48)

questions = [
    "I plan my moves several steps ahead during a game of Tic Tac Toe.",
    "I actively try to anticipate my opponent's moves in advance.",
    "Blocking my opponent's winning moves is a priority for me.",
    "I plan my moves based on a strategy, rather than reacting to the opponent's actions.",
    "I try to create opportunities to win while simultaneously blocking my opponent.",
    "I feel frustrated when I miss a winning opportunity in Tic Tac Toe.",
    "I feel stressed when playing at a higher difficulty level (e.g., Offensive or Optimal).",
    "Winning against the AI gives me a strong sense of accomplishment.",
    "I feel satisfied even when the game ends in a tie, provided I played strategically.",
    "Losing against the AI makes me want to improve my strategy.",
    "I prefer to play defensively to avoid losing rather than offensively to win.",
    "I try to take the center spot at the beginning of the game.",
    "I adjust my strategy depending on whether I play as X or O.",
    "When playing at 'Defensive' difficulty, I feel confident in countering the AI's moves.",
    "I find it easier to win when playing as X than as O.",
    "Blocking my opponent’s winning moves is more important than trying to win directly.",
    "I feel satisfied even when the game ends in a tie if I played my best."
]

responses = [0] * len(questions)

username = ""

def get_username():
    global username
    input_box = pygame.Rect(WIDTH // 2 - 150, HEIGHT // 2 - 20, 300, 40)
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

        screen.fill(WHITE)
        text_surface = FONT.render("Enter your username: " + username, True, BLACK)
        pygame.draw.rect(screen, GRAY, input_box)
        screen.blit(text_surface, (input_box.x + 5, input_box.y + 5))
        pygame.display.flip()

def create_user_directory():
    root_directory = os.path.join(os.getcwd(), "Questionnaire TIC TAC TOE")
    user_directory = os.path.join(root_directory, username)
    os.makedirs(user_directory, exist_ok=True)
    return user_directory

def wrap_text(text, font, max_width):
    words = text.split(' ')
    wrapped_lines = []
    current_line = ""

    for word in words:
        test_line = current_line + word + " "
        if font.size(test_line)[0] <= max_width:
            current_line = test_line
        else:
            wrapped_lines.append(current_line.strip())
            current_line = word + " "

    if current_line:
        wrapped_lines.append(current_line.strip())

    return wrapped_lines

def display_question(question_idx):
    question = questions[question_idx]
    screen.fill(WHITE)

    title = TITLE_FONT.render(f"Question {question_idx + 1}/{len(questions)}", True, BLACK)
    screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 50))

    wrapped_lines = wrap_text(question, FONT, WIDTH - 100)
    y_offset = 150
    for line in wrapped_lines:
        question_surface = FONT.render(line, True, BLACK)
        screen.blit(question_surface, (50, y_offset))
        y_offset += 40

    options = ["1 - Strongly Disagree", "2 - Disagree", "3 - Neutral", "4 - Agree", "5 - Strongly Agree"]
    y_offset += 20
    option_rects = []
    for i, option in enumerate(options):
        color = BLUE if responses[question_idx] == i + 1 else BLACK
        option_surface = FONT.render(option, True, color)
        option_rect = option_surface.get_rect(topleft=(100, y_offset))
        screen.blit(option_surface, option_rect.topleft)
        option_rects.append((option_rect, i + 1))
        y_offset += 50

    enter_text = FONT.render("Press Enter to continue", True, RED)
    screen.blit(enter_text, (WIDTH // 2 - enter_text.get_width() // 2, HEIGHT - 50))

    pygame.display.flip()
    return option_rects

def save_results(directory):
    final_score = sum(responses)
    consistency_score = calculate_consistency()
    results = {
        "Username": username,
        "Responses": responses,
        "Total Score": final_score,
        "Consistency Score": consistency_score
    }

    file_path = os.path.join(directory, "results.json")
    with open(file_path, "w") as f:
        json.dump(results, f, indent=4)

def calculate_consistency():
    consistency_pairs = [(2, 16), (9, 17)]
    score = 5

    for q1, q2 in consistency_pairs:
        if abs(responses[q1 - 1] - responses[q2 - 1]) > 1:
            score -= 2

    return max(score, 0)

def main():
    global responses

    username = get_username()
    user_directory = create_user_directory()

    question_idx = 0
    while question_idx < len(questions):
        option_rects = display_question(question_idx)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                exit()

            if event.type == pygame.MOUSEBUTTONDOWN:
                for rect, value in option_rects:
                    if rect.collidepoint(event.pos):
                        responses[question_idx] = value

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RETURN and responses[question_idx] > 0:
                    question_idx += 1

    save_results(user_directory)
    screen.fill(WHITE)
    thank_you_text = TITLE_FONT.render("Thank you for completing the questionnaire!", True, BLACK)
    screen.blit(thank_you_text, (WIDTH // 2 - thank_you_text.get_width() // 2, HEIGHT // 2 - 20))
    pygame.display.flip()
    pygame.time.wait(3000)
    pygame.quit()

if __name__ == "__main__":
    main()