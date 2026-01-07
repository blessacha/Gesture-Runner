function countFingersUp(lm, handedness) {
  const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
  const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };

  let fingers = 0;

  if (lm[TIP.index].y < lm[PIP.index].y) fingers++;
  if (lm[TIP.middle].y < lm[PIP.middle].y) fingers++;
  if (lm[TIP.ring].y < lm[PIP.ring].y) fingers++;
  if (lm[TIP.pinky].y < lm[PIP.pinky].y) fingers++;

  if (handedness === "Right") {
    if (lm[TIP.thumb].x < lm[3].x) fingers++;
  } else {
    if (lm[TIP.thumb].x > lm[3].x) fingers++;
  }

  return fingers;
}

// Stable finger count to reduce flicker
const stable = { last: 0, frames: 0, value: 0 };

// Cooldown so events don't spam
let eventCooldown = 0;

// Returns: { hasHand, fingers, action }
// action: RUN (hold), DUCK (hold), JUMP (event), LEFT (event), RIGHT (event)
function updateInput() {
  const hand = window.latestHand;

  if (!hand || !hand.landmarks) {
    if (hand) {
      hand.fingersUp = 0;
      hand.gesture = "NONE";
    }
    stable.last = 0;
    stable.frames = 0;
    stable.value = 0;
    eventCooldown = 0;
    return { hasHand: false, fingers: 0, action: "NONE" };
  }

  const f = countFingersUp(hand.landmarks, hand.handedness);
  hand.fingersUp = f;

  // stability filter
  if (f === stable.last) stable.frames++;
  else {
    stable.last = f;
    stable.frames = 1;
  }

  const STABLE_N = 8;
  if (stable.frames >= STABLE_N) stable.value = f;

  const stableF = stable.value;
  hand.gesture = String(stableF);

  if (eventCooldown > 0) eventCooldown--;

  let action = "NONE";

  // Your mapping:
  // 5=RUN, 2=JUMP, 1=DUCK, 3=LEFT, 4=RIGHT
  if (stableF === 5) action = "RUN";
  else if (stableF === 1) action = "DUCK";
  else if (stableF === 2) action = (eventCooldown === 0 ? "JUMP" : "NONE");
  else if (stableF === 3) action = (eventCooldown === 0 ? "LEFT" : "NONE");
  else if (stableF === 4) action = (eventCooldown === 0 ? "RIGHT" : "NONE");

  // cooldown for event actions
  if (action === "JUMP" || action === "LEFT" || action === "RIGHT") {
    eventCooldown = 14;
  }

  return { hasHand: true, fingers: stableF, action };
}
