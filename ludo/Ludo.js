import {
  ACTIVE_PLAYERS,
  AI_PLAYERS,
  BASE_POSITIONS,
  HOME_ENTRANCE,
  HOME_POSITIONS,
  START_POSITIONS,
  SAFE_POSITIONS,
  TURNING_POINTS,
  STATE
} from './constants.js';
import { UI } from './UI.js';

export class Ludo {
  currentPositions = {};
  _diceValue = 0;
  _turn = 0;
  _state = STATE.DICE_NOT_ROLLED;

  get diceValue() { return this._diceValue; }
  set diceValue(v) { this._diceValue = v; UI.setDiceValue(v); }

  get turn() { return this._turn; }
  set turn(v) { this._turn = v; UI.setTurn(v); }

  get state() { return this._state; }

  set state(v) {
    this._state = v;

    if (v === STATE.DICE_NOT_ROLLED) {
      UI.unhighlightPieces();
      const currentPlayer = ACTIVE_PLAYERS[this.turn];

      // Check if this is an AI's turn
      if (AI_PLAYERS.includes(currentPlayer)) {
        UI.disableDice(); // AI is "thinking"
        
        // Add a delay so it feels like a real player
        setTimeout(() => {
          this.runAITurn(currentPlayer);
        }, 1000);
      } else {
        // It's a human, just enable the dice
        UI.enableDice();
      }

    } else {
      // Dice has been rolled (either by human or AI)
      UI.disableDice();
    }
  }

  constructor() {
    UI.applyPlayerVisibility();
    this.listenDiceClick();
    this.listenResetClick();
    this.listenPieceClick();
    this.resetGame();
  }

  listenDiceClick() {
    UI.listenDiceClick(this.onDiceClick.bind(this));
  }

  onDiceClick() {
    this.diceValue = 1 + Math.floor(Math.random() * 6);
    this.state = STATE.DICE_ROLLED;
    this.checkForEligiblePieces();
  }

  checkForEligiblePieces() {
    const player = ACTIVE_PLAYERS[this.turn];
    const eligible = this.getEligiblePieces(player);
    if (eligible.length) UI.highlightPieces(player, eligible);
    else this.incrementTurn();
  }

