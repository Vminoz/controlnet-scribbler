import * as cls from './classes.js';

///Elements
const imgOutput = document.getElementById('img-output');
const canvas = new cls.DrawingCanvas('canvas');

const promptTextarea = document.getElementById('prompt');
const pauseButton = document.getElementById("play-pause");
const submitBtn = document.getElementById('submit-btn');
const queueIndicator = document.getElementById('queue-indicator');

const seedInput = new cls.SteppedNumberInput('seed');
const stepsInput = document.getElementById("samples");
const stepsLabel = document.getElementById("samples-value");
const cfgInput = document.getElementById("cfg");
const cfgLabel = document.getElementById("cfg-value");
const weightInput = new cls.SteppedNumberInput('weight');
const cnetModelInput = document.getElementById("cn-model");
const controlModeInput = document.getElementById("control-mode");

stepsLabel.textContent = stepsInput.value;
stepsInput.oninput = function() {
  stepsLabel.textContent = this.value;
}
cfgLabel.textContent = cfgInput.value;
cfgInput.oninput = function() {
  cfgLabel.textContent = this.value;
}

/// SD Vars
const url = 'http://127.0.0.1:7860/sdapi/v1/txt2img';
let haveReceived = false;
let isPaused = false;
let queueLen = 0;
updatePlaceholder();

submitBtn.addEventListener('click', sendToSD);
canvas.canvas.addEventListener('drawstop', sendToSD);
promptTextarea.addEventListener('input', rescalePrompt);
window.addEventListener('resize', updatePlaceholder);

pauseButton.textContent = "❚❚"
pauseButton.addEventListener("click", function() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseButton.textContent = "►";
    canvas.canvas.removeEventListener('drawstop', sendToSD);
  } else {
    pauseButton.textContent = "❚❚";
    canvas.canvas.addEventListener('drawstop', sendToSD);
    sendToSD();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return; // Ignore the keydown event
  }
  switch (e.key) {
    case '+':
      canvas.stepPenSize(1);
      break;
    case '-':
      canvas.stepPenSize(-1);
      break;
    case 'z':
      canvas.undo();
      break;
    case 'c':
      if (confirm("Your masterpiece will be irreversibly destroyed")) {
        canvas.clear();
        canvas.strokes = [];
      }
      break;
    case 'e':
      canvas.toggleEraser()
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

/// Prompt and params
function rescalePrompt() {
  promptTextarea.style.height = 'auto';
  promptTextarea.style.height = promptTextarea.scrollHeight + 'px';
}

/// SD API
function sendToSD() {
  fetch('payload.json')
    .then(response => response.json())
    .then(payload => {
      console.log("Getting parameters")
      payload.prompt = promptTextarea.value;
      payload.seed = seedInput.getValue();
      payload.steps = stepsInput.value;
      payload.cfg_scale = cfgInput.value;

      const ControlNetArgs = payload.alwayson_scripts.controlnet.args[0];
      ControlNetArgs.weight = weightInput.getValue();
      ControlNetArgs.model = cnetModelInput.value;
      ControlNetArgs.control_mode = controlModeInput.value;

      console.log(JSON.stringify(payload));

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
      // console.log(base64Response);
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