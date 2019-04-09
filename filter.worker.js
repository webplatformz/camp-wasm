importScripts('opencv/opencv.js');

cv.onRuntimeInitialized = () => postMessage({type: 'RUNTIME_INITIALIZED'});

addEventListener('message', function handleMessage({data}) {
    const imgMat = cv.matFromImageData(data);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let biggestContour;

    cv.cvtColor(imgMat, imgMat, cv.COLOR_BGR2GRAY);

    // cv.bilateralFilter(imgMat, imgMat, 5, 75, 75, cv.BORDER_DEFAULT);

    cv.adaptiveThreshold(imgMat, imgMat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 115, 4);
    cv.medianBlur(imgMat, imgMat, 11);

    cv.copyMakeBorder(imgMat, imgMat, 5, 5, 5, 5, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0));
    cv.Canny(imgMat, imgMat, 370, 160);

    cv.findContours(imgMat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {

        let epsilon = 0.1 * cv.arcLength(contours.get(i), true);
        let approx = new cv.Mat();
        cv.approxPolyDP(contours.get(i), approx, epsilon, true);

        if (approx.rows === 4) {
            let area = cv.contourArea(contours.get(i));

            if (biggestContour === undefined) {
                biggestContour = contours.get(i);
            }
            if (area > cv.contourArea(biggestContour)) {
                biggestContour = contours.get(i);
            }
        }

        approx.delete();
    }

    postFrame(imgMat, biggestContour);

    contours.delete();
    hierarchy.delete();
    imgMat.delete();
});

function postFrame(imgMat, biggestContour) {
    const boundRect = getBoundingRect(biggestContour);
    const imageData = convertToImageData(imgMat);
    postMessage({
        type: 'FRAME',
        boundRect,
        imageData,
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

function getBoundingRect(biggestContour) {
    let boundRect;
    if (biggestContour) {
        boundRect = cv.boundingRect(biggestContour);
    }
    return boundRect;
}
