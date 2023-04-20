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
	if (
		e.target.tagName === 'INPUT' ||
		e.target.tagName === 'TEXTAREA'
	) {
		return; // Ignore the keydown event
	}
	switch (e.key) {
		case '+':
			ctx.lineWidth = func.increment(penSizeInput);
			break;
		case '-':
			ctx.lineWidth = func.decrement(penSizeInput);
			break;
		case 'z':
			func.toggleZoom();
			break;
		default:
			break;
	}
});

// Event listener for mouse down
canvas.addEventListener('mousedown', function (e) {
	isDrawing = true;
	lastX = e.offsetX;
	lastY = e.offsetY;
});

// Event listener for mouse move
canvas.addEventListener('mousemove', function (e) {
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
canvas.addEventListener('mouseup', function () {
	isDrawing = false;
});

promptTextarea.addEventListener('input', function () {
	this.style.height = 'auto';
	this.style.height = this.scrollHeight + 'px';
});

const submitBtn = document.getElementById('submitBtn');
const imgOutput = document.getElementById('img-output');

submitBtn.addEventListener('click', function () {
	// taking prompt from textarea of id promptbox
	const prompttext = promptTextarea.value;
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
		'prompt': prompttext,
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
