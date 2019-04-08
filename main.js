import { render } from './render.js';

const videoInput = document.getElementById('videoInput');

cv.onRuntimeInitialized = () => {
  const srcMat = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
  const dstMat = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
  const videoCapture = new cv.VideoCapture(videoInput);

  render(videoCapture, srcMat, dstMat);
};

navigator.mediaDevices.getUserMedia({ audio: false, video: true })
  .then(stream => videoInput.srcObject = stream)
  .catch(console.error);
