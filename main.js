import * as funcs from './funcs.js';
import * as cls from './classes.js';

///Elements
const canvas = document.getElementById('canvas');
const penSizeIndicator = document.getElementById('pen-size-indicator');
const promptTextarea = document.getElementById('prompt');
const submitBtn = document.getElementById('submit-btn');
const queueIndicator = document.getElementById('queue-indicator');
const imgOutput = document.getElementById('img-output');
const weightInput = new cls.SteppedNumberInput('weight');


// SD Constants
const url = 'http://127.0.0.1:7860/sdapi/v1/txt2img';
let haveReceived = false;

/// Canvas context
const ctx = canvas.getContext('2d');
canvas.style.cursor = "none";
ctx.strokeStyle = 'white';
ctx.fillStyle = 'black';
ctx.lineCap = 'round';
ctx.lineWidth = 4;
clearCanvas()

/// Pen Cursor
const penCursor = document.createElement('div');
penCursor.classList.add('cursor');
document.body.appendChild(penCursor);
setPenCursorSize(ctx.lineWidth)

/// Drawing vars
const lineWidthMin = 1;
const lineWidthMax = 200;
let isDrawing = false;
let strokes = [];
let queueLen = 0;
let isErasing = false;

/// Events
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


window.addEventListener('resize', updatePlaceholder);

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

function updatePlaceholder() {
  if (haveReceived) {
    window.removeEventListener('resize', updatePlaceholder);
    return;
  }
  if (imgOutput.offsetLeft < 500) {
    imgOutput.src = "/images/placeholder-below.png";
  } else {
    imgOutput.src = "/images/placeholder.png";
  }
}

/// Generic drawing
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

/// Mouse drawing
function startMouse(e) {
  startDrawing(e.offsetX,e.offsetY)
}
function drawMouse(e) {
  drawPath(e.offsetX,e.offsetY)
}

/// Touch support
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

/// Drawing controls
function stepPenSize(v) {
  const temp = Math.min(ctx.lineWidth + v, lineWidthMax);
  ctx.lineWidth = Math.max(temp, lineWidthMin);
  setPenCursorSize(ctx.lineWidth);
  funcs.tempTextContent(penSizeIndicator, `${Math.round(ctx.lineWidth)}px`);
}
function setPenCursorSize(size) {
  penCursor.style.width = size + 'px';
  penCursor.style.height = size + 'px';
}
function scrollSize(e) {
  e.preventDefault();
  stepPenSize(-e.deltaY/100);
}
function showPen() {
  penCursor.style.visibility = "visible";
}
function hidePen() {
  isDrawing = false;
  penCursor.style.visibility = "hidden";
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

/// Prompt and params
function rescalePrompt() {
  promptTextarea.style.height = 'auto';
  promptTextarea.style.height = promptTextarea.scrollHeight + 'px';
}
function getModel() {
  return document.getElementById("cn-model").value
}
function getControlMode() {
  return document.getElementById("control-mode").value
}

/// SD API
function sendToSD() {
  fetch('payload.json')
    .then(response => response.json())
    .then(payload => {
      console.log("Getting parameters")
      payload.prompt = promptTextarea.value;

      const ControlNetArgs = payload.alwayson_scripts.controlnet.args[0];
      ControlNetArgs.weight = weightInput.getValue()
      ControlNetArgs.model = getModel()
      ControlNetArgs.control_mode = getControlMode()

      console.log(payload)

      const dataUrl = canvas.toDataURL();
      const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
      ControlNetArgs.input_image = base64Data;

      const data = JSON.stringify(payload);
      SDPost(url, data);
    })
    .catch(error => {
      console.error(error);
    });
}

async function SDPost(url, data) {
  queueLen += 1;
  updateQueueIndicator();
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
      haveReceived = true;
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

function updateQueueIndicator() {
  queueIndicator.style.color = "";
  if (queueLen > 0) {
    queueIndicator.textContent = `${queueLen} Pending...`;
  } else {
    queueIndicator.textContent = "";
  }
}