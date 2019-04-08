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

  findRectangle(srcMat, dstMat)

  cv.imshow('canvasOutput', dstMat);
  window.requestAnimationFrame(render);
}

function findRectangle(input, output) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.cvtColor(input, output, cv.COLOR_BGR2GRAY);

  // cv.bilateralFilter(output, output, 5, 75, 75, cv.BORDER_DEFAULT);

  cv.adaptiveThreshold(output, output, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4);
  cv.medianBlur(output, output, 11)

  cv.copyMakeBorder(output, output, 5, 5, 5, 5, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0));
  cv.Canny(output, output, 370, 160)

  cv.findContours(output, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); ++i) {
    let color = new cv.Scalar(255, 165, 0);

    let epsilon = 0.1 * cv.arcLength(contours.get(i), true);
    let approx = new cv.Mat();
    cv.approxPolyDP(contours.get(i), approx, epsilon, true);

    if (approx.matSize === 4) {
      let boundRect = cv.boundingRect(contours.get(i));

      console.log(approx)

      const topLeft = new cv.Point(boundRect.x, boundRect.y)
      const bottomRight = new cv.Point(boundRect.x + boundRect.width, boundRect.y + boundRect.height)
      cv.rectangle(output, topLeft, bottomRight, color, 1, 16);
    }
  }

  contours.delete();
  hierarchy.delete();
}
