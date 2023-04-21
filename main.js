import * as func from './funcs.js';

//Elements
const canvas = document.getElementById('canvas');
const penSizeIndicator = document.getElementById('pen-size-indicator');
const promptTextarea = document.getElementById('prompt');
const submitBtn = document.getElementById('submit-btn');
const imgOutput = document.getElementById('img-output');

const lineWidthMin = 1;
const lineWidthMax = 50;
const url = 'http://127.0.0.1:7860/controlnet/txt2img';

// Canvas context
const ctx = canvas.getContext('2d');
ctx.strokeStyle = 'white';
ctx.fillStyle = 'black';
ctx.lineCap = 'round';
ctx.lineWidth = 4;
clearCanvas()

// Drawing vars
let isDrawing = false;
let strokes = [];

canvas.addEventListener('mousedown', startMouse);
canvas.addEventListener('mousemove', drawMouse);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('touchstart', startTouch);
canvas.addEventListener('touchmove', drawTouch);
canvas.addEventListener('touchend', stopDrawing);

submitBtn.addEventListener('click', callSDAPI);

promptTextarea.addEventListener('input', rescalePrompt);

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return; // Ignore the keydown event
  }
  switch (e.key) {
    case '+':
      ctx.lineWidth = Math.min(ctx.lineWidth+1, lineWidthMax);
      func.temporaryContent(penSizeIndicator,ctx.lineWidth);
      break;
    case '-':
      ctx.lineWidth = Math.max(ctx.lineWidth-1, lineWidthMin);
      func.temporaryContent(penSizeIndicator,ctx.lineWidth);
      break;
    case 'z':
      undo();
      break;
    case 'c':
      clearCanvas();
      strokes = [];
      break;
  }
});

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
    size: ctx.lineWidth
  };
  strokes.push(stroke);
  isDrawing = true;
  drawPath(x,y);
}

function drawPath(x,y) {
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
  callSDAPI();
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

function undo() {
  strokes.pop();
  clearCanvas();
  redraw(strokes);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function redraw(strokes) {
  strokes.forEach((stroke) => {
    ctx.lineWidth = stroke.size
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
			ctx.moveTo(point.x, point.y);
    });
    ctx.stroke();
  });
}

function callSDAPI() {
  fetch('payload.json')
    .then(response => response.json())
    .then(payload => {
      const dataUrl = canvas.toDataURL();
      const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
      payload.controlnet_units[0].input_image = base64Data;

      payload.prompt = promptTextarea.value;

      const data = JSON.stringify(payload);

      console.log("Sending Scribble")
      SDPost(url, data);
    })
    .catch(error => console.error(error));
}

function SDPost(url, data) {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
			console.log(xhr.responseText);
		}
	};

	xhr.onload = function () {
		if (xhr.readyState === 4 && xhr.status === 200) {
			const base64Response = JSON.parse(xhr.responseText).images[0];
			console.log(base64Response);
			imgOutput.src = 'data:image/jpeg;base64,' + base64Response;
		}
	};

	xhr.send(data);
}