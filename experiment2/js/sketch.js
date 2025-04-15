// sketch.js - purpose and description here
// Author: Junyao Lin
// Date: 4/14/2025

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User-servicable parts
// In a longer project I like to put these in a separate file
const VALUE1 = 1;
const VALUE2 = 2;

// Globals
let myInstance;
let canvasContainer;
var centerHorz, centerVert;

class MyClass {
    constructor(param1, param2) {
        this.property1 = param1;
        this.property2 = param2;
    }

    myMethod() {
        // code to run when method is called
    }
}

function resizeScreen() {
  centerHorz = canvasContainer.width() / 2; // Adjusted for drawing logic
  centerVert = canvasContainer.height() / 2; // Adjusted for drawing logic
  console.log("Resizing...");
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  // redrawCanvas(); // Redraw everything based on new size
}

let seed = 123;

const colorSky        = "#013220"; 
// const colorCloud      = "#FFFFFF"; 
const colorMountain   = "#BEC0C2"; 
const colorSnow       = "#F8F8F8"; 
const colorTree       = "#206546"; 
const colorRoad       = "#444648"; 
const colorYellowLine = "#FFD300"; 
const colorWhiteDash  = "#FFFFFF"; 

let baseMountainPoints = [];
let snowMountainPoints = [];

// setup() function is called once when the program starts
function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  // resize canvas is the page is resized

  // create an instance of the class
  // myInstance = new MyClass("VALUE1", "VALUE2");

  $(window).resize(function() {
    resizeScreen();
  });
  resizeScreen();
  
  noStroke();
  createButton("reimagine")
    .parent("canvas-container")
    .style("position", "absolute")
    .style("top", "40px")
    .style("right", "110px")
    .mousePressed(() => {
      seed++;
      generateMountainPoints();
    });
  generateMountainPoints();
}

// draw() function is called repeatedly, it's the main animation loop
function draw() {

  randomSeed(seed);
  drawSky();             
  // drawClouds();          
  drawMountainBase();    
  drawMountainSnow();    
  drawTrees();           
  drawRoad();            
  drawYellowLines();     
  drawWhiteDashedLine(); 
}

// mousePressed() function is called once after every time a mouse button is pressed
function mousePressed() {
    // code to run when mouse is pressed
}

function generateMountainPoints() {
  baseMountainPoints = [];
  snowMountainPoints = [];
  let steps = 5;
  for (let i = 0; i <= steps; i++) {
    let x = map(i, 0, steps, 0, width);
    let y = random(140, 220);
    baseMountainPoints.push({ x, y });
  }
  for (let i = 0; i <= steps; i++) {
    let x = map(i, 0, steps, 0, width);
    let y = random(100, 160);
    snowMountainPoints.push({ x, y });
  }
}

function drawSky() {
  background(colorSky);
}

function drawMountainBase() {
  fill(colorMountain);
  beginShape();
  vertex(0, 0);
  let tm = millis() / 1500.0;
  for (let i = 0; i < baseMountainPoints.length; i++) {
    let pt = baseMountainPoints[i];
    let wiggle = 10 * sin(tm + i);
    vertex(pt.x, pt.y + wiggle);
  }
  vertex(width, 0);
  endShape(CLOSE);
}

function drawMountainSnow() {
  fill(colorSnow);
  beginShape();
  vertex(0, 0);
  let tm = millis() / 1500.0;
  for (let i = 0; i < snowMountainPoints.length; i++) {
    let pt = snowMountainPoints[i];
    let wiggle = 10 * sin(tm + i * 0.5);
    vertex(pt.x, pt.y + wiggle);
  }
  vertex(width, 0);
  endShape(CLOSE);
}

