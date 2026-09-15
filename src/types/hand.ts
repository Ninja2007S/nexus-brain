export interface HandLandmark {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface HandPosition {
  x: number;
  y: number;
  z: number;
}

export interface HandOrientation {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface HandState {
  detected: boolean;
  handedness: string;
  tracking_confidence: number;

  landmarks: HandLandmark[];

  palm: {
    x: number;
    y: number;
    z: number;
  };

  position: HandPosition;

  orientation: HandOrientation;

  depth: number;
  relative_z: number;

  timestamp?: number;
}

export const EMPTY_HAND_STATE: HandState = {
  detected: false,

  handedness: "Unknown",

  tracking_confidence: 0,

  landmarks: [],

  palm: {
    x: 0.5,
    y: 0.5,
    z: 0,
  },

  position: {
    x: 0.5,
    y: 0.5,
    z: 0,
  },

  orientation: {
    yaw: 0,
    pitch: 0,
    roll: 0,
  },

  depth: 0,

  relative_z: 0,

  timestamp: 0,
};