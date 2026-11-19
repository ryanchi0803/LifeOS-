export class GoGame {
  constructor(size = 19) {
    if (![9, 13, 19].includes(size)) throw new Error("Unsupported board size");
    this.size = size;
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.turn = "B";
    this.history = [];
    this.passCount = 0;
    this.ended = false;
    this.komi = 6.5;
    this.previousPosition = null;
  }

  cloneBoard(board = this.board) {
    return board.map(row => [...row]);
  }

  positionKey(board = this.board) {
    return board.map(row => row.map(v => v || ".").join("")).join("/");
  }

  neighbors(row, col) {
    const result = [];
    if (row > 0) result.push([row - 1, col]);
    if (row < this.size - 1) result.push([row + 1, col]);
    if (col > 0) result.push([row, col - 1]);
    if (col < this.size - 1) result.push([row, col + 1]);
    return result;
  }

  getGroup(row, col, board = this.board) {
    const color = board[row][col];
    if (!color) return { stones: [], liberties: new Set() };
    const stones = [];
    const visited = new Set();
    const stack = [[row, col]];
    while (stack.length) {
      const [r, c] = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (board[r][c] !== color) continue;
      stones.push([r, c]);
      for (const [nr, nc] of this.neighbors(r, c)) {
        if (!board[nr][nc]) {
          visited.add(`${nr},${nc}`);
          // keep liberties separate below
        }
      }
    }
    const liberties = new Set();
    for (const [r, c] of stones) {
      for (const [nr, nc] of this.neighbors(r, c)) {
        if (!board[nr][nc]) liberties.add(`${nr},${nc}`);
      }
    }
    return { stones, liberties };
  }

  snapshot() {
    return {
      board: this.cloneBoard(),
      turn: this.turn,
      passCount: this.passCount,
      ended: this.ended,
      previousPosition: this.previousPosition
    };
  }

  restore(snapshot) {
    this.board = this.cloneBoard(snapshot.board);
    this.turn = snapshot.turn;
    this.passCount = snapshot.passCount;
    this.ended = snapshot.ended;
    this.previousPosition = snapshot.previousPosition;
  }

  play(row, col) {
    if (this.ended) return { ok: false, reason: "對局已結束" };
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= this.size || col >= this.size) {
      return { ok: false, reason: "落子位置無效" };
    }
    if (this.board[row][col]) return { ok: false, reason: "此處已有棋子" };

    const before = this.snapshot();
    const board = this.cloneBoard();
    board[row][col] = this.turn;
    const opponent = this.turn === "B" ? "W" : "B";
    const checked = new Set();
    let captured = [];

    for (const [nr, nc] of this.neighbors(row, col)) {
      if (board[nr][nc] !== opponent) continue;
      const key = `${nr},${nc}`;
      if (checked.has(key)) continue;
      const group = this.getGroup(nr, nc, board);
      for (const [gr, gc] of group.stones) checked.add(`${gr},${gc}`);
      if (group.liberties.size === 0) {
        captured.push(...group.stones);
      }
    }
    for (const [r, c] of captured) board[r][c] = null;

    const gameForCheck = new GoGame(this.size);
    gameForCheck.board = board;
    const ownGroup = gameForCheck.getGroup(row, col, board);
    if (ownGroup.liberties.size === 0) return { ok: false, reason: "禁止自殺落子" };

    const position = this.positionKey(board);
    if (this.previousPosition === position) return { ok: false, reason: "簡單劫：不能立即重複棋局" };

    this.history.push(before);
    this.board = board;
    this.passCount = 0;
    this.previousPosition = this.positionKey(before.board);
    this.turn = opponent;
    return { ok: true, captured: captured.length };
  }

  pass() {
    if (this.ended) return false;
    this.history.push(this.snapshot());
    this.passCount += 1;
    this.previousPosition = null;
    if (this.passCount >= 2) this.ended = true;
    this.turn = this.turn === "B" ? "W" : "B";
    return true;
  }

  undo() {
    if (!this.history.length) return false;
    const snapshot = this.history.pop();
    this.restore(snapshot);
    return true;
  }

  getLegalMoves(color = this.turn) {
    const originalTurn = this.turn;
    this.turn = color;
    const moves = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.board[r][c]) {
          const result = this.play(r, c);
          if (result.ok) {
            moves.push({ row: r, col: c, captured: result.captured });
            this.undo();
          }
        }
      }
    }
    this.turn = originalTurn;
    return moves;
  }

  chooseAiMove(color = this.turn) {
    const legal = this.getLegalMoves(color);
    if (!legal.length) return null;
    const captures = legal.filter(move => move.captured > 0);
    const pool = captures.length ? captures : legal;
    const center = (this.size - 1) / 2;
    const ranked = pool.map(move => ({
      ...move,
      rank: -Math.abs(move.row - center) - Math.abs(move.col - center) + Math.random() * 2
    })).sort((a, b) => b.rank - a.rank);
    return { row: ranked[0].row, col: ranked[0].col };
  }

  setupHandicap(count) {
    if (!count) return;
    const n = this.size;
    const corners = n === 19
      ? [[3, 3], [3, 15], [15, 3], [15, 15], [9, 9], [9, 3], [9, 15], [3, 9], [15, 9]]
      : n === 13
        ? [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6], [6, 3], [6, 9], [3, 6], [9, 6]]
        : [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4], [4, 2], [4, 6], [2, 4], [6, 4]];
    for (let i = 0; i < count && i < corners.length; i++) {
      const [r, c] = corners[i];
      this.board[r][c] = "B";
    }
    this.turn = "W";
  }

  getScore() {
    const territory = { B: 0, W: 0 };
    const visited = new Set();
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] || visited.has(`${r},${c}`)) continue;
        const region = [];
        const borders = new Set();
        const stack = [[r, c]];
        while (stack.length) {
          const [nr, nc] = stack.pop();
          const key = `${nr},${nc}`;
          if (visited.has(key) || this.board[nr][nc]) continue;
          visited.add(key);
          region.push([nr, nc]);
          for (const [rr, cc] of this.neighbors(nr, nc)) {
            if (this.board[rr][cc]) borders.add(this.board[rr][cc]);
            else if (!visited.has(`${rr},${cc}`)) stack.push([rr, cc]);
          }
        }
        if (borders.size === 1) territory[[...borders][0]] += region.length;
      }
    }
    let blackStones = 0;
    let whiteStones = 0;
    for (const row of this.board) {
      for (const value of row) {
        if (value === "B") blackStones++;
        if (value === "W") whiteStones++;
      }
    }
    return {
      B: blackStones + territory.B,
      W: whiteStones + territory.W + this.komi,
      territory,
      blackStones,
      whiteStones
    };
  }
}
