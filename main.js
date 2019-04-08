import { init, render } from './render.js';

const videoInput = document.getElementById('videoInput');

cv.onRuntimeInitialized = () => {
  init(videoInput);
  render();
};

navigator.mediaDevices.getUserMedia({ audio: false, video: true })
  .then(stream => videoInput.srcObject = stream)
  .catch(console.error);
