let videoCapture;
let srcMat;
let dstMat;

export function init(videoInput) {
  videoCapture = new cv.VideoCapture(videoInput);
  srcMat = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
  dstMat = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
}

export function render() {
  videoCapture.read(srcMat);
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.cvtColor(srcMat, dstMat, cv.COLOR_RGB2GRAY);
  cv.threshold(dstMat, dstMat, 127, 255, 0);
  cv.findContours(dstMat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); ++i) {
    const color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
    cv.drawContours(dstMat, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
  }

  cv.imshow('canvasOutput', dstMat);
  contours.delete();
  hierarchy.delete();
  window.requestAnimationFrame(render);
}