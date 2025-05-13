/* exported getInspirations, initDesign, renderDesign, mutateDesign */

// Default per‑image parameters
const DEFAULT_PARAMS = {
  largeCount: 30,          // # large blocks in the coarse pass
  smallCount: 40,         // # small blocks added in detail pass
  phaseSwitch: 300,        // frame at which to add detail blocks
  decayInterval: 200,      // frames between annealing steps
  decayFactor: 0.95,       // rateScale *= decayFactor
  // block size ranges are expressed as a fraction of the canvas
  largeBlockMin: 0.50,     // random(width*largeBlockMin, width)
  smallBlockMin: 0.10,     // random(width*smallBlockMin, width/4)
  alpha: 160               // initial alpha for every block
};

// Global mutation‑rate scaler (per sketch, not per design)
let rateScale = 1;


// Inspiration list — each image may override any parameter
function getInspirations() {
  return [
    {
      name: "Apple",
      assetUrl:
        "img/apple.png",
      credit: "Apple Inc.",
      palette: "bw",
      params: {
        largeCount: 40,
        smallCount: 10,
        phaseSwitch: 200,
        decayFactor: 0.92
      }
    },
    {
      name: "Cup",
      assetUrl:
        "img/cup.png",
      credit: "Free‑pik cup photo",
      palette: "bw-green",
      params: {
        largeCount: 60,
        smallCount: 10,
      }
    },
    {
      name: "Sunset",
      assetUrl:
        "img/sunset.jpg",
      credit: "Sunset photo from online",
      palette: "full", // default parameters
    }
  ];
}


// Palette helper
function applyPalette([r, g, b], mode) {
  if (mode === "bw") {
    const v = 0.299 * r + 0.587 * g + 0.114 * b;
    return v < 128 ? [0, 0, 0] : [255, 255, 255];
  }
  if (mode === "bw-green") {
    const choices = [
      [0, 0, 0],
      [255, 255, 255],
      [40, 200, 40]
    ];
    let best = choices[0];
    let bestDist = 1e9;
    for (const c of choices) {
      const d = sq(r - c[0]) + sq(g - c[1]) + sq(b - c[2]);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }
  return [r, g, b];
}


// Initialise design (reads params per inspiration)
function initDesign(inspiration) {
  // set the canvas size based on the container
  let canvasContainer = $('.image-container'); // Select the container using jQuery
  let canvasWidth = canvasContainer.width(); // Get the width of the container
  let aspectRatio = inspiration.image.height / inspiration.image.width;
  let canvasHeight = canvasWidth * aspectRatio; // Calculate the height based on the aspect ratio
  resizeCanvas(canvasWidth, canvasHeight);
  $(".caption").text(inspiration.credit); // Set the caption text
  
  // add the original image to #original
  const imgHTML = `<img src="${inspiration.assetUrl}" style="width:${canvasWidth}px;">`
  $('#original').empty();
  $('#original').append(imgHTML);

  const img = inspiration.image;
  const p   = { ...DEFAULT_PARAMS, ...(inspiration.params || {}) };

  // background colour
  let rSum = 0, gSum = 0, bSum = 0, n = 0;
  const yStart = floor(img.height * 0.95);
  for (let y = yStart; y < img.height; y += 2) {
    for (let x = 0; x < img.width; x += 10) {
      const c = img.get(x, y);
      rSum += c[0];
      gSum += c[1];
      bSum += c[2];
      n++;
    }
  }
  let bgRGB = [rSum / n, gSum / n, bSum / n];
  bgRGB = applyPalette(bgRGB, inspiration.palette);

  // large blocks
  const fg = [];
  for (let i = 0; i < p.largeCount; i++) {
    const sx = floor(random(img.width));
    const sy = floor(random(img.height));
    let [r, g, b] = img.get(sx, sy);
    [r, g, b] = applyPalette([r, g, b], inspiration.palette);

    fg.push({
      x: random(width),
      y: random(height),
      w: random(width * p.largeBlockMin, width),
      h: random(height * p.largeBlockMin, height),
      r, g, b,
      a: p.alpha
    });
  }

  return { bg: bgRGB, fg, phase: 1, params: p };
}


// Render design (unchanged)
function renderDesign(design) {
  background(design.bg[0], design.bg[1], design.bg[2]);
  noStroke();
  for (const box of design.fg) {
    fill(box.r, box.g, box.b, box.a);
    rect(box.x, box.y, box.w, box.h);
  }
}

function mut(value, min, max, rate) {
  const sigma = (rate * (max - min)) / 10;
  return constrain(randomGaussian(value, sigma), min, max);
}

// Mutate design
function mutateDesign(design, inspiration, baseRate) {
  const p = design.params;

  // annealing
  if (frameCount % p.decayInterval === 0 && frameCount > 0) {
    rateScale *= p.decayFactor;
  }
  const rate = baseRate * rateScale;

  // detail‑phase switch
  if (design.phase === 1 && frameCount >= p.phaseSwitch) {
    addSmallShapes(design, inspiration, p.smallCount);
    design.phase = 2;
  }

  for (let i = 0; i < 3; i++) {
    design.bg[i] = mut(design.bg[i], 0, 255, rate);
  }
  design.bg = applyPalette(design.bg, inspiration.palette);

  const paletteLimited = inspiration.palette !== "full";
  for (const box of design.fg) {
    box.x = mut(box.x, 0, width, rate);
    box.y = mut(box.y, 0, height, rate);
    box.w = mut(box.w, 5, width / 2, rate);
    box.h = mut(box.h, 5, height / 2, rate);

    if (!paletteLimited) {
      box.r = mut(box.r, 0, 255, rate);
      box.g = mut(box.g, 0, 255, rate);
      box.b = mut(box.b, 0, 255, rate);
    }
    box.a = mut(box.a, 50, 200, rate);

    [box.r, box.g, box.b] = applyPalette([box.r, box.g, box.b], inspiration.palette);
  }
}


// Add small shapes according to per‑design params
function addSmallShapes(design, inspiration, count) {
  const img = inspiration.image;
  const p   = design.params;
  for (let i = 0; i < count; i++) {
    const sx = floor(random(img.width));
    const sy = floor(random(img.height));
    let [r, g, b] = img.get(sx, sy);
    [r, g, b] = applyPalette([r, g, b], inspiration.palette);

    design.fg.push({
      x: random(width),
      y: random(height),
      w: random(width * p.smallBlockMin, width / 4),
      h: random(height * p.smallBlockMin, height / 4),
      r, g, b,
      a: p.alpha
    });
  }
}
