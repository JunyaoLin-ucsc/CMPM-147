function runAfterP5(fn){
    if (typeof noiseSeed === "function") {         // p5 helpers exist
      fn();                                        // safe – run now
    } else {                                       // p5 still downloading
      setTimeout(()=>runAfterP5(fn), 25);          // try again in 25 ms
    }
  }

let currentWorld = '1'; 
let worldSeed    = 0;

/* ---------- P5 “ENGINE”  -------------------------------------------- */
"use strict";

/* global p5 */
/* exported preload, setup, draw, mouseClicked */

// Project base code provided by {amsmith,ikarth}@ucsc.edu


let tile_width_step_main; 
let tile_height_step_main; 

let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
  let i = (world_x - world_y) * tile_width_step_main;
  let j = (world_x + world_y) * tile_height_step_main;
  return [i + camera_x, j + camera_y];
}

function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
  let i = (world_x - world_y) * tile_width_step_main;
  let j = (world_x + world_y) * tile_height_step_main;
  return [i, j];
}

function tileRenderingOrder(offset) {
  return [offset[1] - offset[0], offset[0] + offset[1]];
}

function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
  screen_x -= camera_x;
  screen_y -= camera_y;
  screen_x /= tile_width_step_main * 2;
  screen_y /= tile_height_step_main * 2;
  screen_y += 0.5;
  return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
}

function cameraToWorldOffset([camera_x, camera_y]) {
  let world_x = camera_x / (tile_width_step_main * 2);
  let world_y = camera_y / (tile_height_step_main * 2);
  return { x: Math.round(world_x), y: Math.round(world_y) };
}

function worldOffsetToCamera([world_x, world_y]) {
  let camera_x = world_x * (tile_width_step_main * 2);
  let camera_y = world_y * (tile_height_step_main * 2);
  return new p5.Vector(camera_x, camera_y);
}

function preload() {
  if (window.p3_preload) {
    window.p3_preload();
  }
}
function setup() {
    const canvasContainer = document.getElementById('canvas-container');
    let cw = 800; 
    let ch = 400; 
  
    if (canvasContainer) {
        const styles = window.getComputedStyle(canvasContainer);
        cw = parseFloat(styles.width) || cw;
        ch = parseFloat(styles.height) || ch;
        console.log(`Canvas container size: ${cw} x ${ch}`); 
    } else {
        console.warn("#canvas-container not found, using default size.");
    }

    let canvas = createCanvas(cw, ch);
    canvas.parent("canvas-container"); 

    camera_offset = new p5.Vector(-width / 2, height / 2); 
    camera_velocity = new p5.Vector(0, 0);
    if (window.p3_setup) {
      window.p3_setup();
    }

    const containerDiv = document.getElementById('container');
    if (containerDiv) {
        createP("Arrow keys scroll. Clicking changes tiles.").parent(containerDiv);
    }
  }

function rebuildWorld(key) {
  if (window.p3_worldKeyChanged) {
    window.p3_worldKeyChanged(key);
  }
  tile_width_step_main = window.p3_tileWidth ? window.p3_tileWidth() : 32;
  tile_height_step_main = window.p3_tileHeight ? window.p3_tileHeight() : 14.5;
  tile_columns = Math.ceil(width / (tile_width_step_main * 2));
  tile_rows = Math.ceil(height / (tile_height_step_main * 2));
}

function mouseClicked() {
  let world_pos = screenToWorld(
    [0 - mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );

  if (window.p3_tileClicked) {
    window.p3_tileClicked(world_pos[0], world_pos[1]);
  }
}

function draw() {
  // Keyboard controls!
  if (keyIsDown(LEFT_ARROW)) {
    camera_velocity.x -= 1;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    camera_velocity.x += 1;
  }
  if (keyIsDown(DOWN_ARROW)) {
    camera_velocity.y -= 1;
  }
  if (keyIsDown(UP_ARROW)) {
    camera_velocity.y += 1;
  }

  let camera_delta = new p5.Vector(0, 0);
  camera_velocity.add(camera_delta);
  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.95); // cheap easing
  if (camera_velocity.mag() < 0.01) {
    camera_velocity.setMag(0);
  }

  let world_pos = screenToWorld(
    [0 - mouseX, mouseY],
    [camera_offset.x, camera_offset.y]
  );
  let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

  background(100);

  if (window.p3_drawBefore) {
    window.p3_drawBefore();
  }

  let overdraw = 0.1;

  let y0 = Math.floor((0 - overdraw) * tile_rows);
  let y1 = Math.floor((1 + overdraw) * tile_rows);
  let x0 = Math.floor((0 - overdraw) * tile_columns);
  let x1 = Math.floor((1 + overdraw) * tile_columns);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [
        camera_offset.x,
        camera_offset.y
      ]);
    }
    for (let x = x0; x < x1; x++) {
      drawTile(
        tileRenderingOrder([
          x + 0.5 + world_offset.x,
          y + 0.5 - world_offset.y
        ]),
        [camera_offset.x, camera_offset.y]
      ); 
    }
  }

  describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);

  if (window.p3_drawAfter) {
    window.p3_drawAfter();
  }
}

