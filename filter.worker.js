importScripts('opencv/opencv.js');

cv.onRuntimeInitialized = () => postMessage({type: 'RUNTIME_INITIALIZED'});

addEventListener('message', function handleMessage({data}) {
    const imgMat = cv.matFromImageData(data);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let highestFillRatio = 0;
    let bestMatchingRectangle;

    cv.cvtColor(imgMat, imgMat, cv.COLOR_BGR2GRAY);

    cv.medianBlur(imgMat, imgMat, 7);

    cv.Canny(imgMat, imgMat, 200, 80);

    cv.findContours(imgMat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let currentContour = contours.get(i);
        let contourBoundingRect = cv.boundingRect(currentContour);
        let minBoundingRectWidth = imgMat.cols * 0.66;
        let minBoundingRectHeight = imgMat.rows * 0.66;

        if ( contourBoundingRect.width > minBoundingRectWidth && contourBoundingRect.height > minBoundingRectHeight) {
            let boundingArea = contourBoundingRect.width * contourBoundingRect.height;
            let contourArea = cv.contourArea(currentContour);
            let fillRatio = boundingArea / contourArea;

            if (highestFillRatio < fillRatio) {
                highestFillRatio = fillRatio;
                bestMatchingRectangle = contourBoundingRect;
            }
        }
    }

    const dst = new cv.Mat();
    imgMat.convertTo(dst, cv.CV_8U);
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
    const imageData = new ImageData(new Uint8ClampedArray(dst.data, dst.cols, dst.rows), dst.cols);
    dst.delete();
    postMessage({
        type: 'FRAME',
        boundRect: bestMatchingRectangle,
        imageData,
    }, [imageData.data.buffer]);

    contours.delete();
    hierarchy.delete();
    imgMat.delete();
});
