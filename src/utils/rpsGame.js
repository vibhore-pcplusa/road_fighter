// Choices: 0 = Rock, 1 = Paper, 2 = Scissors
export const RPS_CHOICES = {
  ROCK: 0,
  PAPER: 1,
  SCISSORS: 2
};

export const RPS_RESULTS = {
  WIN: 1,
  LOSE: -1,
  DRAW: 0
};

export function getCPUChoice() {
  return Math.floor(Math.random() * 3);
}

// Returns WIN, LOSE, or DRAW for the player
export function playRPS(playerChoice, cpuChoice) {
  if (playerChoice === cpuChoice) return RPS_RESULTS.DRAW;
  
  if (
    (playerChoice === RPS_CHOICES.ROCK && cpuChoice === RPS_CHOICES.SCISSORS) ||
    (playerChoice === RPS_CHOICES.PAPER && cpuChoice === RPS_CHOICES.ROCK) ||
    (playerChoice === RPS_CHOICES.SCISSORS && cpuChoice === RPS_CHOICES.PAPER)
  ) {
    return RPS_RESULTS.WIN;
  }
  
  return RPS_RESULTS.LOSE;
}