function mousePressed() {
    if (currentWorld === '3' && WORLDS['3']?._handleMousePressed) {
      WORLDS['3']._handleMousePressed();
    }
  }
  
  function mouseReleased() {
    if (currentWorld === '3' && WORLDS['3']?._handleMouseReleased) {
      WORLDS['3']._handleMouseReleased();
    }
  }

function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
}

function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
  push();
  translate(screen_x, screen_y);
  if (window.p3_drawSelectedTile) {
    window.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
  }
  pop();
}

function drawTile([world_x, world_y], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen(
    [world_x, world_y],
    [camera_x, camera_y]
  );
  push();
  translate(0 - screen_x, screen_y);
  if (window.p3_drawTile) {
    window.p3_drawTile(world_x, world_y, -screen_x, screen_y);
  }
  pop();
}

const WORLDS = Object.create(null);

// ---------- WORLD #1 --------------------------------------------------
WORLDS['1'] = (() => {
    "use strict";

/* global XXH, noiseSeed, randomSeed, noise,
          beginShape, vertex, endShape, push, pop,
          noStroke, stroke, strokeWeight, fill,
          rect, lerpColor, color, triangle,
          ellipse, text, textSize, map, pow */

let worldSeed;
let clicks = {};

function p3_preload() {}
function p3_setup() {}

function p3_worldKeyChanged (key) {
    worldSeed = XXH.h32(key, 0);
    noiseSeed(worldSeed);
    randomSeed(worldSeed);
  
    colorMode(RGB, 255);
}

function p3_tileWidth()  { return 40; }
function p3_tileHeight() { return 20; }
let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

function p3_tileClicked(i, j) {
  let k = i + "," + j;
  if (clicks[k]) delete clicks[k];
  else            clicks[k] = true;
}

function p3_drawBefore () {
    colorMode(RGB, 255);
  
    noStroke();
    fill(180, 120,  80);
    rect(-10000, -10000, 20000, 20000);
  }

function p3_drawTile(i, j) {
  let raw = noise(i * 0.08, j * 0.08);
  let baseH = pow(raw, 3) * 200;
  let bob = 10 * sin(millis() * 0.001 + i * 5 + j * 7);
  let h   = baseH + bob;

  let rawX = noise((i+1)*0.08, j*0.08);
  let rawY = noise(i*0.08, (j+1)*0.08);
  let hX   = pow(rawX,3)*200 + bob;
  let hY   = pow(rawY,3)*200 + bob;

  push();
    translate(0, -h);
    let topColor = lerpColor(color(210,140,100), color(180,100,60), raw);
    fill(topColor);
    noStroke();
    beginShape();
      vertex(-tw, 0);
      vertex(  0,-th);
      vertex( tw, 0);
      vertex(  0, th);
    endShape(CLOSE);
    stroke(
      topColor.levels[0]*0.7,
      topColor.levels[1]*0.7,
      topColor.levels[2]*0.7
    );
    strokeWeight(1);
    for (let x = -tw; x <= tw; x += 12) {
      line(x, -2, x, 2);
    }
  pop();

  let leftShade = map(hX-h, -200, 200, 160,  90);
  fill( leftShade, leftShade*0.6, leftShade*0.4 );
  noStroke();
  beginShape();
    vertex(-tw,  0);
    vertex(  0,  th);
    vertex(  0, th - h);
    vertex(-tw, -h);
  endShape(CLOSE);

  let rightShade = map(hY-h, -200, 200, 140,  80);
  fill( rightShade, rightShade*0.5, rightShade*0.3 );
  noStroke();
  beginShape();
    vertex( tw,  0);
    vertex(  0,  th);
    vertex(  0, th - h);
    vertex( tw, -h);
  endShape(CLOSE);

  let d = noise(i * 0.25, j * 0.25);
  let treeCount = floor(d * 4);
  treeCount = floor(treeCount * 0.5);

  for (let t = 0; t < treeCount; t++) {
    let nx = noise(i * 0.2 + t*1.4, j * 0.2 + t*1.8);
    let rx = map(nx, 0, 1, -tw*0.5, tw*0.5);
    let ny = noise(i * 0.27 + t*2.2, j * 0.27 + t*2.6);
    let ry = map(ny, 0, 1, -th*0.5, th*0.2) - h;
    let ns = noise(i * 0.33 + t*3.5, j * 0.33 + t*3.9);
    let s  = map(ns, 0, 1, 0.7, 1.3);
    let sway = 5 * sin(millis() * 0.002 + i + j + t);

    push();
      translate(rx + sway, ry);
      noStroke();
      fill(34,85,34);
      triangle(-8*s,  0,  8*s,  0,  0, -15*s);
      triangle(-6*s, -8*s, 6*s, -8*s, 0, -20*s);
    pop();
  }

  let k = i + "," + j;
  if (clicks[k]) {
    let angle = millis() * 0.005;
    push();
      translate(0, -h);
      rotate(angle);
      noStroke();
      fill(255,204,0);
      triangle(-6,6, 6,6, 0,-6);
      triangle(-4,4, 4,4, 0,-4);
    pop();
  }
}

function p3_drawSelectedTile(i, j) {
  let raw = noise(i * 0.08, j * 0.08);
  let h   = pow(raw, 3) * 200 + 10 * sin(millis() * 0.001 + i * 5 + j * 7);
  noFill();
  stroke(0,255,255);
  strokeWeight(3);
  beginShape();
    vertex(-tw,   -h);
    vertex(  0, -th - h);
    vertex( tw,   -h);
    vertex(  0,  th - h);
  endShape(CLOSE);
  noStroke();
  fill(0,255,255);
  textSize(12);
  text(`(${i},${j})`, 0, -h - th*0.5);
}

function p3_drawAfter() {}

  return {
    p3_preload,
    p3_setup,
    p3_worldKeyChanged,
    p3_tileWidth,
    p3_tileHeight,
    p3_tileClicked,
    p3_drawBefore,
    p3_drawTile,
    p3_drawSelectedTile,
    p3_drawAfter
  };
})();

