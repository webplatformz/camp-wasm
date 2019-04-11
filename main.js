const PROCESSING_RESOLUTION_WIDTH = 240;
const CONSTRAINTS = {audio: false, video: {facingMode: ['environment']}};
const worker = new Worker('filter.worker.js');
const debugCanvas = document.querySelector('.debug-canvas');
const inputVideo = document.querySelector('.input-video');
const canvas = document.querySelector('canvas.scaled');
const fullCanvas = document.querySelector('canvas.full');
let points;
let debugImageData;
let statsFPS;
let statsMemory;
let fillRatio;
let scale;

worker.addEventListener('message', ({data}) => {
    if (data.type === 'RUNTIME_INITIALIZED') {
        startStreaming();
        return;
    }
    points = data.points;
    debugImageData = data.imageData;
    fillRatio = data.fillRatio;
    statsMemory.end();
    statsFPS.end();
    requestAnimationFrame(drawLoop);
});

async function startStreaming() {
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    setupVideoCanvas(settings);
    inputVideo.srcObject = stream;

    await inputVideo.play();

    drawLoop();
}

function drawLoop() {
    statsMemory.begin();
    statsFPS.begin();

    const scaledContext = canvas.getContext('2d');
    scaledContext.drawImage(inputVideo, 0, 0, canvas.width, canvas.height);
    const imageData = scaledContext.getImageData(0, 0, canvas.width, canvas.height);
    worker.postMessage(imageData, [imageData.data.buffer]);

    const ctx = fullCanvas.getContext('2d');
    ctx.drawImage(inputVideo, 0, 0, fullCanvas.width, fullCanvas.height);

    if (points) {
        ctx.beginPath();
        ctx.save();
        const [firstPoint, ...restPoints] = points.map(point => ({x: point.x / scale, y: point.y / scale}));
        ctx.moveTo(firstPoint.x, firstPoint.y);
        restPoints.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.strokeStyle = getFillratioColor(fillRatio);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }

    if (debugImageData) {
        debugCanvas.getContext('2d').putImageData(debugImageData, 0, 0);
    }
}

function getFillratioColor(fillRatio) {
    if (fillRatio > 0.9) return 'green';
    if (fillRatio > 0.5) return 'orange';
    return 'red';
}

function setupVideoCanvas(settings) {
    scale = PROCESSING_RESOLUTION_WIDTH / settings.width;
    canvas.setAttribute('width', settings.width * scale);
    canvas.setAttribute('height', settings.height * scale);
    document.querySelector('.input-container').appendChild(canvas);
    debugCanvas.setAttribute('width', canvas.width);
    debugCanvas.setAttribute('height', canvas.height);
    inputVideo.setAttribute('width', settings.width);
    inputVideo.setAttribute('height', settings.height);
    fullCanvas.setAttribute('width', settings.width);
    fullCanvas.setAttribute('height', settings.height);
}

function setupStats() {
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

setupStats();