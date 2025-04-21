const overworldSketch = (p) => {
  /* exported preload, setup, draw, placeTile */

  let seed = 0;
  let tilesetImage;
  let currentGrid = [];
  let numRows, numCols;

  p.preload = function() {
    tilesetImage = p.loadImage(
      "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
    );
  };

  function reseed() {
    seed = (seed | 0) + 1;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    p.select("#seedReport-overworld").html("seed " + seed);
    regenerateGrid();
  }

  function regenerateGrid() {
    p.select("#asciiBox-overworld").value(
      gridToString(generateGrid(numCols, numRows))
    );
    reparseGrid();
  }

  function reparseGrid() {
    currentGrid = stringToGrid(
      p.select("#asciiBox-overworld").value()
    );
  }

  function gridToString(grid) {
    let rows = [];
    for (let i = 0; i < grid.length; i++) {
      rows.push(grid[i].join(""));
    }
    return rows.join("\n");
  }

  function stringToGrid(str) {
    let grid = [];
    let lines = str.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let row = [];
      let chars = lines[i].split("");
      for (let j = 0; j < chars.length; j++) {
        row.push(chars[j]);
      }
      grid.push(row);
    }
    return grid;
  }

  p.setup = function() {
    const asciiBox = p.select("#asciiBox-overworld");
    numCols = asciiBox.attribute("rows") | 0;
    numRows = asciiBox.attribute("cols") | 0;

    p.createCanvas(16 * numCols, 16 * numRows)
      .parent("canvasContainer-overworld");
    p.select("canvas")
      .elt.getContext("2d")
      .imageSmoothingEnabled = false;

    p.select("#reseed-overworld").mousePressed(reseed);
    asciiBox.input(reparseGrid);

    reseed();
  };

  p.draw = function() {
    p.randomSeed(seed);
    drawGrid(currentGrid);
  };

  function placeTile(i, j, ti, tj) {
    p.image(
      tilesetImage,
      16 * j,
      16 * i,
      16,
      16,
      8 * ti,
      8 * tj,
      8,
      8
    );
  }

  /* exported generateGrid, drawGrid */
  /* global placeTile, random, noise, millis */

  const lookupOW = [
    [1, 1], [1, 0], [0, 1], [0, 0],
    [2, 1], [2, 0], [1, 1], [1, 0],
    [1, 2], [1, 1], [0, 2], [0, 1],
    [2, 2], [2, 1], [1, 2], [1, 1],
  ];

  function gridCheck(grid, i, j, t) {
    return (
      i >= 0 &&
      i < grid.length &&
      j >= 0 &&
      j < grid[0].length &&
      grid[i][j] === t
    );
  }

  function gridCode(grid, i, j, t) {
    return (
      (gridCheck(grid, i - 1, j, t) << 0) +
      (gridCheck(grid, i, j - 1, t) << 1) +
      (gridCheck(grid, i, j + 1, t) << 2) +
      (gridCheck(grid, i + 1, j, t) << 3)
    );
  }

  function drawContext(grid, i, j, target, baseTi, baseTj, invert = false) {
    let code = gridCode(grid, i, j, target);
    if (invert) code = (~code) & 0xf;
    const [dx, dy] = lookupOW[code];
    placeTile(i, j, baseTi + dx, baseTj + dy);
  }

  function generateGrid(cols, rows) {
    const xo = p.random(0, 1e3),
      yo = p.random(0, 1e3);
    let g = Array(rows)
      .fill()
      .map(() => Array(cols).fill(2));
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const o = p.noise((x + xo) / 40, (y + yo) / 40);
        g[y][x] =
          Math.abs(o - 0.5) < 0.05
            ? 0
            : p.noise((x + xo) / 20, (y + yo) / 20) < 0.5
            ? 1
            : 2;
      }
    const d = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    let c = g.map((r) => r.slice());
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const cnt = [0, 0, 0];
        for (const [dy, dx] of d) {
          const ny = y + dy,
            nx = x + dx;
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols)
            cnt[g[ny][nx]]++;
        }
        cnt[g[y][x]]++;
        c[y][x] = cnt.indexOf(Math.max(cnt[0], cnt[1], cnt[2]));
      }
    return c.map((r) =>
      r.map((v) => (v === 0 ? "w" : v === 1 ? ":" : "."))
    );
  }

  function drawGrid(grid) {
    p.background(0);
    const t = p.millis() / 1e3,
      g = 8;
    for (let i = 0; i < grid.length; i++)
      for (let j = 0; j < grid[i].length; j++) {
        const c = grid[i][j],
          b = Math.floor(
            4 * Math.pow(p.noise(t / 6, i / 4, j / 4 + t), 2)
          );
        placeTile(i, j, b, 14);
        if (c === ":") {
          placeTile(
            i,
            j,
            Math.floor(Math.pow(p.random(), g) * 4),
            3
          );
        } else {
          drawContext(grid, i, j, "w", 9, 3, true);
        }
        if (c === ".") {
          const s = p.map(
              Math.sin(t + (i + j) * 0.12),
              -1,
              1,
              0.7,
              1
            ),
            gi = p.noise(t / 6, i + 50, j / 4 + t + 50) * s;
          placeTile(i, j, Math.floor(Math.pow(gi, 2) * 4), 0);
        } else {
          drawContext(grid, i, j, ".", 4, 0);
        }
      }
    const deco = [];
    for (let ti = 16; ti <= 21; ti++) {
      for (let tj = 0; tj <= 5; tj++) deco.push({ ti, tj });
    }
    for (let ti = 24; ti <= 27; ti++) {
      deco.push({ ti, tj: 0 }, { ti, tj: 1 });
    }
    for (let i = 0; i < grid.length; i++)
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === "." && p.random() < 0.07) {
          const d = p.random(deco);
          placeTile(i, j, d.ti, d.tj);
        }
      }
  }
};

