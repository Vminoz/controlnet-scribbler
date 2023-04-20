
export function toggleZoom() {
  const currentZoom = parseFloat(document.body.style.zoom || 1);
  document.body.style.zoom = currentZoom === 1 ? 0.5 : 1;
}

let fadeTimeoutId;

export function temporaryContent(element, value) {
  element.textContent = `${value}px`;
  element.style.opacity = 1;

  clearTimeout(fadeTimeoutId);
  fadeTimeoutId = setTimeout(() => {
    element.style.opacity = 0;
  }, 500);
}