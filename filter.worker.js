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

function findCorners(biggestContour) {
    if (!biggestContour) {
        return;
    }
    let points;

    let epsilonPercentage;

    let rows = biggestContour.rows;
    if (rows < 100) {
        epsilonPercentage = 0.02;
    } else if (rows < 400) {
        epsilonPercentage = (0.05 / 300) * rows;
    } else {
        epsilonPercentage = 0.05;
    }

    console.log(epsilonPercentage);

    let epsilon = epsilonPercentage * cv.arcLength(biggestContour, true);
    let approx = new cv.Mat();
    cv.approxPolyDP(biggestContour, approx, epsilon, true);

    if (approx.rows === 4) {
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
    }

    approx.delete();
    return points;
}

function calculateBoundingRectPoints(imgMat) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    let highestFillRatio = 0;
    let points;
    let biggestContour;

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
            let boundingArea = imgMat.cols * imgMat.rows;
            let contourArea = cv.contourArea(currentContour);
            let fillRatio = contourArea / boundingArea;

            if (highestFillRatio < fillRatio) {
                highestFillRatio = fillRatio;

                biggestContour = currentContour;
            }
        }
    }

    points = findCorners(biggestContour);

    contours.delete();
    hierarchy.delete();

    return [points, highestFillRatio];
}

