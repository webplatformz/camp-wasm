importScripts('opencv/opencv.js');
let runtimeInitialized = false;

cv.onRuntimeInitialized = () => runtimeInitialized = true;

addEventListener('message', function handleMessage({data}) {
    if (!runtimeInitialized) return;

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

    if (biggestContour) {
        const boundRect = cv.boundingRect(biggestContour);
        postMessage({x: boundRect.x, y: boundRect.y, width: boundRect.width, height: boundRect.height});
    }

    contours.delete();
    hierarchy.delete();
    imgMat.delete();
});
