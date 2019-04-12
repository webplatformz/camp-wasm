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
    return new ImageData(new Uint8ClampedArray(imgMat.data, imgMat.cols, imgMat.rows), imgMat.cols);
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
    let epsilon = 0.03 * cv.arcLength(biggestContour, true);
    let approx = new cv.Mat();
    cv.approxPolyDP(biggestContour, approx, epsilon, true);

    if (approx.rows === 4) {
        points = [];
        for (let i = 0; i < 4; i++) {
            points.push(new cv.Point(approx.intAt(i * 2), approx.intAt(i * 2 + 1)));
        }
    }

    approx.delete();
    return points;
}

function calculateBoundingRectPoints(imgMat) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    const debugMat = new cv.Mat();

    let highestFillRatio = 0;
    let points;
    let biggestContour;

    cv.cvtColor(imgMat, debugMat, cv.COLOR_BGR2GRAY);
    cv.medianBlur(debugMat, debugMat, 7);
    cv.Canny(debugMat, debugMat, 80, 190);
    cv.findContours(debugMat, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
        let currentContour = contours.get(i);
        let contourBoundingRect = cv.minAreaRect(currentContour);
        let minBoundingRectWidth = debugMat.cols * 0.3;
        let minBoundingRectHeight = debugMat.rows * 0.3;

        if (hasMinSize(contourBoundingRect, minBoundingRectWidth, minBoundingRectHeight)) {
            let boundingArea = debugMat.cols * debugMat.rows;
            let contourArea = cv.contourArea(currentContour);
            let fillRatio = contourArea / boundingArea;

            if (highestFillRatio < fillRatio) {
                highestFillRatio = fillRatio;
                biggestContour = currentContour;
            }
        }
    }

    points = findCorners(biggestContour);
    if (points) {
        const boundingRect = cv.minAreaRect(biggestContour);
        const boundingRectPoints = cv.RotatedRect.points(boundingRect);
        transformImage(imgMat, convertPointsTo1DArray(points), convertPointsTo1DArray(boundingRectPoints));
        clipImage(imgMat, boundingRect);
    }

    contours.delete();
    hierarchy.delete();
    debugMat.delete();

    return [points, highestFillRatio];
}

function convertPointsTo1DArray(points) {
    return [
        points[0].x, points[0].y,
        points[1].x, points[1].y,
        points[2].x, points[2].y,
        points[3].x, points[3].y
    ];
}

function transformImage(mat, sourcePoints, targetPoints) {
    let dsize = new cv.Size(mat.rows, mat.cols);
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, sourcePoints);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, targetPoints);
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    cv.warpPerspective(mat, mat, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    M.delete(); srcTri.delete(); dstTri.delete();
}

function clipImage(imgMat, boundingRect) {
    const M = cv.getRotationMatrix2D(boundingRect.center, boundingRect.angle, 1);
    cv.warpAffine(imgMat, imgMat, M, imgMat.size(), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
}
