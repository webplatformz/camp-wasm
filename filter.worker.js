importScripts('opencv/opencv.js');

cv.onRuntimeInitialized = () => postMessage({type: 'RUNTIME_INITIALIZED'});

addEventListener('message', function handleMessage({data}) {
    const imgMat = cv.matFromImageData(data);
    postFrame(imgMat, calculateBoundingRectPoints(imgMat));
    imgMat.delete();
});

function postFrame(imgMat, points) {
    const imageData = convertToImageData(imgMat);
    postMessage({
        type: 'FRAME',
        imageData,
        points,
    }, [imageData.data.buffer]);
}

function convertToImageData(imgMat) {
    const dst = new cv.Mat();
    imgMat.convertTo(dst, cv.CV_8U);
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
    const imageData = new ImageData(new Uint8ClampedArray(dst.data, dst.cols, dst.rows), dst.cols);
    dst.delete();
    return imageData;
}

function hasMinSize(contourBoundingRect, minBoundingRectWidth, minBoundingRectHeight) {
    return contourBoundingRect.size.width > minBoundingRectWidth
        && contourBoundingRect.size.height > minBoundingRectHeight;
}

function calculateBoundingRectPoints(imgMat) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let highestFillRatio = 0;
    let points;

    cv.cvtColor(imgMat, imgMat, cv.COLOR_BGR2GRAY);
    cv.medianBlur(imgMat, imgMat, 7);
    cv.Canny(imgMat, imgMat, 80, 190);
    cv.findContours(imgMat, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let currentContour = contours.get(i);
        let contourBoundingRect = cv.minAreaRect(currentContour);
        let minBoundingRectWidth = imgMat.cols * 0.3;
        let minBoundingRectHeight = imgMat.rows * 0.3;

        if (hasMinSize(contourBoundingRect, minBoundingRectWidth, minBoundingRectHeight)) {
            let boundingArea = contourBoundingRect.size.width * contourBoundingRect.size.height;
            let contourArea = cv.contourArea(currentContour);
            let fillRatio = contourArea / boundingArea;

            if (highestFillRatio < fillRatio) {
                highestFillRatio = fillRatio;
                points = cv.RotatedRect.points(contourBoundingRect);
            }
        }
    }
    contours.delete();
    hierarchy.delete();

    return points;
}
