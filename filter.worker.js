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

function hasMinSize(contourBoundingRect, minBoundingRectWidth, minBoundingRectHeight) {
    return contourBoundingRect.size.width > minBoundingRectWidth
        && contourBoundingRect.size.height > minBoundingRectHeight;
}

function calculateBoundingRectPoints(imgMat) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let highestFillRatio = 0;
    let points = [];

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

                let epsilon = 0.1 * cv.arcLength(currentContour, true);
                let approx = new cv.Mat();
                cv.approxPolyDP(currentContour, approx, epsilon, true);

                points = approx.data
                    .filter((_, index) => index % 4 === 0)
                    .reduce((acc, value, index) => {
                        if (index % 2 === 0) {
                            acc.push({x: value});
                        } else {
                            acc[acc.length - 1].y = value;
                        }
                        return acc;
                    }, []);
                approx.delete();
            }
        }

    }

    if (points) {
        maskRegionOfInterest(imgMat, points);
    }

    contours.delete();
    hierarchy.delete();

    return [points, highestFillRatio];
}

function maskRegionOfInterest(imgMat, points) {
    for (let i = 0; i < imgMat.rows; i++) {
        for (let j = 0; j < imgMat.cols; j++) {
            let p = new cv.Point(j, i);
            if (!isInRegionOfInterest(p, points)) {
                imgMat.ucharPtr(i, j)[0] = 0;
            }
        }
    }
}

function isInRegionOfInterest(p, roi) {
    let pro = [];
    for (let i = 0; i < 4; ++i) {
        pro[i] = computeProduct(p, roi[i], roi[(i + 1) % 4]);
    }
    return pro[0] * pro[2] < 0 && pro[1] * pro[3] < 0;
}

function computeProduct(p, a, b) {
    k = (a.y - b.y) / (a.x - b.x);
    j = a.y - k * a.x;
    return k * p.x - p.y + j;
}
