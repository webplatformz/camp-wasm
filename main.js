const PROCESSING_RESOLUTION_WIDTH = 340;
const CONSTRAINTS = {audio: false, video: {facingMode: ['environment']}};
const worker = new Worker('filter.worker.js');
const debugCanvas = document.querySelector('.debug-canvas');
const inputVideo = document.querySelector('.input-video');
let canvas;
let rect;
let debugImageData;
let statsFPS;
let statsMemory;

worker.addEventListener('message', ({data}) => {
    if (data.type === 'RUNTIME_INITIALIZED') {
        startStreaming();
        return;
    }
    rect = data.boundRect;
    debugImageData = data.imageData;
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

async function drawLoop() {
    statsMemory.begin();
    statsFPS.begin();

    const ctx = canvas.getContext('2d');

    ctx.drawImage(inputVideo, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    worker.postMessage(imageData, [imageData.data.buffer]);

    if (rect) {
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeStyle = '#FFA500';
        ctx.stroke();
    }

    if (debugImageData) {
        debugCanvas.getContext('2d').putImageData(debugImageData, 0, 0);
    }
}

function setupVideoCanvas(settings) {
    const scale = PROCESSING_RESOLUTION_WIDTH / settings.width;
    canvas = document.createElement('canvas');
    canvas.setAttribute('width', settings.width * scale);
    canvas.setAttribute('height', settings.height * scale);
    document.querySelector('.input-container').appendChild(canvas);
    debugCanvas.setAttribute('width', canvas.width);
    debugCanvas.setAttribute('height', canvas.height);
    inputVideo.setAttribute('width', canvas.width);
    inputVideo.setAttribute('height', canvas.height);
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