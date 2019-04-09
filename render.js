let videoCapture;
let srcMat;
let dstMat;
let statsFPS;
let statsMemory;

export function init(videoInput) {
    videoCapture = new cv.VideoCapture(videoInput);
    srcMat = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
    dstMat = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);

    statsFPS = new Stats();
    statsFPS.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    statsFPS.domElement.style.right = '0px';
    statsFPS.domElement.style.left = '';

    statsMemory = new Stats();
    statsMemory.showPanel(2); // 0: fps, 1: ms, 2: mb, 3+: custom
    statsMemory.domElement.style.right = '0px';
    statsMemory.domElement.style.top = '50px';
    statsMemory.domElement.style.left = '';

    document.body.appendChild(statsFPS.dom);
    document.body.appendChild(statsMemory.dom);
}

export function render() {

    statsMemory.begin();
    statsFPS.begin();

    videoCapture.read(srcMat);
    findRectangle(srcMat, dstMat);
    cv.imshow('canvasOutput', dstMat);

    statsMemory.end();
    statsFPS.end();

    window.requestAnimationFrame(render);
}

function findRectangle(input, output) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let highestFillRatio = 0;
    let bestMatchingRectangle;

    cv.cvtColor(input, output, cv.COLOR_BGR2GRAY);

    //cv.adaptiveThreshold(output, output, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4);
    cv.medianBlur(output, output, 11);

    // cv.copyMakeBorder(output, output, 5, 5, 5, 5, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0));

    // cv.Canny(output, output, 230, 175);

    cv.findContours(output, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let currentContour = contours.get(i);
        let epsilon = 0.01 * cv.arcLength(currentContour, true);
        let contourApproximation = new cv.Mat();
        cv.approxPolyDP(currentContour, contourApproximation, epsilon, true);
        let contourBoundingRect = cv.boundingRect(contourApproximation);
        let minBoundingRectWidth = input.cols * 0.66;
        let minBoundingRectHeight = input.rows * 0.66;

        if ( contourBoundingRect.width > minBoundingRectWidth && contourBoundingRect.height > minBoundingRectHeight) {
            let boundingArea = contourBoundingRect.width * contourBoundingRect.height;
            let contourArea = cv.contourArea(contourApproximation);
            let fillRatio = boundingArea / contourArea;

            if (highestFillRatio < fillRatio) {
                highestFillRatio = fillRatio;
                bestMatchingRectangle = contourBoundingRect;
            }
        }

        contourApproximation.delete();
    }

    if (bestMatchingRectangle !== undefined) {
      let color = new cv.Scalar(0, 255, 0);
      const topLeft = new cv.Point(bestMatchingRectangle.x, bestMatchingRectangle.y);
      const bottomRight = new cv.Point(bestMatchingRectangle.x + bestMatchingRectangle.width, bestMatchingRectangle.y + bestMatchingRectangle.height);
      cv.rectangle(input, topLeft, bottomRight, color, 1, 16);
    }

    contours.delete();
    hierarchy.delete();
}
