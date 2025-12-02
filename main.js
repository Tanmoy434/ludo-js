import { setActivePlayers, setAIPlayers } from './ludo/constants.js'; // ✅ ADD setAIPlayers
import { Ludo } from './ludo/Ludo.js';

// default start with 2 players
let game = null;

function startWithPlayers(n) {
  // set active players
  setActivePlayers(n);

  // remove any existing game state by creating new instance
  // existing Ludo uses UI's onclick assignment so no duplicate handlers
  game = new Ludo();
}

function startWithAI() {
  // 1. Set active players to 2
  setActivePlayers(2);
  
  // 2. Set Player2 as the AI
  setAIPlayers(["Player2"]);
  
  // 3. Create the game
  game = new Ludo();
}

// wire buttons
document.querySelector('#btn-2p').addEventListener('click', () => startWithPlayers(2));
document.querySelector('#btn-3p').addEventListener('click', () => startWithPlayers(3));
document.querySelector('#btn-4p').addEventListener('click', () => startWithPlayers(4));
document.querySelector('#btn-ai').addEventListener('click', startWithAI);
// start default
startWithPlayers(2);
