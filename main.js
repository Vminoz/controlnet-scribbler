import * as func from './funcs.js';

//Elements
const canvas = document.getElementById('canvas');
const penSizeIndicator = document.getElementById('pen-size-indicator');
const promptTextarea = document.getElementById('prompt');
const submitBtn = document.getElementById('submitBtn');
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
      undo(); //TODO: Make z undo last stroke.
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

promptTextarea.addEventListener('input', function () {
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


submitBtn.addEventListener('click', function () {
	// taking prompt from textarea of id promptbox
	const promptText = promptTextarea.value;
	const xhr = new XMLHttpRequest();
	const url = 'http://localhost:7860/sdapi/v1/txt2img';
	const data = JSON.stringify({
		'enable_hr': false,
		'denoising_strength': 0,
		'firstphase_width': 0,
		'firstphase_height': 0,
		'hr_scale': 2,
		'hr_upscaler': 'string',
		'hr_second_pass_steps': 0,
		'hr_resize_x': 0,
		'hr_resize_y': 0,
		'prompt': promptText,
		'styles': ['string'],
		'seed': -1,
		'subseed': -1,
		'subseed_strength': 0,
		'seed_resize_from_h': -1,
		'seed_resize_from_w': -1,
		'sampler_name': 'Euler',
		'batch_size': 1,
		'n_iter': 1,
		'steps': 5,
		'cfg_scale': 7,
		'width': 512,
		'height': 512,
		'restore_faces': false,
		'tiling': false,
		'do_not_save_samples': false,
		'do_not_save_grid': false,
		'negative_prompt': '',
		'eta': 0,
		's_churn': 0,
		's_tmax': 0,
		's_tmin': 0,
		's_noise': 1,
		'override_settings': {},
		'override_settings_restore_afterwards': true,
		'script_args': [],
		'sampler_index': 'Euler',
		'script_name': '',
		'send_images': true,
		'save_images': false,
		'alwayson_scripts': {},
	});

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
});

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