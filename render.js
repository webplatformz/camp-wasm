export function render(videoCapture, srcMat, dstMat) {
  videoCapture.read(srcMat);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.cvtColor(srcMat, dstMat, cv.COLOR_RGB2GRAY);
  cv.threshold(dstMat, dstMat, 127, 255, 0);
  cv.findContours(dstMat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); ++i) {
    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
    cv.drawContours(dstMat, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
  }
  cv.imshow('canvasOutput', dstMat);
  window.requestAnimationFrame(() => render(videoCapture, srcMat, dstMat));
}