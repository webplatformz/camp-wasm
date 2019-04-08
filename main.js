let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
    imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function () {
    let mat = cv.imread(imgElement);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.cvtColor(mat, mat, cv.COLOR_RGB2GRAY);
    cv.threshold(mat, mat, 127, 255, 0);
    cv.findContours(mat, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < contours.size(); ++i) {
    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255));
    cv.drawContours(dest, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
  }
  cv.imshow('canvasOutput', dest);
  window.requestAnimationFrame(() => render(cap, src, dest));
}

videoInput.addEventListener('play', () => {
  const src = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
  const dest = new cv.Mat(videoInput.height, videoInput.width, cv.CV_8UC4);
  const cap = new cv.VideoCapture(videoInput);

    cv.imshow('canvasOutput', mat);
    mat.delete();
};