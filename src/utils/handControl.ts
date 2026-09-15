import type { HandState } from "../types/hand";
import { EMPTY_HAND_STATE } from "../types/hand";


let currentHandState: HandState = {
  ...EMPTY_HAND_STATE,
};


const listeners = new Set<() => void>();


export function getHandState(): HandState {
  return currentHandState;
}


export function setHandState(
  state: HandState,
): void {

  currentHandState = state;

  for (const listener of listeners) {
    listener();
  }
}


export function subscribeHandState(
  listener: () => void,
): () => void {

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}


export function resetHandState(): void {

  currentHandState = {
    ...EMPTY_HAND_STATE,
  };

  for (const listener of listeners) {
    listener();
  }
}


// ============================================================
// PINCH
// ============================================================

export function isPinching(
  state: HandState,
): boolean {

  if (
    !state.detected ||
    state.landmarks.length < 21
  ) {
    return false;
  }

  if (state.pinch) {
    return true;
  }

  const thumb = state.landmarks[4];
  const index = state.landmarks[8];

  if (!thumb || !index) {
    return false;
  }

  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;
  const dz = thumb.z - index.z;

  const distance = Math.sqrt(
    dx * dx +
    dy * dy +
    dz * dz,
  );

  return distance < 0.065;
}


// ============================================================
// PINCH STRENGTH
// ============================================================

export function getPinchStrength(
  state: HandState,
): number {

  if (!state.detected) {
    return 0;
  }

  if (
    typeof state.pinch_strength ===
    "number"
  ) {
    return Math.max(
      0,
      Math.min(
        1,
        state.pinch_strength,
      ),
    );
  }

  return isPinching(state)
    ? 1
    : 0;
}


// ============================================================
// HAND OPENNESS
// ============================================================

export function calculateHandOpenness(
  state: HandState,
): number {

  if (!state.detected) {
    return 0;
  }

  if (
    typeof state.openness ===
    "number"
  ) {
    return Math.max(
      0,
      Math.min(
        1,
        state.openness,
      ),
    );
  }

  if (
    !state.landmarks ||
    state.landmarks.length < 21
  ) {
    return 0;
  }

  const wrist =
    state.landmarks[0];

  const fingerTips = [
    state.landmarks[8],
    state.landmarks[12],
    state.landmarks[16],
    state.landmarks[20],
  ];

  let total = 0;

  for (const tip of fingerTips) {

    const dx =
      tip.x - wrist.x;

    const dy =
      tip.y - wrist.y;

    const dz =
      tip.z - wrist.z;

    total += Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz,
    );
  }

  const average =
    total / fingerTips.length;

  return Math.max(
    0,
    Math.min(
      1,
      (average - 0.18) /
        0.22,
    ),
  );
}


// ============================================================
// FIST
// ============================================================

export function isFist(
  state: HandState,
): boolean {

  if (!state.detected) {
    return false;
  }

  if (state.fist) {
    return true;
  }

  return (
    calculateHandOpenness(
      state,
    ) < 0.25 &&
    !isPinching(state)
  );
}


// ============================================================
// OPEN HAND
// ============================================================

export function isOpenHand(
  state: HandState,
): boolean {

  if (!state.detected) {
    return false;
  }

  if (state.open_hand) {
    return true;
  }

  return (
    calculateHandOpenness(
      state,
    ) > 0.72
  );
}


// ============================================================
// POINTING
// ============================================================

export function isPointing(
  state: HandState,
): boolean {

  if (!state.detected) {
    return false;
  }

  return Boolean(
    state.pointing,
  );
}


// ============================================================
// PEACE
// ============================================================

export function isPeace(
  state: HandState,
): boolean {

  if (!state.detected) {
    return false;
  }

  return Boolean(
    state.peace,
  );
}


// ============================================================
// THUMBS UP
// ============================================================

export function isThumbsUp(
  state: HandState,
): boolean {

  if (!state.detected) {
    return false;
  }

  return Boolean(
    state.thumbs_up,
  );
}


// ============================================================
// NORMALIZED HAND POSITION
// ============================================================

export function getHandX(
  state: HandState,
): number {

  return Math.max(
    0,
    Math.min(
      1,
      state.position?.x ??
        0.5,
    ),
  );
}


export function getHandY(
  state: HandState,
): number {

  return Math.max(
    0,
    Math.min(
      1,
      state.position?.y ??
        0.5,
    ),
  );
}


export function getHandZ(
  state: HandState,
): number {

  return Math.max(
    -1,
    Math.min(
      1,
      state.position?.z ??
        0,
    ),
  );
}


// ============================================================
// ORIENTATION
// ============================================================

export function getHandYaw(
  state: HandState,
): number {

  return state.orientation?.yaw ??
    0;
}


export function getHandPitch(
  state: HandState,
): number {

  return state.orientation?.pitch ??
    0;
}


export function getHandRoll(
  state: HandState,
): number {

  return state.orientation?.roll ??
    0;
}