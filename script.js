const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];

// متابعة المستوى والنتيجة
let level = 1;
let score = 0;
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');

// الحفاظ على الحالة الحالية لكل خلية في اللعبة باستخدام مصفوفة ثنائية الأبعاد
const playfield = [];

// ملء الحالة الفارغة
for (let row = -2; row < 20; row++) {
  playfield[row] = [];
  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0;
  }
}

// كيفية رسم كل قطعة تترس
const tetrominos = {
  'I': [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'J': [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'L': [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'O': [
    [1, 1],
    [1, 1]
  ],
  'S': [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

// ألوان كل قطعة تترس
const colors = {
  'I': 'cyan',
  'O': 'yellow',
  'T': 'purple',
  'S': 'green',
  'Z': 'red',
  'J': 'blue',
  'L': 'orange'
};

let count = 0;
let tetromino = getNextTetromino();
let rAF = null;  // تتبع إطار الرسوم المتحركة حتى نتمكن من إلغائه
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000; // معدل السقوط الأساسي
let isPaused = false;

// إضافة مؤثرات صوتية
const backgroundMusic = document.getElementById('background-music');
backgroundMusic.volume = 0.5;  // ضبط مستوى الصوت
const lineClearSound = new Audio('line-clear.mp3');
const gameOverSound = new Audio('game-over.mp3');

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

function loop(timestamp) {
  if (!gameOver && !isPaused) {
    rAF = requestAnimationFrame(loop);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // رسم منطقة اللعب
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        if (playfield[row][col]) {
          const name = playfield[row][col];
          context.fillStyle = colors[name];
          context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
        }
      }
    }

    // رسم قطعة التترس النشطة
    if (tetromino) {
      dropCounter += timestamp - count;
      count = timestamp;

      if (dropCounter > dropInterval) {
        tetromino.row++;
        dropCounter = 0;

        if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
          tetromino.row--;
          placeTetromino();
        }
      }

      context.fillStyle = colors[tetromino.name];
      for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
          if (tetromino.matrix[row][col]) {
            context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
          }
        }
      }
    }
  }
}

function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) {
          return showGameOver();
        }
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  let linesCleared = 0;
  for (let row = playfield.length - 1; row >= 0;) {
    if (playfield[row].every(cell => !!cell)) {
      linesCleared++;
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r - 1][c];
        }
      }
    } else {
      row--;
    }
  }

  if (linesCleared > 0) {
    score += linesCleared * 100;
    scoreElement.textContent = score;

    if (score >= level * 1000) {
      level++;
      levelElement.textContent = level;
      dropInterval *= 0.9; // زيادة سرعة السقوط مع تقدم المستوى
    }

    playSound(lineClearSound);
  }

  tetromino = getNextTetromino();
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
  playSound(gameOverSound);
  backgroundMusic.pause();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function generateSequence() {
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
}

function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }
  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];

  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = name === 'I' ? -1 : -2;

  return {
    name: name,
    matrix: matrix,
    row: row,
    col: col
  };
}

function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );
  return result;
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          playfield[cellRow + row][cellCol + col])
      ) {
        return false;
      }
    }
  }
  return true;
}

document.addEventListener('keydown', function (e) {
  if (gameOver || isPaused) return;
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37
      ? tetromino.col - 1
      : tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }
  if (e.which === 38) {
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }
  if (e.which === 40) {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
      return;
    }
    tetromino.row = row;
  }
});

// إضافة أحداث الأزرار
document.getElementById('info-btn').addEventListener('click', function () {
  document.getElementById('info-modal').style.display = 'block';
});

document.getElementById('pause-btn').addEventListener('click', function () {
  isPaused = !isPaused;
  if (!isPaused) {
    rAF = requestAnimationFrame(loop);
    backgroundMusic.play();
  } else {
    backgroundMusic.pause();
  }
  this.textContent = isPaused ? 'متابعة' : 'إيقاف مؤقت';
});

document.getElementById('restart-btn').addEventListener('click', function () {
  gameOver = false;
  isPaused = false;
  playfield.forEach(row => row.fill(0));
  tetromino = getNextTetromino();
  score = 0;
  level = 1;
  scoreElement.textContent = score;
  levelElement.textContent = level;
  dropInterval = 1000;
  backgroundMusic.play();
  loop();
});

document.querySelector('.close').addEventListener('click', function () {
  document.getElementById('info-modal').style.display = 'none';
});

rAF = requestAnimationFrame(loop);
backgroundMusic.play();
