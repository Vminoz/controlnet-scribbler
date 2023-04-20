import * as func from './funcs.js';

//Elements
const canvas = document.getElementById('canvas');
const penSizeIndicator = document.getElementById('pen-size-indicator');
const promptTextarea = document.getElementById('prompt');

const lineWidthMin = 1;
const lineWidthMax = 50;

// Canvas context
const ctx = canvas.getContext('2d');

ctx.strokeStyle = 'white';
ctx.lineCap = 'round';
ctx.lineWidth = 4;

// Set the initial drawing state
let isDrawing = false;
let strokes = [];

// Event listener for keydown events on the document
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return; // Ignore the keydown event
  }
  switch (e.key) {
    case '+':
      ctx.lineWidth = Math.min(ctx.lineWidth+1, lineWidthMax)
      func.temporaryContent(penSizeIndicator,ctx.lineWidth);
      break;
    case '-':
      ctx.lineWidth = Math.max(ctx.lineWidth-1, lineWidthMin)
      func.temporaryContent(penSizeIndicator,ctx.lineWidth);
      break;
    case 'z':
      undo() //TODO: Make z undo last stroke.
      break;
    case 'c':
      clearCanvas()
      break;
  }
});


// Event listener for mouse down
canvas.addEventListener('mousedown', function(e) {
  let stroke = {
    points: [ {x: e.offsetX, y: e.offsetY} ],
    size: ctx.lineWidth
  };
  strokes.push(stroke);
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  isDrawing = true;
});

// Event listener for mouse move
canvas.addEventListener('mousemove', function(e) {
  if (isDrawing) {
    drawPath(e);
  }
});

// Event listener for mouse up
canvas.addEventListener('mouseup', function(e) {
  drawPath(e)
  isDrawing = false;
});

promptTextarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

function drawPath(e) {
  let point = { x: e.offsetX, y: e.offsetY };
  strokes[strokes.length - 1].points.push(point);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
}

function undo() {
  strokes.pop();
  clearCanvas();
  draw(strokes);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw(strokes) {
  strokes.forEach((stroke) => {
    ctx.lineWidth = stroke.size
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
  });
}