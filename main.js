import * as func from './funcs.js';

// Get the canvas element
const canvas = document.getElementById('canvas');
const penSizeInput = document.getElementById('pen-size');
const promptTextarea = document.getElementById('prompt');

// Set up the canvas context
const ctx = canvas.getContext('2d');

// Set the initial drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;

ctx.strokeStyle = 'white';
ctx.lineCap = 'round';
ctx.lineWidth = parseInt(penSizeInput.value);

penSizeInput.addEventListener('change', () => {
  ctx.lineWidth = parseInt(penSizeInput.value);
});

// Event listener for keydown events on the document
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return; // Ignore the keydown event
  }
  switch (e.key) {
    case '+':
      ctx.lineWidth = func.increment(penSizeInput)
      break;
    case '-':
      ctx.lineWidth = func.decrement(penSizeInput)
      break;
    case 'z':
      func.toggleZoom()
      break;
    default:
      break;
  }
});


// Event listener for mouse down
canvas.addEventListener('mousedown', function(e) {
  isDrawing = true;
  lastX = e.offsetX;
  lastY = e.offsetY;
});

// Event listener for mouse move
canvas.addEventListener('mousemove', function(e) {
  if (isDrawing) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    lastX = e.offsetX;
    lastY = e.offsetY;
  }
});

// Event listener for mouse up
canvas.addEventListener('mouseup', function() {
  isDrawing = false;
});

promptTextarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

