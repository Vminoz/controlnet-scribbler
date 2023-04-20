import * as func from './funcs.js';

//Elements
const canvas = document.getElementById('canvas');
const penSizeIndicator = document.getElementById('pen-size-indicator');
const promptTextarea = document.getElementById('prompt');
const submitBtn = document.getElementById('submit-btn');
const imgOutput = document.getElementById('img-output');

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

// Event listener for mouse down
canvas.addEventListener('mousedown', function(e) {
  let stroke = {
    points: [ {x: e.offsetX, y: e.offsetY} ],
    size: ctx.lineWidth
  };
  strokes.push(stroke);
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

promptTextarea.addEventListener('input', function () {
	this.style.height = 'auto';
	this.style.height = this.scrollHeight + 'px';
});

function drawPath(e) {
	let stroke = strokes[strokes.length - 1];
	let start = stroke.points[stroke.points.length - 1];
  let end = { x: e.offsetX, y: e.offsetY };
  stroke.points.push(end);
	ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
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
			ctx.moveTo(point.x, point.y);
    });
    ctx.stroke();
  });
}

submitBtn.addEventListener('click', function () {
	// taking prompt from textarea of id promptbox
	const url = 'http://localhost:7860/sdapi/v1/txt2img';
	fetch('payload.json')
  .then(response => response.json())
  .then(payload => {
    payload.prompt = promptTextarea.value;
    const data = JSON.stringify(payload);
		console.log(data)
    SDPost(url, data);
  })
  .catch(error => console.error(error));
});

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
			const jsonResponse = JSON.parse(xhr.responseText);
			const base64Response = jsonResponse.images;
			const image = new Image();
			image.src = 'data:image/jpeg;base64,' + base64Response;
			imgOutput.src = 'data:image/jpeg;base64,' + base64Response; //document.body.appendChild(image); // display the image in the HTML
		}
	};

	xhr.send(data);
}