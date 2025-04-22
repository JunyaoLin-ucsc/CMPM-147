// sketch.js - Port the code of the overworld and dungeon generators from glitch.com and make them display in the topmost window
// Author: Junyao Lin
// Date: 4/20/2025

// Here is how you might set up an OOP p5.js project
// Note that p5.js looks for a file called sketch.js

// Constants - User‑servicable parts
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
  const containerRect = canvasContainer[0].getBoundingClientRect();
  const containerWidth  = containerRect.width;
  const containerHeight = containerRect.height;

  centerHorz = containerWidth  / 2;
  centerVert = containerHeight / 2;
  console.log("Resizing...");
  resizeCanvas(containerWidth, containerHeight);
  // redrawCanvas(); // Redraw everything based on new size
}

function setup() {
  // place our canvas, making it fit our container
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");
  // resize canvas if the page is resized
  $(window).resize(resizeScreen);
  resizeScreen();

  // create an instance of the class
  myInstance = new MyClass("VALUE1", "VALUE2");
}

function draw() {
  background(220);
  // call a method on the instance
  myInstance.myMethod();

  // Set up rotation for the rectangle
  push(); // Save the current drawing context
  translate(centerHorz, centerVert); // Move the origin to the rectangle's center
  rotate(frameCount / 100.0); // Rotate by frameCount to animate the rotation
  fill(234, 31, 81);
  noStroke();
  rect(-125, -125, 250, 250); // Draw the rectangle centered on the new origin
  pop(); // Restore the original drawing context

  // The text is not affected by the translate and rotate
  fill(255);
  textStyle(BOLD);
  textSize(140);
  text("p5*", centerHorz - 105, centerVert + 40);
}

// mousePressed() function is called once after every time a mouse button is pressed
function mousePressed() {
    // code to run when mouse is pressed
}

const overworldSketch = (p) => {
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
    seed++;
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
    currentGrid = stringToGrid(p.select("#asciiBox-overworld").value());
  }

  function gridToString(grid) {
    return grid.map(r => r.join("")).join("\n");
  }

  function stringToGrid(str) {
    return str.split("\n").map(line => line.split(""));
  }

  p.setup = function() {
    const asciiBox = p.select("#asciiBox-overworld");
    numCols = asciiBox.attribute("rows") | 0;
    numRows = asciiBox.attribute("cols") | 0;

    p.createCanvas(16 * numCols, 16 * numRows)
     .parent("canvasContainer-overworld");
    p.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

    p.select("#reseed-overworld").mousePressed(reseed);
    asciiBox.input(reparseGrid);

    reseed();
  };

  p.draw = function() {
    p.randomSeed(seed);
    drawGrid(currentGrid);
  };

  function placeTile(i, j, ti, tj) {
    p.image(tilesetImage, 16*j, 16*i, 16, 16, 8*ti, 8*tj, 8, 8);
  }

  const lookupOW = [
    [1,1],[1,0],[0,1],[0,0],
    [2,1],[2,0],[1,1],[1,0],
    [1,2],[1,1],[0,2],[0,1],
    [2,2],[2,1],[1,2],[1,1],
  ];

  function gridCheck(grid,i,j,t){
    return i>=0 && i<grid.length && j>=0 && j<grid[0].length && grid[i][j]===t;
  }
  function gridCode(grid,i,j,t){
    return (gridCheck(grid,i-1,j,t)<<0)
         + (gridCheck(grid,i,j-1,t)<<1)
         + (gridCheck(grid,i,j+1,t)<<2)
         + (gridCheck(grid,i+1,j,t)<<3);
  }
  function drawContext(grid,i,j,target,baseTi,baseTj,invert=false){
    let code = gridCode(grid,i,j,target);
    if(invert) code=(~code)&0xf;
    let [dx,dy] = lookupOW[code];
    placeTile(i,j,baseTi+dx,baseTj+dy);
  }

  function generateGrid(cols,rows){
    const xo=p.random(0,1e3), yo=p.random(0,1e3);
    let g=Array(rows).fill().map(()=>Array(cols).fill(2));
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      let o = p.noise((x+xo)/40,(y+yo)/40);
      g[y][x] = Math.abs(o-0.5)<.05 ? 0
               : p.noise((x+xo)/20,(y+yo)/20) < .5 ? 1 : 2;
    }
    const d=[[-1,0],[1,0],[0,-1],[0,1]];
    let c = g.map(r=>r.slice());
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      let cnt = [0,0,0];
      for(let [dy,dx] of d){
        let ny=y+dy, nx=x+dx;
        if(ny>=0&&ny<rows&&nx>=0&&nx<cols) cnt[g[ny][nx]]++;
      }
      cnt[g[y][x]]++;
      c[y][x] = cnt.indexOf(Math.max(cnt[0],cnt[1],cnt[2]));
    }
    return c.map(r=>r.map(v=> v===0?"w": v===1?":": "."));
  }

  function drawGrid(grid){
    p.background(0);
    let t = p.millis()/1e3, g=8;
    for(let i=0;i<grid.length;i++){
      for(let j=0;j<grid[i].length;j++){
        let c = grid[i][j],
            b = Math.floor(4*Math.pow(p.noise(t/6,i/4,j/4+t),2));
        placeTile(i,j,b,14);
        if(c===":"){
          placeTile(i,j,Math.floor(Math.pow(p.random(),g)*4),3);
        } else {
          drawContext(grid,i,j,"w",9,3,true);
        }
        if(c==="."){
          let s = p.map(Math.sin(t+(i+j)*.12),-1,1,.7,1),
              gi= p.noise(t/6,i+50,j/4+t+50)*s;
          placeTile(i,j,Math.floor(Math.pow(gi,2)*4),0);
        } else {
          drawContext(grid,i,j,".",4,0);
        }
      }
    }
    const deco = [];
    for(let ti=16; ti<=21; ti++) for(let tj=0; tj<=5; tj++) deco.push({ti,tj});
    for(let ti=24; ti<=27; ti++) deco.push({ti,tj:0},{ti,tj:1});
    for(let i=0;i<grid.length;i++)for(let j=0;j<grid[i].length;j++){
      if(grid[i][j]==="."&&p.random()<0.07){
        let d=p.random(deco);
        placeTile(i,j,d.ti,d.tj);
      }
    }
  }
};

