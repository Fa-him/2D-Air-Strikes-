let indexFingerTip = null;
let handLandmarks = null;

const video = document.getElementById("bgVideo");

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults((results) => {
  if (results.multiHandLandmarks?.length) {
    handLandmarks = results.multiHandLandmarks[0];
    indexFingerTip = handLandmarks[8]; // Pointing finger
  } else {
    indexFingerTip = null;
  }
});

const camera = new window.Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: window.innerWidth,
  height: window.innerHeight
});
camera.start();

export function getIndexFingerTip() {
  return indexFingerTip;
}