  incrementTurn() {
    this.turn = (this.turn + 1) % ACTIVE_PLAYERS.length;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  getEligiblePieces(player) {
    return [0,1,2,3].filter(piece => {
      const pos = this.currentPositions[player][piece];
      if (pos === HOME_POSITIONS[player]) return false;
      if (BASE_POSITIONS[player].includes(pos) && this.diceValue !== 6) return false;
      if (HOME_ENTRANCE[player].includes(pos) && this.diceValue > HOME_POSITIONS[player] - pos) return false;
      return true;
    });
  }

  listenResetClick() {
    UI.listenResetClick(this.resetGame.bind(this));
  }

  resetGame() {
    this.currentPositions = {};
    ACTIVE_PLAYERS.forEach(player => {
      this.currentPositions[player] = [...BASE_POSITIONS[player]];
      [0,1,2,3].forEach(piece => {
        this.setPiecePosition(player, piece, this.currentPositions[player][piece]);
      });
    });
    this.turn = 0;
    this.state = STATE.DICE_NOT_ROLLED;
  }

  listenPieceClick() {
    UI.listenPieceClick(this.onPieceClick.bind(this));
  }

  onPieceClick(e) {
    const target = e.target;
    if (!target.classList.contains('player-piece') || !target.classList.contains('highlight')) return;
    const player = target.getAttribute('player-id');
    const piece = Number(target.getAttribute('piece'));
    this.handlePieceClick(player, piece);
  }

  handlePieceClick(player, piece) {
    const current = this.currentPositions[player][piece];
    if (BASE_POSITIONS[player].includes(current)) {
      // move out to start
      this.setPiecePosition(player, piece, START_POSITIONS[player]);
      this.state = STATE.DICE_NOT_ROLLED;
      return;
    }
    UI.unhighlightPieces();
    this.movePiece(player, piece, this.diceValue);
  }

  setPiecePosition(player, piece, newPos) {
    this.currentPositions[player][piece] = newPos;
    UI.setPiecePosition(player, piece, newPos);
  }

  movePiece(player, piece, moveBy) {
    const interval = setInterval(() => {
      this.incrementPiecePosition(player, piece);
      moveBy--;
      if (moveBy === 0) {
        clearInterval(interval);
        if (this.hasPlayerWon(player)) {
          alert(`${player} has won!`);
          this.resetGame();
          return;
        }
        const killed = this.checkForKill(player, piece);
        if (killed || this.diceValue === 6) {
          this.state = STATE.DICE_NOT_ROLLED;
          return;
        }
        this.incrementTurn();
      }
    }, 180);
  }

  checkForKill(player, pieceIndex) {
    const pos = this.currentPositions[player][pieceIndex];
    let killed = false;
    const opponents = ACTIVE_PLAYERS.filter(p => p !== player);
    opponents.forEach(op => {
      [0,1,2,3].forEach(opPiece => {
        const oppPos = this.currentPositions[op][opPiece];
        if (oppPos === pos && !SAFE_POSITIONS.includes(pos)) {
          this.setPiecePosition(op, opPiece, BASE_POSITIONS[op][opPiece]);
          killed = true;
        }
      });
    });
    return killed;
  }

  hasPlayerWon(player) {
    return [0,1,2,3].every(p => this.currentPositions[player][p] === HOME_POSITIONS[player]);
  }

  incrementPiecePosition(player, piece) {
    this.setPiecePosition(player, piece, this.getIncrementedPosition(player, piece));
  }

  getIncrementedPosition(player, piece) {
    const cur = this.currentPositions[player][piece];
    if (cur === TURNING_POINTS[player]) return HOME_ENTRANCE[player][0];
    if (cur === 51) return 0;
    // if the piece is already inside HOME_ENTRANCE path (numbers 100/200 etc), increment to next home
    // allow entry into final HOME position too
    if (cur >= 100) {
      // find index in its home array
      const arr = HOME_ENTRANCE[player];
      const idx = arr.indexOf(cur);
      if (idx >= 0 && idx < arr.length - 1) return arr[idx+1];
      // last step to HOME_POSITIONS[player]
      if (idx === arr.length - 1) return HOME_POSITIONS[player];
    }
    return cur + 1;
  }

  runAITurn(player) {
    console.log(`AI TURN: ${player}`);
    
    // 1. AI "rolls" the dice
    this.onDiceClick();
    
    // 2. AI sees what moves are possible
    const eligiblePieces = this.getEligiblePieces(player);

    // 3. If no moves, the turn ends automatically (from onDiceClick)
    if (eligiblePieces.length === 0) {
      return;
    }

    // 4. AI "chooses" the best move
    const pieceToMove = this.aiChooseBestMove(player, eligiblePieces);

    // 5. AI "clicks" the chosen piece after a short delay
    setTimeout(() => {
      this.handlePieceClick(player, pieceToMove);
    }, 800);
  }

  /**
   * AI Strategy: Decides which piece to move
   */
  aiChooseBestMove(player, eligiblePieces) {
    // Priority 1: Can I capture an opponent?
    for (const piece of eligiblePieces) {
      const newPos = this.getFuturePosition(player, piece, this.diceValue);
      if (this.isKillMove(player, newPos)) {
        console.log("AI Strategy: Found a capture!");
        return piece;
      }
    }
    
    // Priority 2: Can I get a piece home?
    for (const piece of eligiblePieces) {
      const newPos = this.getFuturePosition(player, piece, this.diceValue);
      if (newPos === HOME_POSITIONS[player]) {
        console.log("AI Strategy: Going home!");
        return piece;
      }
    }

    // Priority 3: Can I get a piece out of the base?
    if (this.diceValue === 6) {
      const basePiece = eligiblePieces.find(p => BASE_POSITIONS[player].includes(this.currentPositions[player][p]));
      if (basePiece !== undefined) {
        console.log("AI Strategy: Getting out of base!");
        return basePiece;
      }
    }
    
    // Priority 4: Can I land on a safe space?
    for (const piece of eligiblePieces) {
      const newPos = this.getFuturePosition(player, piece, this.diceValue);
      if (SAFE_POSITIONS.includes(newPos)) {
         console.log("AI Strategy: Moving to a safe space.");
         return piece;
      }
    }

    // Default: Just move the piece that is furthest along
    // (This is better than "first" because it tries to win)
    let bestPiece = eligiblePieces[0];
    let furthestPos = -1; // Use -1 to handle base positions (e.g., 500)
    
    for (const piece of eligiblePieces) {
      let pos = this.currentPositions[player][piece];
      // Treat base positions as 0
      if (pos >= 500) pos = 0; 
      // Treat home positions as a high number
      if (pos >= 100) pos += 52; // (Just a simple way to prioritize home path)
      
      if (pos > furthestPos) {
        furthestPos = pos;
        bestPiece = piece;
      }
    }
    console.log("AI Strategy: Moving furthest piece.");
    return bestPiece;
  }

  /**
   * AI Helper: Checks if a future move will be a "kill"
   */
  isKillMove(player, newPosition) {
    if (SAFE_POSITIONS.includes(newPosition)) {
      return false;
    }
    
    const opponents = ACTIVE_PLAYERS.filter(p => p !== player);
    for (const op of opponents) {
      // Check all 4 pieces of the opponent
      for (const opPiece of [0, 1, 2, 3]) {
        if (this.currentPositions[op][opPiece] === newPosition) {
          return true; // Yes, it's a kill
        }
      }
    }
    return false;
  }

  /**
   * AI Helper: Simulates a move to see the final position
   */
  getFuturePosition(player, piece, moves) {
    let currentPos = this.currentPositions[player][piece];

    // If starting from base
    if (BASE_POSITIONS[player].includes(currentPos)) {
      return START_POSITIONS[player];
    }
    
    // Simulate the moves one by one
    for (let i = 0; i < moves; i++) {
      if (currentPos === TURNING_POINTS[player]) {
        currentPos = HOME_ENTRANCE[player][0];
      } 
      else if (currentPos === 51) {
        currentPos = 0;
      } 
      else if (currentPos >= 100) {
        // Piece is already in the home path
        const arr = HOME_ENTRANCE[player];
        const idx = arr.indexOf(currentPos);
        if (idx >= 0 && idx < arr.length - 1) {
          currentPos = arr[idx + 1];
        } else if (idx === arr.length - 1) {
          currentPos = HOME_POSITIONS[player];
        }
        // If it's already at home, it can't move, but we check this in getEligiblePieces
      } 
      else {
        currentPos++;
      }
    }
    return currentPos;
  }
}
