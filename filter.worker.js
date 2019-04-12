importScripts('opencv/opencv.js');

cv.onRuntimeInitialized = () => postMessage({type: 'RUNTIME_INITIALIZED'});

addEventListener('message', function handleMessage({data}) {
    const imgMat = cv.matFromImageData(data);
    const [points, highestFillRatio] = calculateBoundingRectPoints(imgMat);
    const imageData = convertToImageData(imgMat);
    imgMat.delete();

    postMessage({
        type: 'FRAME',
        imageData,
        points,
        fillRatio: highestFillRatio,
    }, [imageData.data.buffer]);
});

function convertToImageData(imgMat) {
    const dst = new cv.Mat();
    imgMat.convertTo(dst, cv.CV_8U);
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
    const imageData = new ImageData(new Uint8ClampedArray(dst.data, dst.cols, dst.rows), dst.cols);
    dst.delete();
    return imageData;
}

function findCorners(biggestContour) {
    if (!biggestContour) {
        return;
    }
    let points;
    let epsilon = 0.03 * cv.arcLength(biggestContour, true);
    let approx = new cv.Mat();
    cv.approxPolyDP(biggestContour, approx, epsilon, true);

    if (approx.rows === 4) {
        points = [];
        for (let i = 0; i < 4; i++) {
            points.push({x: approx.intAt(i * 2), y: approx.intAt(i * 2 + 1)});
        }
    }

    approx.delete();
    return points;
}

function calculateBoundingRectPoints(imgMat) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    const initialFillRatio = 0.3;
    let highestFillRatio = initialFillRatio;
    let points;
    let biggestContour;

    cv.cvtColor(imgMat, imgMat, cv.COLOR_BGR2GRAY);
    cv.medianBlur(imgMat, imgMat, 7);
    cv.Canny(imgMat, imgMat, 80, 190);
    cv.findContours(imgMat, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let currentContour = contours.get(i);
        let boundingArea = imgMat.cols * imgMat.rows;
        let contourArea = cv.contourArea(currentContour);
        let fillRatio = contourArea / boundingArea;

        if (highestFillRatio < fillRatio) {
            highestFillRatio = fillRatio;
            biggestContour = currentContour;
        }
    }

    points = findCorners(biggestContour);

    contours.delete();
    hierarchy.delete();

    return [points, highestFillRatio];
}

