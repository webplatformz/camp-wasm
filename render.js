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
    cv.imshow('canvasOutput', srcMat);

    statsMemory.end();
    statsFPS.end();

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
        let boundingRect = cv.boundingRect(contours.get(i));
        let boundingArea = boundingRect.width * boundingRect.height;
        let contourArea = cv.contourArea(contours.get(i));
        let areaDiff  = boundingArea - contourArea;

        if (smallestAreaDiff < areaDiff) {
          smallestAreaDiff = areaDiff;
          bestMatch = boundingRect;
        }
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
