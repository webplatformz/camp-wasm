import {init, render} from './render';

const videoInput = document.getElementById('videoInput');

const videoDataLoaded = new Promise(resolve =>
    videoInput.addEventListener('loadeddata', () => {
        videoInput.width = videoInput.clientWidth;
        videoInput.height = videoInput.clientHeight;
        resolve();
    }),
);
const openCvRuntimeLoaded = new Promise(resolve => cv.onRuntimeInitialized = resolve);

Promise
    .all([videoDataLoaded, openCvRuntimeLoaded])
    .then(() => {
        init(videoInput);
        render();
    });

navigator.mediaDevices
    .getUserMedia({audio: false, video: {facingMode: ['environment', 'user']}})
    .then(stream => videoInput.srcObject = stream)
    .catch(console.error);