const dungeonSketch = (p) => {
  /* exported preload, setup, draw, placeTile */

  let seed = 0;
  let tilesetImage;
  let currentGrid = [];
  let numRows, numCols;

  p.preload = function() {
    tilesetImage = p.loadImage(
      "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
    );
  };

  function reseed() {
    seed = (seed | 0) + 1;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    p.select("#seedReport-dungeon").html("seed " + seed);
    regenerateGrid();
  }

  function regenerateGrid() {
    p.select("#asciiBox-dungeon").value(
      gridToString(generateGrid(numCols, numRows))
    );
    reparseGrid();
  }

  function reparseGrid() {
    currentGrid = stringToGrid(
      p.select("#asciiBox-dungeon").value()
    );
  }

  function gridToString(grid) {
    let rows = [];
    for (let i = 0; i < grid.length; i++) {
      rows.push(grid[i].join(""));
    }
    return rows.join("\n");
  }

  function stringToGrid(str) {
    let grid = [];
    let lines = str.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let row = [];
      let chars = lines[i].split("");
      for (let j = 0; j < chars.length; j++) {
        row.push(chars[j]);
      }
      grid.push(row);
    }
    return grid;
  }

  p.setup = function() {
    const asciiBox = p.select("#asciiBox-dungeon");
    numCols = asciiBox.attribute("rows") | 0;
    numRows = asciiBox.attribute("cols") | 0;

    p.createCanvas(16 * numCols, 16 * numRows)
      .parent("canvasContainer-dungeon");
    p.select("canvas")
      .elt.getContext("2d")
      .imageSmoothingEnabled = false;

    p.select("#reseed-dungeon").mousePressed(reseed);
    asciiBox.input(reparseGrid);

    reseed();
  };

  p.draw = function() {
    p.randomSeed(seed);
    drawGrid(currentGrid);
  };

  function placeTile(i, j, ti, tj) {
    p.image(
      tilesetImage,
      16 * j,
      16 * i,
      16,
      16,
      8 * ti,
      8 * tj,
      8,
      8
    );
  }

  /* exported generateGrid, drawGrid */
  /* global placeTile, random, sin, millis, fill, noStroke, rect, map */

  // —— Autotiling lookup table ——
  const lookupDG = [
    [0, 23], [1, 23], [2, 23], [3, 23],
    [4, 23], [5, 23], [6, 23], [7, 23],
    [1, 24], [2, 24], [3, 24], [4, 24],
    [5, 24], [6, 24], [7, 24], [8, 24],
  ];

  function gridCheckD(grid, i, j, target) {
    return (
      i >= 0 &&
      i < grid.length &&
      j >= 0 &&
      j < grid[0].length &&
      grid[i][j] === target
    );
  }

  function gridCodeD(grid, i, j, target) {
    const n = gridCheckD(grid, i - 1, j, target) ? 1 : 0;
    const s = gridCheckD(grid, i + 1, j, target) ? 1 : 0;
    const e = gridCheckD(grid, i, j + 1, target) ? 1 : 0;
    const w = gridCheckD(grid, i, j - 1, target) ? 1 : 0;
    return (n << 0) | (s << 1) | (e << 2) | (w << 3);
  }

  function drawWall(grid, i, j) {
    const code = gridCodeD(grid, i, j, ".");
    if (code > 0) {
      const [ti, tj] = lookupDG[code];
      placeTile(i, j, ti, tj);
    }
  }

  function carveRoom(grid, { x, y, w, h }) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        grid[yy][xx] = ".";
      }
    }
  }

  function carveHCorridor(grid, x1, x2, y) {
    for (let xx = Math.min(x1, x2); xx <= Math.max(x1, x2); xx++) {
      grid[y][xx] = ".";
    }
  }

  function carveVCorridor(grid, y1, y2, x) {
    for (let yy = Math.min(y1, y2); yy <= Math.max(y1, y2); yy++) {
      grid[yy][x] = ".";
    }
  }

  function generateGrid(numCols, numRows) {
    const grid = Array.from({ length: numRows }, () =>
      Array(numCols).fill("_")
    );
    const rooms = [];
    const maxRooms = 6,
      minSize = 4,
      maxSize = 10;

    for (let i = 0; i < maxRooms; i++) {
      const w = Math.floor(p.random(minSize, maxSize));
      const h = Math.floor(p.random(minSize, maxSize));
      const x = Math.floor(p.random(1, numCols - w - 1));
      const y = Math.floor(p.random(1, numRows - h - 1));
      const room = { x, y, w, h };
      let ok = true;
      for (const r of rooms) {
        if (
          x < r.x + r.w + 1 &&
          x + w + 1 > r.x &&
          y < r.y + r.h + 1 &&
          y + h + 1 > r.y
        ) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      carveRoom(grid, room);
      rooms.push(room);
    }

    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1],
        b = rooms[i];
      const ax = a.x + Math.floor(a.w / 2),
        ay = a.y + Math.floor(a.h / 2);
      const bx = b.x + Math.floor(b.w / 2),
        by = b.y + Math.floor(b.h / 2);
      carveHCorridor(grid, ax, bx, ay);
      carveVCorridor(grid, ay, by, bx);
    }

    return grid;
  }

  function drawGrid(grid) {
    p.background(0);
    const t = p.millis() / 1000;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === ".") {
          placeTile(i, j, Math.floor(p.random(4)), 15);
        } else {
          drawWall(grid, i, j);
        }
        if (grid[i][j] === ".") {
          p.noStroke();
          const glow = p.map(
            p.sin(t * 2 + i + j),
            -1,
            1,
            10,
            50
          );
          p.fill(255, 255, 255, glow);
          p.rect(j * 16, i * 16, 16, 16);
        }
      }
    }
  }
};

new p5(overworldSketch);
new p5(dungeonSketch);
