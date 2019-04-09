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

    findRectangle(srcMat, dstMat);

    cv.imshow('canvasOutput', srcMat);
    window.requestAnimationFrame(render);
}

function findRectangle(input, output) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let smallestAreaDiff = Infinity;
    let bestMatch;

    cv.cvtColor(input, output, cv.COLOR_BGR2GRAY);

    // cv.bilateralFilter(output, output, 5, 75, 75, cv.BORDER_DEFAULT);

    cv.adaptiveThreshold(output, output, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4);
    cv.medianBlur(output, output, 11);

    cv.copyMakeBorder(output, output, 5, 5, 5, 5, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0));
    cv.Canny(output, output, 370, 160);

    cv.findContours(output, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let boundingRect = new cv.Mat();
        cv.boundingRect(contours.get(i), boundingRect);
        let boundingArea = cv.contourArea(boundingRect);
        let contourArea = cv.contourArea(contours.get(i));
        let areaDiff  = boundingArea - contourArea;

        if (smallestAreaDiff < areaDiff) {
          smallestAreaDiff = areaDiff;
          bestMatch = boundingRect;
        }
        boundingRect.delete();
    }

    if (bestMatch !== undefined) {
      let color = new cv.Scalar(0, 255, 0);
      const topLeft = new cv.Point(bestMatch.x, bestMatch.y);
      const bottomRight = new cv.Point(bestMatch.x + bestMatch.width, bestMatch.y + bestMatch.height);
      cv.rectangle(input, topLeft, bottomRight, color, 1, 16);
      bestMatch.delete()
    }

    contours.delete();
    hierarchy.delete();
}
