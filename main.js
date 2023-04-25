import * as funcs from './funcs.js';

//Elements
const canvas = document.getElementById('canvas');
const penSizeIndicator = document.getElementById('pen-size-indicator');
const promptTextarea = document.getElementById('prompt');
const submitBtn = document.getElementById('submit-btn');
const queueIndicator = document.getElementById('queue-indicator');
const imgOutput = document.getElementById('img-output');

const lineWidthMin = 1;
const lineWidthMax = 50;
const url = 'http://127.0.0.1:7860/sdapi/v1/txt2img';

// Canvas context
const ctx = canvas.getContext('2d');
canvas.style.cursor = "none";
ctx.strokeStyle = 'white';
ctx.fillStyle = 'black';
ctx.lineCap = 'round';
ctx.lineWidth = 4;
clearCanvas()
const penCursor = document.createElement('div');
penCursor.classList.add('cursor');
document.body.appendChild(penCursor);
setCursorSize(ctx.lineWidth)

// Drawing vars
let isDrawing = false;
let strokes = [];
let queueLen = 0;
let isErasing = false;

canvas.addEventListener('mousedown', startMouse);
canvas.addEventListener('mousemove', drawMouse);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('touchstart', startTouch);
canvas.addEventListener('touchmove', drawTouch);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('wheel', scrollSize);
canvas.addEventListener('mouseenter', showPen);
canvas.addEventListener('mouseleave', hidePen);

submitBtn.addEventListener('click', sendToSD);

promptTextarea.addEventListener('input', rescalePrompt);

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return; // Ignore the keydown event
  }
  switch (e.key) {
    case '+':
      stepPenSize(1);
      break;
    case '-':
      stepPenSize(-1);
      break;
    case 'z':
      undo();
      break;
    case 'c':
      if (confirm("Your masterpiece will be irreversibly destroyed")) {
        clearCanvas();
        strokes = [];
      }
      break;
    case 'e':
      toggleEraser()
      break;
  }
});

function stepPenSize(v) {
  const temp = Math.min(ctx.lineWidth + v, lineWidthMax);
  ctx.lineWidth = Math.max(temp, lineWidthMin);
  setCursorSize(ctx.lineWidth);
  funcs.tempTextContent(penSizeIndicator, `${Math.round(ctx.lineWidth)}px`);
}

function setCursorSize(size) {
  penCursor.style.width = size + 'px';
  penCursor.style.height = size + 'px';
}
function showPen() {
  penCursor.style.visibility = "visible";
}
function hidePen() {
  isDrawing = false;
  penCursor.style.visibility = "hidden";
}

function rescalePrompt() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
}

function startMouse(e) {
  startDrawing(e.offsetX,e.offsetY)
}
function drawMouse(e) {
  drawPath(e.offsetX,e.offsetY)
}

function startDrawing(x,y) {
  let stroke = {
    points: [{ x: x, y: y }],
    size: ctx.lineWidth,
    style: ctx.strokeStyle
  };
  strokes.push(stroke);
  isDrawing = true;
  drawPath(x,y);
}

function drawPath(x,y) {
  penCursor.style.left = x + canvas.offsetLeft - ctx.lineWidth / 2 + 'px';
  penCursor.style.top = y + canvas.offsetTop - ctx.lineWidth / 2 + 'px';
  if (!isDrawing) {
    return;
  }
	let stroke = strokes[strokes.length - 1];
	let start = stroke.points[stroke.points.length - 1];
  let end = { x: x, y: y };
  stroke.points.push(end);
	ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function stopDrawing() {
  isDrawing = false;
  sendToSD();
}

function startTouch(e) {
  console.log("Touch Start")
  const {x, y} = touchPos(e)
  startDrawing(x, y);
}
function drawTouch(e) {
  const {x, y} = touchPos(e)
  drawPath(x, y)
}
function touchPos(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const x = touch.clientX - canvas.offsetLeft;
  const y = touch.clientY - canvas.offsetTop;
  return {x,y};
}

function scrollSize(e) {
  e.preventDefault();
  stepPenSize(-e.deltaY/100);
}

function undo() {
  strokes.pop();
  clearCanvas();
  redraw(strokes);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function toggleEraser() {
  isErasing = !isErasing;
  if (isErasing) {
    ctx.strokeStyle = 'black';
    funcs.tempTextContent(penSizeIndicator,"Eraser");
  } else {
    ctx.strokeStyle = 'white';
    funcs.tempTextContent(penSizeIndicator,"Pen");
  }
  console.log("toggled erasing:", isErasing)
}

function redraw(strokes) {
  strokes.forEach((stroke) => {
    ctx.lineWidth = stroke.size
    ctx.strokeStyle = stroke.style
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
			ctx.moveTo(point.x, point.y);
    });
    ctx.stroke();
  });
}

function sendToSD() {
  fetch('payload.json')
    .then(response => response.json())
    .then(payload => {
      payload.prompt = promptTextarea.value;
      console.log(JSON.stringify(payload))

      const dataUrl = canvas.toDataURL();
      const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
      payload.alwayson_scripts.controlnet.args[0].input_image = base64Data;

      const data = JSON.stringify(payload);

      SDPost(url, data);
    })
    .catch(error => {
      console.error(error);
    });
}

function updateQueueIndicator() {
  queueIndicator.style.color = "";
  if (queueLen > 0) {
    queueIndicator.textContent = `${queueLen} Pending...`;
  } else {
    queueIndicator.textContent = "";
  }
}

async function SDPost(url, data) {
  updateQueueIndicator();
  queueLen += 1;
  try {
    console.log("Sending Scribble");
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: data
    });

    if (response.ok) {
      const base64Response = (await response.json()).images[0];
      console.log(base64Response);
      imgOutput.src = 'data:image/jpeg;base64,' + base64Response;
      queueLen -= 1;
      updateQueueIndicator();
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (error) {
    console.error('An error occurred during the request!', error);
    queueLen -= 1;
    updateQueueIndicator();
    queueIndicator.textContent += " Latest failed!";
    queueIndicator.style.color = "#ff0000";
  }
}