function drawTrees() {
  fill(colorTree);
  let treeTime = millis() / 3000.0;
  let numTrees = int(random(5, 10));
  for (let i = 0; i < numTrees; i++) {
    let tx = random(width);
    let ty = random(220, 320);
    let ts = random(15, 30);
    let offsetX = 10 * sin(treeTime + i);
    let offsetY = 5 * sin(treeTime + i * 1.1);
    let finalX = tx + offsetX;
    let finalY = ty + offsetY;
    triangle(finalX, finalY - ts, finalX - ts / 2, finalY, finalX + ts / 2, finalY);
    triangle(finalX, finalY - ts * 1.5, finalX - ts / 3, finalY - ts * 0.8, finalX + ts / 3, finalY - ts * 0.8);
  }
}

function drawRoad() {
  fill(colorRoad);
  beginShape();
  vertex(0, height);
  vertex(width, height);
  vertex(width, 250);
  vertex(0, 300);
  endShape(CLOSE);
}

function drawYellowLines() {
  fill(colorYellowLine);
  beginShape();
  vertex(10, height);
  vertex(20, height);
  vertex(width - 5, 250);
  vertex(width - 15, 250);
  endShape(CLOSE);
  beginShape();
  vertex(25, height);
  vertex(35, height);
  vertex(width, 250);
  vertex(width - 10, 250);
  endShape(CLOSE);
}

function drawWhiteDashedLine() {
  fill(colorWhiteDash);
  const dashCount = 10;
  const dashLenFrac = 0.05;
  const gapFrac = 0.10;
  const thickness = 5;
  let xB1 = 300, yB1 = height;
  let xB2 = 20, yB2 = height;
  let xT1 = width - 5, yT1 = 250;
  let xT2 = width - 15, yT2 = 250;
  let [bxL, byL] = midpoint(xB1, yB1, xB2, yB2);
  let [txL, tyL] = midpoint(xT1, yT1, xT2, yT2);
  drawDashLineWithOffset(bxL, byL, txL, tyL, dashCount, dashLenFrac, gapFrac, thickness, +32);
  let rxB1 = -300, ryB1 = height;
  let rxB2 = 35, ryB2 = height;
  let rxT1 = width, ryT1 = 250;
  let rxT2 = width - 10, ryT2 = 250;
  let [bxR, byR] = midpoint(rxB1, ryB1, rxB2, ryB2);
  let [txR, tyR] = midpoint(rxT1, ryT1, rxT2, ryT2);
  drawDashLineWithOffset(bxR, byR, txR, tyR, dashCount, dashLenFrac, gapFrac, thickness, -8);
}

function drawDashLineWithOffset(x1, y1, x2, y2, dashCount, dashLenFrac, gapFrac, thick, offset) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let len = sqrt(dx * dx + dy * dy);
  if (len < 0.0001) return;
  let nx = -dy / len;
  let ny = dx / len;
  x1 += nx * offset;
  y1 += ny * offset;
  x2 += nx * offset;
  y2 += ny * offset;
  let segSize = dashLenFrac + gapFrac;
  for (let i = 0; i < dashCount; i++) {
    let st = i * segSize;
    let ed = st + dashLenFrac;
    if (ed > 1) break;
    let sx = lerp(x1, x2, st);
    let sy = lerp(y1, y2, st);
    let ex = lerp(x1, x2, ed);
    let ey = lerp(y1, y2, ed);
    let ddx = ex - sx;
    let ddy = ey - sy;
    let segL = sqrt(ddx * ddx + ddy * ddy);
    if (segL < 0.0001) continue;
    let nx2 = -ddy / segL;
    let ny2 = ddx / segL;
    let x1r = sx + nx2 * (thick / 2);
    let y1r = sy + ny2 * (thick / 2);
    let x2r = ex + nx2 * (thick / 2);
    let y2r = ey + ny2 * (thick / 2);
    let x3r = ex - nx2 * (thick / 2);
    let y3r = ey - ny2 * (thick / 2);
    let x4r = sx - nx2 * (thick / 2);
    let y4r = sy - ny2 * (thick / 2);
    beginShape();
    vertex(x1r, y1r);
    vertex(x2r, y2r);
    vertex(x3r, y3r);
    vertex(x4r, y4r);
    endShape(CLOSE);
  }
}

function midpoint(ax, ay, bx, by) {
  return [(ax + bx) * 0.5, (ay + by) * 0.5];
}
