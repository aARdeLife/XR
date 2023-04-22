const API_KEY = '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';

const introVideo = document.getElementById('intro-video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const summaryBox = document.getElementById('summary-box');

function isPointInRect(x, y, rect) {
  return x >= rect[0] && x <= rect[0] + rect[2] && y >= rect[1] && y <= rect[1] + rect[3];
}

async function fetchWikipediaSummary(title) {
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=false`);
  if (response.ok) {
    const data = await response.json();
    return data.extract;
  } else {
    return 'No summary available';
  }
}

async function initializeApp() {
  document.body.removeChild(introVideo);

  const video = document.getElementById('video');
  const summaryBox = document.getElementById('summary-box');

  async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }

  async function detectObjects() {
    const model = await cocoSsd.load({ apiKey: API_KEY });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Initialize currentPredictions as an empty array
    currentPredictions = [];

    while (true) {
      const predictions = await model.detect(video);
      currentPredictions = predictions;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      predictions.forEach(prediction => {
        const distanceFromCenter = Math.sqrt(
          Math.pow((prediction.bbox[0] + prediction.bbox[2] / 2) - (canvas.width / 2), 2) + 
          Math.pow((prediction.bbox[1] + prediction.bbox[3] / 2) - (canvas.height / 2), 2)
        );
        let color = 'yellow';
        if (distanceFromCenter < 100) {
          color = 'red';
        } else if (distanceFromCenter < 200) {
          color = 'orange';
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(...prediction.bbox);
      });

      await tf.nextFrame();
    }
  }

  const videoElement = await setupCamera();
  videoElement.play();
  detectObjects();
}

introVideo.addEventListener('ended', initializeApp);
