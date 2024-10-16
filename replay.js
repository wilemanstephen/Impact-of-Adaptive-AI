document.addEventListener('DOMContentLoaded', function() {
    window.startReplay = function(gameId) {
        console.log(`Attempting to fetch game data for: ${gameId}`);
        fetch(`http://127.0.0.1:5000/games/${gameId}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch game data: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data.log) {
                    console.error('Log data is missing in the fetched JSON');
                    return;
                }

                const logEntries = data.log.split("\n");
                console.log(`Difficulty: ${logEntries[0].split(': ')[1]}`);
                console.log("Moves:");
                logEntries.slice(2, logEntries.length - 3).forEach(entry => {
                    if (entry.includes("at position")) {
                        const [player, position] = entry.split(' at position ');
                        console.log(`${player.trim()}: position ${position.trim()}`);
                    }
                });

                const winnerLine = logEntries.find(line => line.startsWith("Winner:"));
                if (winnerLine) {
                    const winner = winnerLine.split(": ")[1].trim();
                    console.log(`Winner: ${winner}`);
                }

                const winningComboLine = logEntries.find(line => line.startsWith("Winning combination:"));
                if (winningComboLine) {
                    const winningCombination = winningComboLine.split(": ")[1].trim();
                    console.log(`Winning combination: [${winningCombination}]`);
                }
            })
            .catch(error => {
                console.error('Error loading replay data:', error);
                alert('Failed to load game data. Please check the console for more details.');
            });
    };
});