WORLDS['2'] = (() => {
    "use strict";

/* global XXH, noiseSeed, randomSeed, noise, millis, sin, random, beginShape, vertex, endShape, push, pop, noStroke, fill, ellipse, noFill, stroke, strokeWeight, text */

let worldSeed;      
let clicks = {};    

function p3_preload() {}

function p3_setup() {}
function p3_drawAfter () {}

function p3_worldKeyChanged (key) {
    worldSeed = XXH.h32(key, 0);
    noiseSeed(worldSeed);
    randomSeed(worldSeed);
  
    colorMode(RGB, 255);
  }

function p3_tileWidth() { return 40; }
function p3_tileHeight() { return 20; }
let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

function p3_tileClicked(i, j) {
  let k = `${i},${j}`;
  if (clicks[k]) delete clicks[k];
  else clicks[k] = true;
}

function p3_drawBefore () {
    colorMode(RGB, 255); 
  
    noStroke();
    fill(200, 220, 255);
    rect(-10000, -10000, 20000, 20000);
  }
function p3_drawTile(i, j) {
  let n = noise(i * 0.1, j * 0.1);

  if (n < 0.35) {
    let t = millis() * 0.002;
    let wave = sin(i * 0.5 + j * 0.5 + t) * 3;
    let shade = 180 + 75 * noise(i * 0.1 + t, j * 0.1 + t);
    fill(60, 140, shade);
    noStroke();
    push();
      beginShape();
        vertex(-tw, wave);
        vertex(0, th + wave);
        vertex(tw, wave);
        vertex(0, -th + wave);
      endShape(CLOSE);
    pop();

  } else if (n < 0.6) {
    let alpha = 180 + 75 * sin(millis() * 0.002 + i + j);
    fill(90, 200, 100, alpha);
    noStroke();
    push();
      beginShape();
        vertex(-tw, 0);
        vertex(0, th);
        vertex(tw, 0);
        vertex(0, -th);
      endShape(CLOSE);
    pop();

  } else if (n < 0.8) {
    fill(160, 140, 90);
    noStroke();
    push();
      beginShape();
        vertex(-tw, 0);
        vertex(0, th);
        vertex(tw, 0);
        vertex(0, -th);
      endShape(CLOSE);
      for (let k = 0; k < 5; k++) {
        let rx = random(-tw * 0.4, tw * 0.4);
        let ry = random(-th * 0.4, th * 0.4);
        let pa = 100 + 100 * sin(frameCount * 0.02 + k);
        fill(120, 80, 40, pa);
        noStroke();
        ellipse(rx, ry, 2, 2);
      }
    pop();

  } else {
    fill(240, 240, 240);
    noStroke();
    push();
      beginShape();
        vertex(-tw, 0);
        vertex(0, th);
        vertex(tw, 0);
        vertex(0, -th);
      endShape(CLOSE);
    pop();
  }

  let key = `${i},${j}`;
  if (clicks[key]) {
    push();
      fill(255, 204, 0, 180);
      noStroke();
      ellipse(0, 0, tw / 4, tw / 4);
    pop();
  }
}

function p3_drawSelectedTile(i, j) {
  noFill();
  stroke(255, 0, 0);
  strokeWeight(2);
  beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
  endShape(CLOSE);
  noStroke();
  fill(0);
  text(`tile ${i},${j}`, tw, 0);
}


  return {
    p3_preload,
    p3_setup,
    p3_worldKeyChanged,
    p3_tileWidth,
    p3_tileHeight,
    p3_tileClicked,
    p3_drawBefore,
    p3_drawTile,
    p3_drawSelectedTile,
    p3_drawAfter
  };
})();

