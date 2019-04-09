importScripts('opencv/opencv.js');
let runtimeInitialized = false;

cv.onRuntimeInitialized = () => runtimeInitialized = true;

addEventListener('message', function handleMessage({data}) {
    if (!runtimeInitialized) return;

    const img = cv.matFromImageData(data);

    // DO STUFF

    postMessage({x: 15, y: 15, width: 50, height: 20});

    img.delete();
});
