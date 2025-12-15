import { setActivePlayers, setAIPlayers } from './ludo/constants.js';
import { Ludo } from './ludo/Ludo.js';

let game = null;

// 1. WINNER FUNCTION
function showWinner(playerName) {
  console.log("Attempting to show winner modal for:", playerName);
  const modal = document.getElementById('winner-modal');
  const text = document.getElementById('winner-text');

  if (modal && text) {
    text.innerText = playerName + ' Wins!';
    modal.style.display = 'flex'; // This makes it visible
  } else {
    console.error("Could not find modal elements in HTML!");
  }
}

// Attach to window so Ludo.js can see it
window.showWinner = showWinner;

// 2. MODAL CLOSE BUTTON 
const closeBtn = document.getElementById('winner-close');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    document.getElementById('winner-modal').style.display = 'none';
    location.reload();
  });
}

// 3. GAME START LOGIC 
function startWithPlayers(n) {
  setActivePlayers(n);
  game = new Ludo();
}

function startWithAI() {
  setActivePlayers(2);
  setAIPlayers(["Player2"]);
  game = new Ludo();
}

// Wire buttons
document.querySelector('#btn-2p').addEventListener('click', () => startWithPlayers(2));
document.querySelector('#btn-3p').addEventListener('click', () => startWithPlayers(3));
document.querySelector('#btn-4p').addEventListener('click', () => startWithPlayers(4));
document.querySelector('#btn-ai').addEventListener('click', startWithAI);

// Start default
startWithPlayers(2);
