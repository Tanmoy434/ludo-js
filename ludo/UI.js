import { COORDINATES_MAP, STEP_LENGTH, ACTIVE_PLAYERS } from './constants.js';

const diceButtonElement = document.querySelector('#dice-btn');

const playerPiecesElements = {
  Player1: document.querySelectorAll('[player-id="Player1"].player-piece'),
  Player2: document.querySelectorAll('[player-id="Player2"].player-piece'),
  Player3: document.querySelectorAll('[player-id="Player3"].player-piece'),
  Player4: document.querySelectorAll('[player-id="Player4"].player-piece'),
};

export class UI {
  static listenDiceClick(callback) {
    // overwrite to avoid stacking listeners
    diceButtonElement.onclick = callback;
  }

  static listenResetClick(callback) {
    const btn = document.querySelector('#reset-btn');
    if (btn) btn.onclick = callback;
  }

  static listenPieceClick(callback) {
    const container = document.querySelector('.player-pieces');
    if (container) container.onclick = callback;
  }

  static setPiecePosition(player, piece, newPosition) {
    const pieces = playerPiecesElements[player];
    if (!pieces || !pieces[piece]) {
      console.error(`Piece not found for ${player} #${piece}`);
      return;
    }

    const coords = COORDINATES_MAP[newPosition];
    if (!coords) {
      console.error('Coordinates not found for pos', newPosition);
      return;
    }

    const [x, y] = coords;
    const el = pieces[piece];
    el.style.left = (x * STEP_LENGTH) + '%';
    el.style.top = (y * STEP_LENGTH) + '%';
  }

  static setTurn(index) {
    if (!ACTIVE_PLAYERS || !ACTIVE_PLAYERS.length) return;
    const player = ACTIVE_PLAYERS[index % ACTIVE_PLAYERS.length];
    const span = document.querySelector('.active-player span');
    if (span) span.innerText = player;

    document.querySelectorAll('.player-base').forEach(b => b.classList.remove('highlight'));
    const base = document.querySelector(`.player-base[player-id="${player}"]`);
    if (base) base.classList.add('highlight');
  }

  static enableDice() {
    diceButtonElement.removeAttribute('disabled');
  }
  static disableDice() {
    diceButtonElement.setAttribute('disabled', '');
  }

  static highlightPieces(player, pieces) {
    pieces.forEach(p => {
      const el = playerPiecesElements[player][p];
      if (el) el.classList.add('highlight');
    });
  }

  static unhighlightPieces() {
    document.querySelectorAll('.player-piece.highlight').forEach(el => el.classList.remove('highlight'));
  }

  static setDiceValue(value) {
    const diceElement = document.querySelector('.dice-value');
    diceElement.innerHTML = '';

    const img = document.createElement('img');
    img.classList.add('dice-image', 'rolling');
    img.alt = `Dice ${value}`;
    img.src = `./ludo/Image/image${value}.png`;
    img.onanimationend = () => img.classList.remove('rolling');
    diceElement.appendChild(img);
  }

  static applyPlayerVisibility() {
    // hide all pieces & bases
    document.querySelectorAll('.player-piece').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.player-base').forEach(el => el.style.display = 'none');

    // show active players
    ACTIVE_PLAYERS.forEach(player => {
      document.querySelectorAll(`[player-id="${player}"]`).forEach(el => {
        el.style.display = 'block';
      });
    });
  }
}
