import { GoGame } from "./go-core.js";

const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const boardSizeSelect = document.querySelector("#boardSize");
const playerColorSelect = document.querySelector("#playerColor");
const gameModeSelect = document.querySelector("#gameMode");
const handicapSelect = document.querySelector("#handicap");
const statusText = document.querySelector("#statusText");
const turnBadge = document.querySelector("#turnBadge");
const boardMessage = document.querySelector("#boardMessage");
const undoButton = document.querySelector("#undo");
const passButton = document.querySelector("#pass");

let game = new GoGame(19);
let playerColor = "B";
let aiColor = "W";
let aiThinking = false;
let aiTimer = null;
let initialSnapshot = null;

function starPoints(size) {
  if (size === 19) return [3, 9, 15];
  if (size === 13) return [3, 6, 9];
  return [2, 4, 6];
}

function drawBoard() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.width * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const padding = width * 0.055;
  const step = (width - padding * 2) / (game.size - 1);
  ctx.clearRect(0, 0, width, width);
  ctx.fillStyle = "#ddb66d";
  ctx.fillRect(0, 0, width, width);
  ctx.strokeStyle = "rgba(71, 51, 25, .78)";
  ctx.lineWidth = Math.max(1, width / 700);

  for (let i = 0; i < game.size; i++) {
    const p = padding + i * step;
    ctx.beginPath();
    ctx.moveTo(padding, p);
    ctx.lineTo(width - padding, p);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p, padding);
    ctx.lineTo(p, width - padding);
    ctx.stroke();
  }

  const stars = starPoints(game.size);
  for (const r of stars) {
    for (const c of stars) {
      ctx.beginPath();
      ctx.arc(padding + c * step, padding + r * step, Math.max(2.2, width * .006), 0, Math.PI * 2);
      ctx.fillStyle = "#4c3519";
      ctx.fill();
    }
  }

  const stoneRadius = step * .46;
  for (let r = 0; r < game.size; r++) {
    for (let c = 0; c < game.size; c++) {
      const value = game.board[r][c];
      if (!value) continue;
      const x = padding + c * step;
      const y = padding + r * step;
      ctx.beginPath();
      ctx.arc(x, y, stoneRadius, 0, Math.PI * 2);
      if (value === "B") {
        const gradient = ctx.createRadialGradient(x - stoneRadius * .3, y - stoneRadius * .35, 1, x, y, stoneRadius);
        gradient.addColorStop(0, "#777");
        gradient.addColorStop(.25, "#303030");
        gradient.addColorStop(1, "#080808");
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createRadialGradient(x - stoneRadius * .3, y - stoneRadius * .35, 1, x, y, stoneRadius);
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(.8, "#eee");
        gradient.addColorStop(1, "#bbb");
        ctx.fillStyle = gradient;
      }
      ctx.fill();
      ctx.strokeStyle = value === "W" ? "#aaa" : "#111";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function colorName(color) {
  return color === "B" ? "黑棋" : "白棋";
}

function updateStatus() {
  const score = game.getScore();
  document.querySelector("#blackScore").textContent = Number.isInteger(score.B) ? score.B : score.B.toFixed(1);
  document.querySelector("#whiteScore").textContent = Number.isInteger(score.W) ? score.W : score.W.toFixed(1);
  document.querySelector("#moveCount").textContent = String(game.history.length);

  const stone = turnBadge.querySelector(".stone-mini");
  stone.className = `stone-mini ${game.turn === "B" ? "black" : "white"}`;

  if (game.ended) {
    const winner = score.B > score.W ? "黑棋" : score.W > score.B ? "白棋" : "平手";
    turnBadge.querySelector("strong").textContent = "對局結束";
    statusText.textContent = `終局：${winner}勝（黑 ${score.B}／白 ${score.W}）`;
    boardMessage.textContent = `${winner}勝`;
    boardMessage.hidden = false;
  } else if (aiThinking) {
    turnBadge.querySelector("strong").textContent = "AI 思考中";
    statusText.textContent = "AI 正在選擇合法落點...";
  } else {
    const isPlayer = game.turn === playerColor;
    turnBadge.querySelector("strong").textContent = `輪到${colorName(game.turn)}`;
    statusText.textContent = isPlayer ? `輪到你執${colorName(playerColor)}落子。` : `輪到 AI 執${colorName(aiColor)}。`;
  }
  undoButton.disabled = aiThinking || !game.history.length;
  passButton.disabled = aiThinking || game.ended;
  drawBoard();
}

function isLegalTurn() {
  return !game.ended && !aiThinking && game.turn === playerColor;
}

function finishAiTurn() {
  aiThinking = true;
  updateStatus();
  aiTimer = window.setTimeout(() => {
    const move = game.chooseAiMove(aiColor);
    if (move) game.play(move.row, move.col);
    else game.pass();
    aiThinking = false;
    aiTimer = null;
    updateStatus();
  }, 550);
}

function maybeStartAi() {
  if (!game.ended && game.turn === aiColor) finishAiTurn();
}

canvas.addEventListener("click", event => {
  if (!isLegalTurn()) return;
  const rect = canvas.getBoundingClientRect();
  const padding = rect.width * .055;
  const step = (rect.width - padding * 2) / (game.size - 1);
  const col = Math.round((event.clientX - rect.left - padding) / step);
  const row = Math.round((event.clientY - rect.top - padding) / step);
  if (row < 0 || col < 0 || row >= game.size || col >= game.size) return;
  const result = game.play(row, col);
  if (!result.ok) {
    statusText.textContent = result.reason;
  } else {
    updateStatus();
    maybeStartAi();
  }
});

function setupNewGame() {
  if (aiTimer) window.clearTimeout(aiTimer);
  aiTimer = null;
  aiThinking = false;
  const size = Number(boardSizeSelect.value);
  playerColor = playerColorSelect.value;
  aiColor = playerColor === "B" ? "W" : "B";
  game = new GoGame(size);
  if (gameModeSelect.value === "handicap") {
    const handicap = Number(handicapSelect.value);
    game.setupHandicap(handicap);
  }
  boardMessage.hidden = true;
  initialSnapshot = game.snapshot();
  updateStatus();
  maybeStartAi();
}

document.querySelector("#newGame").addEventListener("click", setupNewGame);

document.querySelector("#restart").addEventListener("click", () => {
  if (aiTimer) window.clearTimeout(aiTimer);
  aiTimer = null;
  aiThinking = false;
  game.reset();
  if (gameModeSelect.value === "handicap") game.setupHandicap(Number(handicapSelect.value));
  boardMessage.hidden = true;
  updateStatus();
  maybeStartAi();
});

undoButton.addEventListener("click", () => {
  if (aiThinking) return;
  game.undo();
  if (game.turn === aiColor) game.undo();
  boardMessage.hidden = true;
  updateStatus();
});

passButton.addEventListener("click", () => {
  if (!isLegalTurn()) return;
  game.pass();
  boardMessage.hidden = true;
  updateStatus();
  if (!game.ended) maybeStartAi();
});

window.addEventListener("resize", drawBoard);
window.addEventListener("load", setupNewGame);
