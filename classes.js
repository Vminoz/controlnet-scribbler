export class SteppedNumberInput {
  constructor(id) {
    this.inputElement = document.getElementById(id);
    this.min = parseFloat(this.inputElement.min);
    this.max = parseFloat(this.inputElement.max);
    this.step = parseFloat(this.inputElement.step);
    this.inputElement.addEventListener('input', this.limitValue.bind(this));
    this.inputElement.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.inputElement.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.scrollTimeout = null;
    this.scrollStepHandler = this.scrollStep.bind(this);
  }

  limitValue() {
    let value = parseFloat(this.inputElement.value);
    if (isNaN(value) || value < this.min) {
      value = this.min;
    } else {
      value = Math.min(value, this.max);
    }
    this.inputElement.value = Math.round(value*10)/10;
  }

  handleMouseEnter() {
    this.inputElement.addEventListener('wheel', this.scrollStepHandler);
  }

  handleMouseLeave() {
    this.inputElement.removeEventListener('wheel', this.scrollStepHandler);
  }

  scrollStep(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -this.step : this.step;
    this.inputElement.value = parseFloat(this.inputElement.value) + delta;
    this.limitValue();
  }

  getValue() {
    return parseFloat(this.inputElement.value);
  }
}