export function toggleZoom() {
  const currentZoom = parseFloat(document.body.style.zoom || 1);
  document.body.style.zoom = currentZoom === 1 ? 0.5 : 1;
}

export function increment(field) {
  let cv = parseInt(field.value);
  let lim = parseInt(field.max);
  if (cv < lim) {
    field.value = cv+1
    return cv+1
  }
  return cv
}

export function decrement(field) {
  let cv = parseInt(field.value);
  let lim = parseInt(field.min);
  if (cv > lim) {
    field.value = cv-1
    return cv-1
  }
  return cv
}

