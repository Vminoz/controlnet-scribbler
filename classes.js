export class SteppedNumberInput {
  constructor(id) {
    this.elem = document.getElementById(id);
    this.min = parseFloat(this.elem.min);
    this.max = parseFloat(this.elem.max);
    this.step = parseFloat(this.elem.step);
    this.elem.addEventListener('input', this.limitValue.bind(this));
    this.elem.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.elem.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.scrollStepHandler = this.scrollStep.bind(this);
  }

  limitValue() {
    let value = parseFloat(this.elem.value);
    if (isNaN(value) || value < this.min) {
      value = this.min;
    } else {
      value = Math.min(value, this.max);
    }
    this.elem.value = Math.round(value*10)/10;
  }

  handleMouseEnter() {
    this.elem.addEventListener('wheel', this.scrollStepHandler);
  }

  handleMouseLeave() {
    this.elem.removeEventListener('wheel', this.scrollStepHandler);
  }

  scrollStep(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -this.step : this.step;
    this.elem.value = parseFloat(this.elem.value) + delta;
    this.limitValue();
  }

  getValue() {
    return parseFloat(this.elem.value);
  }
}

export class DrawingCanvas {
  constructor(id) {
    this.canvas = document.getElementById(id)
    this.info = document.createElement('div');
    this.penCursor = document.createElement('div');
    this.ctx = this.canvas.getContext('2d');

    this.strokes = [];
    this.lineWidthMin = 1;
    this.lineWidthMax = 200;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.isDrawing = false;
    this.isErasing = false;
    this.infoTimeout = null;

    this.initCanvas();
    this.initInfoLabel();
    this.initPenCursor();
    this.initEvents();

  }

  initCanvas() {
    this.canvas.style.cursor = "none";
    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'black';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 4;
    this.clear();
    this.toDataURL = this.canvas.toDataURL.bind(this.canvas);
  }
  initInfoLabel() {
    this.info.classList.add('orange-label');
    this.info.style.position = 'absolute';
    this.info.style.top = '20px';
    this.info.style.left = '20px';
    this.canvas.parentNode.insertBefore(this.info, this.canvas);
  }
  initPenCursor() {
    this.penCursor.classList.add('cursor')
    document.body.appendChild(this.penCursor)
    this.updatePenCursorSize();
  }
  initEvents() {
    this.canvas.addEventListener('mousedown', this.startMouse.bind(this));
    this.canvas.addEventListener('mousemove', this.drawMouse.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('touchstart', this.startTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.drawTouch.bind(this));
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    this.canvas.addEventListener('wheel', this.scrollSize.bind(this));
    this.canvas.addEventListener('mouseenter', this.showPen.bind(this));
    this.canvas.addEventListener('mouseleave', this.hidePen.bind(this));
  }

  infoShow(value) {
    this.info.textContent = value;
    this.info.style.opacity = 1;

    clearTimeout(this.infoTimeout);
    this.infoTimeout = setTimeout(() => {
      this.info.style.opacity = 0;
    }, 500);
  }

  /// Generic drawing
  startDrawing(x,y) {
    const stroke = {
      points: [{ x: x, y: y }],
      size: this.ctx.lineWidth,
      style: this.ctx.strokeStyle
    };
    this.strokes.push(stroke);
    this.isDrawing = true;
    this.drawPath(x,y);
  }
  drawPath(x, y) {
    this.lastMouseX = x;
    this.lastMouseY = y;
    this.centerPenCursor();
    if (!this.isDrawing) {
      return;
    }
    const stroke = this.strokes[this.strokes.length - 1];
    const start = stroke.points[stroke.points.length - 1];
    const end = { x, y };
    stroke.points.push(end);
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  }
  stopDrawing() {
    this.isDrawing = false;
    this.canvas.dispatchEvent(new Event('drawstop'));
  }
  centerPenCursor() {
    this.penCursor.style.left =
      this.lastMouseX + this.canvas.offsetLeft
      - this.ctx.lineWidth / 2 + 'px';
    this.penCursor.style.top =
      this.lastMouseY + this.canvas.offsetTop
      - this.ctx.lineWidth / 2 + 'px';
  }

  /// Mouse drawing
  startMouse(e) {
    this.startDrawing(e.offsetX,e.offsetY)
  }
  drawMouse(e) {
    this.drawPath(e.offsetX,e.offsetY)
  }
  /// Touch drawing
  startTouch(e) {
    console.log("Touch Start")
    this.startDrawing(...this.touchPos(e));
  }
  drawTouch(e) {
    this.drawPath(...this.touchPos(e))
  }
  touchPos(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.pageX - this.canvas.offsetLeft;
    const y = touch.pageY - this.canvas.offsetTop;
    return [x,y];
  }

  /// Drawing controls
  stepPenSize(v) {
    const temp = Math.min(this.ctx.lineWidth + v, this.lineWidthMax);
    this.ctx.lineWidth = Math.floor(Math.max(temp, this.lineWidthMin));
    this.infoShow(`${this.ctx.lineWidth}px`);
    this.updatePenCursorSize(this.ctx.lineWidth);
  }
  updatePenCursorSize() {
    const sz = this.ctx.lineWidth + 'px'
    this.penCursor.style.width = sz;
    this.penCursor.style.height = sz;
    this.centerPenCursor();
  }
  scrollSize(e) {
    e.preventDefault();
    this.stepPenSize(-e.deltaY/100);
  }
  showPen() {
    this.penCursor.style.visibility = "visible";
  }
  hidePen() {
    this.isDrawing = false;
    this.penCursor.style.visibility = "hidden";
  }
  undo() {
    this.strokes.pop();
    this.clear();
    this.redraw();
    this.updatePenCursorSize(this.ctx.lineWidth);
    this.setErasingState(this.ctx.strokeStyle == '#000000');
    this.infoShow("Undo")
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  toggleEraser() {
    this.isErasing = !this.isErasing;
    this.setErasingState(this.isErasing);
    console.log("toggled erasing:", this.isErasing);
    this.infoShow(this.isErasing ? "Eraser" : "Pen");
  }
  setErasingState(erasing) {
    if (erasing) {
      this.isErasing = true;
      this.ctx.strokeStyle = 'black';
      this.penCursor.style.backgroundColor = 'red';
      this.info.style.color = 'red';
    } else {
      this.isErasing = false;
      this.ctx.strokeStyle = 'white';
      this.penCursor.style.backgroundColor = '';
      this.info.style.color = '';
    }
  }
  redraw() {
    this.strokes.forEach((stroke) => {
      this.ctx.lineWidth = stroke.size
      this.ctx.strokeStyle = stroke.style
      this.ctx.beginPath();
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((point) => {
        this.ctx.lineTo(point.x, point.y);
        this.ctx.moveTo(point.x, point.y);
      });
      this.ctx.stroke();
    });
  }
}