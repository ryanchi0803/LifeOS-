import assert from "node:assert";
import { GoGame } from "../go-core.js";

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("captures a surrounded stone", () => {
  const game = new GoGame(9);
  game.board[1][1] = "W";
  game.board[0][1] = "B";
  game.board[1][0] = "B";
  game.board[1][2] = "B";
  game.turn = "B";
  const result = game.play(2, 1);
  assert.equal(result.ok, true);
  assert.equal(game.board[1][1], null);
});

test("rejects suicide", () => {
  const game = new GoGame(9);
  game.board[0][1] = "W";
  game.board[1][0] = "W";
  game.board[1][1] = "B";
  game.turn = "B";
  const result = game.play(0, 0);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "禁止自殺落子");
});

test("pass twice ends game", () => {
  const game = new GoGame(9);
  assert.equal(game.pass(), true);
  assert.equal(game.pass(), true);
  assert.equal(game.ended, true);
});

test("undo restores the previous position", () => {
  const game = new GoGame(9);
  assert.equal(game.play(4, 4).ok, true);
  assert.equal(game.undo(), true);
  assert.equal(game.board[4][4], null);
  assert.equal(game.turn, "B");
});

test("handicap setup puts stones and passes turn to white", () => {
  const game = new GoGame(19);
  game.setupHandicap(9);
  assert.equal(game.board[3][3], "B");
  assert.equal(game.board[9][9], "B");
  assert.equal(game.turn, "W");
});

test("simple score includes stones and territory", () => {
  const game = new GoGame(9);
  game.board[0][0] = "B";
  game.board[1][0] = "B";
  game.board[0][1] = "B";
  game.board[1][1] = "W";
  const score = game.getScore();
  assert(score.B > 0);
  assert(score.W >= 6.5);
});