const dungeonSketch = (p) => {
  let seed = 0, tilesetImage, currentGrid = [], numRows, numCols;
  p.preload = ()=> {
    tilesetImage = p.loadImage(
      "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
    );
  };
  function reseed() {
    seed++;
    p.randomSeed(seed);
    p.noiseSeed(seed);
    p.select("#seedReport-dungeon").html("seed "+seed);
    regenerateGrid();
  }
  function regenerateGrid() {
    p.select("#asciiBox-dungeon").value(
      gridToString(generateGrid(numCols,numRows))
    );
    reparseGrid();
  }
  function reparseGrid() {
    currentGrid = stringToGrid(p.select("#asciiBox-dungeon").value());
  }
  function gridToString(grid){
    return grid.map(r=>r.join("")).join("\n");
  }
  function stringToGrid(str){
    return str.split("\n").map(line=>line.split(""));
  }
  p.setup = ()=>{
    const asciiBox = p.select("#asciiBox-dungeon");
    numCols = asciiBox.attribute("rows")|0;
    numRows = asciiBox.attribute("cols")|0;
    p.createCanvas(16*numCols,16*numRows)
     .parent("canvasContainer-dungeon");
    p.select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
    p.select("#reseed-dungeon").mousePressed(reseed);
    asciiBox.input(reparseGrid);
    reseed();
  };
  p.draw = ()=> {
    p.randomSeed(seed);
    drawGrid(currentGrid);
  };
  function placeTile(i,j,ti,tj){
    p.image(tilesetImage,16*j,16*i,16,16,8*ti,8*tj,8,8);
  }
  const lookupDG = [
    [0,23],[1,23],[2,23],[3,23],
    [4,23],[5,23],[6,23],[7,23],
    [1,24],[2,24],[3,24],[4,24],
    [5,24],[6,24],[7,24],[8,24],
  ];
  function gridCheckD(g,i,j,t){
    return i>=0&&i<g.length&&j>=0&&j<g[0].length&&g[i][j]===t;
  }
  function gridCodeD(g,i,j,t){
    const n=gridCheckD(g,i-1,j,t)?1:0;
    const s=gridCheckD(g,i+1,j,t)?1:0;
    const e=gridCheckD(g,i,j+1,t)?1:0;
    const w=gridCheckD(g,i,j-1,t)?1:0;
    return (n<<0)|(s<<1)|(e<<2)|(w<<3);
  }
  function drawWall(g,i,j){
    const code=gridCodeD(g,i,j,".");
    if(code>0){
      const [ti,tj]=lookupDG[code];
      placeTile(i,j,ti,tj);
    }
  }
  function carveRoom(g,{x,y,w,h}){
    for(let yy=y;yy<y+h;yy++)
    for(let xx=x;xx<x+w;xx++)
      g[yy][xx]=".";
  }
  function carveHCorridor(g,x1,x2,y){
    for(let xx=Math.min(x1,x2);xx<=Math.max(x1,x2);xx++)
      g[y][xx]=".";
  }
  function carveVCorridor(g,y1,y2,x){
    for(let yy=Math.min(y1,y2);yy<=Math.max(y1,y2);yy++)
      g[yy][x]=".";
  }
  function generateGrid(cols,rows){
    const grid=Array.from({length:rows},()=>Array(cols).fill("_"));
    const rooms=[]; const maxRooms=6,minSize=4,maxSize=10;
    for(let i=0;i<maxRooms;i++){
      const w=floor(p.random(minSize,maxSize)),
            h=floor(p.random(minSize,maxSize)),
            x=floor(p.random(1,cols-w-1)),
            y=floor(p.random(1,rows-h-1));
      const room={x,y,w,h};
      let ok=true;
      for(const r of rooms){
        if(x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y){ok=false;break;}
      }
      if(!ok) continue;
      carveRoom(grid,room);
      rooms.push(room);
    }
    for(let i=1;i<rooms.length;i++){
      const a=rooms[i-1],b=rooms[i],
            ax=a.x+floor(a.w/2),ay=a.y+floor(a.h/2),
            bx=b.x+floor(b.w/2),by=b.y+floor(b.h/2);
      carveHCorridor(grid,ax,bx,ay);
      carveVCorridor(grid,ay,by,bx);
    }
    return grid;
  }
  function drawGrid(grid){
    p.background(0);
    const t=p.millis()/1000;
    for(let i=0;i<grid.length;i++){
      for(let j=0;j<grid[i].length;j++){
        if(grid[i][j]==="."){
          placeTile(i,j,floor(p.random(4)),15);
        } else {
          drawWall(grid,i,j);
        }
        if(grid[i][j]==="."){
          p.noStroke();
          const glow=p.map(p.sin(t*2+i+j),-1,1,10,50);
          p.fill(255,255,255,glow);
          p.rect(j*16,i*16,16,16);
        }
      }
    }
  }
};

new p5(overworldSketch);
new p5(dungeonSketch);
