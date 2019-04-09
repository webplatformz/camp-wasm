const PROCESSING_RESOLUTION_WIDTH = 240;
const CONSTRAINTS = {audio: false, video: {facingMode: ['environment', 'user']}};
const worker = new Worker('filter.worker.js');
let scale = 0;
let canvas;
let imageCapture;
let rect;

worker.addEventListener('message', ({data}) => rect = data);

async function startStreaming() {
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    scale = PROCESSING_RESOLUTION_WIDTH / settings.width;

    canvas = document.createElement('canvas');
    canvas.setAttribute('width', settings.width * scale);
    canvas.setAttribute('height', settings.height * scale);
    document.querySelector('.input-container').appendChild(canvas);

    imageCapture = new ImageCapture(videoTrack);
    drawLoop();
}

async function drawLoop() {
    const frame = await imageCapture.grabFrame();
    const ctx = canvas.getContext('2d');
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    if (rect) {
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.stroke();
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    worker.postMessage(imageData, [imageData.data.buffer]);
    requestAnimationFrame(drawLoop);
}

startStreaming();