// ---------- WORLD #3 --------------------------------------------------
WORLDS['3'] = (() => {
    "use strict";

    /* Global p5 functions/vars used:
       createGraphics, colorMode, HSB, background, noStroke, randomSeed, random,
       fill, ellipse, filter, BLUR, width, height, noiseSeed, millis, floor,
       round, cos, sin, TWO_PI, image, beginShape, vertex, endShape, CLOSE,
       abs, map, mouseIsPressed, mouseX, mouseY, push, pop, stroke, strokeWeight,
       rectMode, CENTER, rect, text, textSize, textAlign, LEFT, TOP, HALF_PI, PI,
       frameCount, createVector, point, line, dist // Added dist for distance check
    */
    /* Global engine variables/functions used:
       XXH, screenToWorld, camera_offset // screenToWorld still needed for press check
    */

    const NOTE_DURATION = 2000;
    const MIN_DIST = 3, MAX_DIST = 5;
    const STATIC_STARS = 900;
    const tw = 30, th = 15; 

    let worldSeed;
    let combo = 0, gameStarted = false;
    let currentNote = null; 
    let PARTICLES = [], METEORS = [];
    let starLayer, starBlurred = false; 

    function p3_tileWidth ()  { return tw; }
    function p3_tileHeight () { return th; }

    function p3_preload () {}
    function buildStarLayer () {
      if (typeof width === 'undefined' || typeof height === 'undefined' || width <= 0 || height <= 0) {
        console.warn("buildStarLayer: width/height not ready.", width, height);
        return;
      }
      try {
        starLayer = createGraphics(width, height);
        if (!starLayer) throw new Error("createGraphics failed");
        starLayer.colorMode(HSB,360,100,100);
        starLayer.background(0);
        starLayer.noStroke();
        randomSeed(1); 
        for (let i=0; i < STATIC_STARS; i++) {
          starLayer.fill(0, 0, 100, random(150, 230));
          starLayer.ellipse(random(starLayer.width), random(starLayer.height), 2, 2);
        }
        starLayer.filter(BLUR, 2);
        starBlurred = false;
      } catch (e) {
         console.error("Error in buildStarLayer:", e);
         starLayer = null; 
      }
    }

    function p3_setup () {
      colorMode(HSB,360,100,100);
      buildStarLayer();
    }

    function windowResized() {
    const canvasContainer = document.getElementById('canvas-container');
    let cw = width;  
    let ch = height; 
  
    if (canvasContainer) {
        const styles = window.getComputedStyle(canvasContainer);
        cw = parseFloat(styles.width) || cw;
        ch = parseFloat(styles.height) || ch;
        console.log(`Resizing canvas to: ${cw} x ${ch}`); 
    }

    resizeCanvas(cw, ch);
    tile_columns = Math.ceil(width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(height / (tile_height_step_main * 2));
    if (currentWorld === '3' && WORLDS['3']?.buildStarLayer) {

        if(window.p3_setup) window.p3_setup(); 
  
    } else if (_w()?.p3_setup) { 
    }
  
  }

    function resetState(){
      combo = 0;
      gameStarted = false;
      currentNote = null; 
      PARTICLES.length = 0;
      METEORS.length = 0;
      if (starLayer && starBlurred) {
         try { starLayer.filter(BLUR, 2); } catch(e) { console.error("Error resetting blur:", e); }
         starBlurred = false;
      }
    }

    function p3_worldKeyChanged(key){
      worldSeed = XXH.h32(key,0);
      noiseSeed(worldSeed);
      randomSeed(worldSeed);
      colorMode(HSB,360,100,100);
      resetState(); 
      if(!starLayer || starLayer.width !== width || starLayer.height !== height) {
        buildStarLayer();
      } else if (starBlurred) { 
        try { starLayer.filter(BLUR, 2); } catch(e) { console.error("Error resetting blur:", e); }
        starBlurred = false;
      }
    }

    function spawnNote(i,j){
      const type = ["circle","square","star"][floor(random(3))];
      currentNote = {
        i, j, type, start: millis(), held: false,
        duration: NOTE_DURATION + (type === "square" ? 5000 : 0),
        dir: null, len: 0, targetI: null, targetJ: null,
        pixelPath: null, baseScreen: null, dragging: false
      };

      if(type === "square"){
        const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
        const d = dirs[floor(random(4))];
        const len = floor(random(3, 8));
        Object.assign(currentNote, {
          dir: d, len,
          targetI: i + d[0] * len,
          targetJ: j + d[1] * len,
          pixelPath: Array.from({length: len}, (_, k) => {
            const dx = d[0] * (k + 1), dy = d[1] * (k + 1);
            return { x: (dx - dy) * tw, y: (dx + dy) * th };
          })
        });
      }
    }

    function spawnParticles(x,y){
      for(let k=0; k < 12; k++) {
        PARTICLES.push({
          x, y, dx: (random() * 2 - 1) * 3, dy: (random() * 2 - 1) * 3,
          life: 30 + random() * 30
        });
      }
    }

    function hitNote(){
      combo++;
      const hitX = mouseX; const hitY = mouseY;
      if (currentNote) { nextNote(); spawnParticles(hitX, hitY); }
      else { resetState(); }
    }

    function fail(){
      resetState();
    }

    function nextNote(){
      if (!currentNote) return;
      const {i: pi, j: pj} = currentNote;
      let ni, nj, guard = 0;
      do {
        const dist = MIN_DIST + random(MAX_DIST - MIN_DIST);
        const angle = random(TWO_PI);
        ni = pi + round(cos(angle) * dist);
        nj = pj + round(sin(angle) * dist);
      } while((ni === pi && nj === pj) && ++guard < 20);
      spawnNote(ni, nj);
    }

    function p3_tileClicked(i,j){
      if(!gameStarted){ gameStarted = true; combo = 0; spawnNote(i,j); return; }
      if(currentNote && currentNote.type === "circle" && i === currentNote.i && j === currentNote.j) {
        hitNote();
      }
    }

    function _handleMousePressed(){
        if(!currentNote || currentNote.type !== "square") return;
        const [ti, tj] = screenToWorld([0 - mouseX, mouseY], [camera_offset.x, camera_offset.y]);
        if(ti === currentNote.i && tj === currentNote.j) {
          currentNote.dragging = true;
        }
      };

    function _handleMouseReleased(){
        if(!currentNote || currentNote.type !== "square" || !currentNote.dragging) return;
        currentNote.dragging = false;

        if (currentNote.baseScreen && currentNote.pixelPath && currentNote.pixelPath.length > 0) {
            const startScreenX = currentNote.baseScreen.x;
            const startScreenY = currentNote.baseScreen.y;
            const lastPathPoint = currentNote.pixelPath[currentNote.pixelPath.length - 1];
            const targetScreenX = startScreenX + lastPathPoint.x;
            const targetScreenY = startScreenY + lastPathPoint.y;

            const distance = dist(mouseX, mouseY, targetScreenX, targetScreenY);

            const threshold = tw; 
            if (distance < threshold) {
                hitNote();
            } else {
                fail();
            }
        } else {
            console.warn("Square release check failed: Missing baseScreen or pixelPath.");
            fail();
        }
      };

    function p3_drawBefore (){
      if (starLayer) {
         try { image(starLayer, 0, 0); } catch(e) {console.error("Error drawing starLayer:", e); starLayer = null;}
      } else {
         background(0);
         if (frameCount > 10 && (typeof width !== 'undefined' && width > 0)) buildStarLayer();
      }
      if (typeof width !== 'undefined' && typeof height !== 'undefined') {
        if(frameCount % 90 === 0 && random() < 0.5){
          const fromLeft = random() < 0.5;
          METEORS.push({
            x: fromLeft ? -40 : width + 40, y: random(30, height - 30),
            vx: fromLeft ? 10 : -10
          });
        }
        for(let i = METEORS.length - 1; i >= 0; i--){
          const m = METEORS[i];
          stroke(0, 0, 100, 220); strokeWeight(2);
          point(m.x, m.y);
          line(m.x, m.y, m.x - m.vx * 4, m.y + 2);
          m.x += m.vx;
          if(m.x < -60 || m.x > width + 60) { METEORS.splice(i, 1); }
        }
      }
    }

    function p3_drawTile(i,j,cx,cy){
      push();

      const flashSeed = XXH.h32(`f:${i},${j}`, worldSeed).toNumber();
      randomSeed(flashSeed);
      if(random() < 0.4){
        let sx, sy;
        do {
          sx = random(-tw, tw); sy = random(-th, th);
        } while(abs(sx) / tw + abs(sy) / th > 1);
        const alpha = map(sin(frameCount * 0.08 + flashSeed % 100), -1, 1, 0, 200);
        if(alpha > 25){
          noStroke(); fill(0, 0, 100, alpha); ellipse(sx, sy, 2, 2);
        }
      }

      noFill(); stroke(0, 0, 100, 50); strokeWeight(1);
      beginShape(); vertex(-tw, 0); vertex(0, th); vertex(tw, 0); vertex(0, -th); endShape(CLOSE);

      if(currentNote && i === currentNote.i && j === currentNote.j){
        const elapsed = millis() - currentNote.start;
        const hueNow = (millis() * 0.02) % 360;

        if(currentNote.type === "circle"){
          if(elapsed > NOTE_DURATION) {
             fail(); pop(); return; // Exit after state change
          } else {
            const t = 1 - elapsed / NOTE_DURATION;
            noFill(); stroke((hueNow + 180) % 360, 80, 80); strokeWeight(2);
            ellipse(0, 0, tw * t * 1.5, th * t * 1.5);
          }

        } else if (currentNote.type === "star") {
            let isCurrentlyHeldInside = false;
            if (mouseIsPressed) {
              const inside = abs(mouseX - cx) < tw && abs(mouseY - cy) < th &&
                             (abs(mouseX - cx) / tw + abs(mouseY - cy) / th < 1);
              if (inside) {
                isCurrentlyHeldInside = true;
                currentNote.held = true;
              }
            }

            if (elapsed >= NOTE_DURATION) {
              if (currentNote.held) { hitNote(); } else { fail(); }
               pop(); return; // Exit after state change
            } else { // Time not up, draw star
              const t = 1 - elapsed / NOTE_DURATION;
              const R = tw * t, r = R * 0.5;
              noFill(); stroke((hueNow + 180) % 360, 80, 80); strokeWeight(2);
              beginShape();
              for (let a = -HALF_PI, k = 0; k < 5; k++) {
                vertex(cos(a) * R, sin(a) * R); a += PI / 5;
                vertex(cos(a) * r, sin(a) * r); a += PI / 5;
              }
              endShape(CLOSE);
            }
        }

        if (currentNote && currentNote.type === "square") {
            currentNote.baseScreen = { x: cx, y: cy };
        }
      } 

      pop(); 
    }

    function p3_drawSelectedTile(i, j, cx, cy){
       push();
       noFill(); stroke(0, 100, 100); strokeWeight(2);
       beginShape(); vertex(-tw, 0); vertex(0, th); vertex(tw, 0); vertex(0, -th); endShape(CLOSE);
       pop();
    }

    function p3_drawAfter (){
      push();

      if(currentNote && currentNote.type === "square" && currentNote.baseScreen){
        const elapsed = millis() - currentNote.start;
        if(elapsed > currentNote.duration) {
           if (currentNote) fail();
           pop(); return;
        }

        if (currentNote.pixelPath) {
          const {x: bx, y: by} = currentNote.baseScreen; 

          noFill(); stroke(0, 100, 100, 150); strokeWeight(2);
          beginShape();
          vertex(bx, by);
          for(const p of currentNote.pixelPath) { vertex(bx + p.x, by + p.y); }
          endShape();

          const t = 1 - elapsed / currentNote.duration;
          const sz = max(tw * t * 0.8, 2); 
          const px = currentNote.dragging ? mouseX : bx; 
          const py = currentNote.dragging ? mouseY : by;
          noFill(); stroke((millis() * 0.02 + 180) % 360, 80, 80); strokeWeight(2);
          rectMode(CENTER);
          rect(px, py, sz, sz);
        }
      }

      for(let i = PARTICLES.length - 1; i >= 0; i--){
        const p = PARTICLES[i];
        p.x += p.dx; p.y += p.dy;
        p.life--;
        if (p.life <= 0) { PARTICLES.splice(i, 1); }
        else {
          noStroke(); fill(60, 100, 100, p.life / 60 * 255); 
          ellipse(p.x, p.y, 4, 4);
        }
      }

      if(combo > 0){
        noStroke(); fill(0, 0, 100); 
        textSize(20); textAlign(LEFT, TOP);
        text(`Combo: ${combo}`, 20, 40);
      }
      if(gameStarted && !starBlurred && starLayer){
         try { starLayer.filter(BLUR, 1); } catch(e) {console.error("Error blurring layer:", e); }
         starBlurred = true;
      }

      pop();
    }

    return {
        p3_preload, p3_setup, p3_worldKeyChanged,
        p3_tileWidth, p3_tileHeight,
        p3_tileClicked, p3_drawBefore, p3_drawTile,
        p3_drawSelectedTile, p3_drawAfter,
        _handleMousePressed, _handleMouseReleased
    };
})(); 

function _w(){ return WORLDS[currentWorld]; }

function p3_preload()                              { _w()?.p3_preload?.(); }
function p3_setup()                                { _w()?.p3_setup?.();   }
function p3_worldKeyChanged(key)                   { _w()?.p3_worldKeyChanged?.(key); }
function p3_tileWidth()                            { return _w()?.p3_tileWidth?.()  ??32; }
function p3_tileHeight()                           { return _w()?.p3_tileHeight?.() ??16; }
function p3_tileClicked(i,j)                       { _w()?.p3_tileClicked?.(i,j); }
function p3_drawBefore()                           { _w()?.p3_drawBefore?.(); }
function p3_drawTile(i,j,cx,cy)                    { _w()?.p3_drawTile?.(i,j,cx,cy); }
function p3_drawSelectedTile(i,j,cx,cy)            { _w()?.p3_drawSelectedTile?.(i,j,cx,cy); }
function p3_drawAfter()                            { _w()?.p3_drawAfter?.(); }

window.addEventListener("DOMContentLoaded", () => {

    runAfterP5(() => { // ⬅ 确保 p5 已加载

      const bar = document.createElement("div");
      bar.style.cssText =
        "position:absolute; left:8px; top:8px;" +
        "background:rgba(0,0,0,.35); padding:6px 8px;" +
        "color:white; font-family:sans-serif; border-radius:6px;";
      const canvasContainer = document.getElementById("canvas-container");
      if (canvasContainer) {
        canvasContainer.appendChild(bar);
      } else {
        console.error("Canvas container not found!");
        return; 
      }

      ["1", "2", "3"].forEach(id => {
        const b = document.createElement("button");
        b.textContent = `World ${id}`;
        b.style.marginRight = "5px"; 
        b.onclick = () => {
          if (currentWorld !== id) { 
            currentWorld = id;
            if (keyInput) {
               rebuildWorld(keyInput.value);
            }
          }
        };
        bar.appendChild(b);
      });

      bar.append("  World key: ");
      const keyInput = document.createElement("input"); 
      bar.appendChild(keyInput);
      keyInput.type = "text"; 
      keyInput.value = "xyzzy"; 
      keyInput.style.width = "80px"; 
      keyInput.oninput = () => {
        rebuildWorld(keyInput.value);
      };

      const _origRebuild = window.rebuildWorld;
      window.rebuildWorld = function (key) {
        _origRebuild(key); 

      };

      rebuildWorld(keyInput.value);

    }); 
  }); 

