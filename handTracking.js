const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");

window.latestHand = {
  landmarks: null,
  handedness: null,
  fingersUp: 0,
  gesture: "NONE"
};

const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults((results) => {
  octx.clearRect(0, 0, overlay.width, overlay.height);

  if (results.multiHandLandmarks?.length) {
    const lm = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0].label;

    drawConnectors(octx, lm, HAND_CONNECTIONS, { lineWidth: 3 });
    drawLandmarks(octx, lm, { lineWidth: 2 });

    window.latestHand.landmarks = lm;
    window.latestHand.handedness = handedness;
  } else {
    window.latestHand.landmarks = null;
    window.latestHand.handedness = null;
  }
});

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480
});

camera.start();
