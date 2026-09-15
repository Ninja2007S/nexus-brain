from __future__ import annotations

import math
import threading
import time
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# MEDIAPIPE HAND LANDMARK NAMES
# ============================================================

LANDMARK_NAMES = [
    "Wrist",
    "Thumb CMC",
    "Thumb MCP",
    "Thumb IP",
    "Thumb Tip",
    "Index MCP",
    "Index PIP",
    "Index DIP",
    "Index Tip",
    "Middle MCP",
    "Middle PIP",
    "Middle DIP",
    "Middle Tip",
    "Ring MCP",
    "Ring PIP",
    "Ring DIP",
    "Ring Tip",
    "Pinky MCP",
    "Pinky PIP",
    "Pinky DIP",
    "Pinky Tip",
]


# ============================================================
# BASIC VECTOR HELPERS
# ============================================================

def _vector(
    a: Any,
    b: Any,
) -> tuple[float, float, float]:
    """
    Vector from point a -> point b.
    """

    return (
        float(b.x - a.x),
        float(b.y - a.y),
        float(b.z - a.z),
    )


def _normalize(
    vector: tuple[float, float, float],
) -> tuple[float, float, float]:
    """
    Normalize a 3D vector.
    """

    x, y, z = vector

    length = math.sqrt(
        x * x +
        y * y +
        z * z
    )

    if length < 1e-8:
        return (
            0.0,
            0.0,
            0.0,
        )

    return (
        x / length,
        y / length,
        z / length,
    )


def _cross(
    a: tuple[float, float, float],
    b: tuple[float, float, float],
) -> tuple[float, float, float]:
    """
    3D cross product.
    """

    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def _dot(
    a: tuple[float, float, float],
    b: tuple[float, float, float],
) -> float:
    """
    3D dot product.
    """

    return (
        a[0] * b[0] +
        a[1] * b[1] +
        a[2] * b[2]
    )


def _distance(
    a: Any,
    b: Any,
) -> float:
    """
    Euclidean distance between two landmarks.
    """

    dx = float(a.x - b.x)
    dy = float(a.y - b.y)
    dz = float(a.z - b.z)

    return math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
    )


def _clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """
    Clamp value between minimum and maximum.
    """

    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


# ============================================================
# ANGLE BETWEEN VECTORS
# ============================================================

def _angle_between(
    a: tuple[float, float, float],
    b: tuple[float, float, float],
) -> float:
    """
    Returns angle in radians between two vectors.
    """

    na = _normalize(a)
    nb = _normalize(b)

    dot = _clamp(
        _dot(na, nb),
        -1.0,
        1.0,
    )

    return math.acos(dot)


# ============================================================
# HAND TRACKER
# ============================================================

class HandTracker:

    def __init__(
        self,
        camera_index: int = 0,
        width: int = 640,
        height: int = 480,
        target_fps: int = 30,
    ) -> None:

        self.camera_index = camera_index

        self.width = width
        self.height = height

        self.target_fps = target_fps

        # ----------------------------------------------------
        # MODEL PATH
        # ----------------------------------------------------

        # hand_tracking.py
        # is located at:
        #
        # C:\NEXUS\nexus-brain\hand_tracking.py
        #
        # model:
        #
        # C:\NEXUS\nexus-brain\models\hand_landmarker.task

        self.model_path = (
            Path(__file__).resolve().parent
            / "models"
            / "hand_landmarker.task"
        )

        if not self.model_path.exists():

            raise FileNotFoundError(
                "MediaPipe hand model not found:\n"
                f"{self.model_path}"
            )

        # ----------------------------------------------------
        # THREADING
        # ----------------------------------------------------

        self._lock = threading.Lock()

        self._running = False

        self._thread: (
            threading.Thread | None
        ) = None

        # ----------------------------------------------------
        # CAMERA
        # ----------------------------------------------------

        self._camera: (
            cv2.VideoCapture | None
        ) = None

        # ----------------------------------------------------
        # MEDIAPIPE
        # ----------------------------------------------------

        self._landmarker: (
            vision.HandLandmarker | None
        ) = None

        self._latest_timestamp_ms = 0

        # ----------------------------------------------------
        # LATEST HAND STATE
        # ----------------------------------------------------

        self._state: dict[str, Any] = {

            "detected": False,

            "handedness": "Unknown",

            "tracking_confidence": 0.0,

            "landmarks": [],

            "palm": {
                "x": 0.5,
                "y": 0.5,
                "z": 0.0,
            },

            "position": {
                "x": 0.5,
                "y": 0.5,
                "z": 0.0,
            },

            "orientation": {
                "yaw": 0.0,
                "pitch": 0.0,
                "roll": 0.0,
            },

            "depth": 0.0,

            "relative_z": 0.0,

            "pinch": False,

            "pinch_strength": 0.0,

            "openness": 0.0,

            "fist": False,

            "open_hand": False,

            "pointing": False,

            "peace": False,

            "thumbs_up": False,

            "timestamp": 0,
        }

    # ========================================================
    # START
    # ========================================================

    def start(self) -> None:

        if self._running:
            return

        print(
            "🖐️ Starting MediaPipe HandTracker..."
        )

        # ----------------------------------------------------
        # MEDIAPIPE OPTIONS
        # ----------------------------------------------------

        base_options = python.BaseOptions(
            model_asset_path=str(
                self.model_path
            )
        )

        options = (
            vision.HandLandmarkerOptions(
                base_options=base_options,

                running_mode=(
                    vision.RunningMode.LIVE_STREAM
                ),

                num_hands=1,

                min_hand_detection_confidence=0.50,

                min_hand_presence_confidence=0.50,

                min_tracking_confidence=0.55,

                result_callback=self._on_result,
            )
        )

        self._landmarker = (
            vision.HandLandmarker.create_from_options(
                options
            )
        )

        # ----------------------------------------------------
        # OPEN CAMERA
        # ----------------------------------------------------

        self._camera = cv2.VideoCapture(
            self.camera_index
        )

        if not self._camera.isOpened():

            if self._landmarker is not None:

                self._landmarker.close()

                self._landmarker = None

            raise RuntimeError(
                "Could not open webcam."
            )

        # ----------------------------------------------------
        # CAMERA CONFIG
        # ----------------------------------------------------

        self._camera.set(
            cv2.CAP_PROP_FRAME_WIDTH,
            self.width,
        )

        self._camera.set(
            cv2.CAP_PROP_FRAME_HEIGHT,
            self.height,
        )

        self._camera.set(
            cv2.CAP_PROP_FPS,
            self.target_fps,
        )

        self._camera.set(
            cv2.CAP_PROP_BUFFERSIZE,
            1,
        )

        # ----------------------------------------------------
        # START THREAD
        # ----------------------------------------------------

        self._running = True

        self._thread = threading.Thread(
            target=self._capture_loop,
            daemon=True,
            name="MediaPipeHandTracker",
        )

        self._thread.start()

        print(
            "🖐️ Hand tracker started."
        )

    # ========================================================
    # CAMERA LOOP
    # ========================================================

    def _capture_loop(self) -> None:

        camera = self._camera

        if camera is None:
            return

        frame_interval = (
            1.0 /
            max(
                1,
                self.target_fps,
            )
        )

        while self._running:

            loop_start = (
                time.perf_counter()
            )

            # ------------------------------------------------
            # READ FRAME
            # ------------------------------------------------

            ok, frame = camera.read()

            if not ok:

                time.sleep(
                    0.01
                )

                continue

            # ------------------------------------------------
            # MIRROR CAMERA
            # ------------------------------------------------

            frame = cv2.flip(
                frame,
                1,
            )

            # ------------------------------------------------
            # BGR -> RGB
            # ------------------------------------------------

            rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            # ------------------------------------------------
            # MEDIAPIPE IMAGE
            # ------------------------------------------------

            mp_image = mp.Image(
                image_format=(
                    mp.ImageFormat.SRGB
                ),
                data=rgb,
            )

            # ------------------------------------------------
            # TIMESTAMP
            # ------------------------------------------------

            timestamp_ms = int(
                time.monotonic() *
                1000
            )

            if (
                timestamp_ms <=
                self._latest_timestamp_ms
            ):

                timestamp_ms = (
                    self._latest_timestamp_ms
                    + 1
                )

            self._latest_timestamp_ms = (
                timestamp_ms
            )

            # ------------------------------------------------
            # MEDIAPIPE ASYNC INFERENCE
            # ------------------------------------------------

            try:

                landmarker = (
                    self._landmarker
                )

                if landmarker is not None:

                    landmarker.detect_async(
                        mp_image,
                        timestamp_ms,
                    )

            except Exception as error:

                print(
                    "⚠️ MediaPipe error:",
                    error,
                )

            # ------------------------------------------------
            # FPS CONTROL
            # ------------------------------------------------

            elapsed = (
                time.perf_counter()
                - loop_start
            )

            sleep_time = (
                frame_interval
                - elapsed
            )

            if sleep_time > 0:

                time.sleep(
                    sleep_time
                )

    # ========================================================
    # MEDIAPIPE RESULT CALLBACK
    # ========================================================

    def _on_result(
        self,
        result: vision.HandLandmarkerResult,
        output_image: mp.Image,
        timestamp_ms: int,
    ) -> None:

        # ----------------------------------------------------
        # NO HAND
        # ----------------------------------------------------

        if not result.hand_landmarks:

            with self._lock:

                self._state[
                    "detected"
                ] = False

                self._state[
                    "landmarks"
                ] = []

                self._state[
                    "tracking_confidence"
                ] = 0.0

            return

        # ----------------------------------------------------
        # FIRST HAND
        # ----------------------------------------------------

        hand_landmarks = (
            result.hand_landmarks[0]
        )

        if len(hand_landmarks) < 21:

            return

        # ====================================================
        # HANDEDNESS
        # ====================================================

        handedness = "Unknown"

        if result.handedness:

            if result.handedness[0]:

                category = (
                    result.handedness[0][0]
                )

                display_name = (
                    getattr(
                        category,
                        "display_name",
                        None,
                    )
                    or ""
                )

                category_name = (
                    getattr(
                        category,
                        "category_name",
                        None,
                    )
                    or ""
                )

                handedness = (
                    display_name
                    or category_name
                    or "Unknown"
                )

        # ====================================================
        # LANDMARK DATA
        # ====================================================

        landmarks: list[
            dict[str, Any]
        ] = []

        for index, point in enumerate(
            hand_landmarks
        ):

            # ------------------------------------------------
            # IMPORTANT:
            #
            # MediaPipe may return None
            # for visibility.
            #
            # Never directly call:
            #
            # float(None)
            #
            # ------------------------------------------------

            visibility_value = (
                getattr(
                    point,
                    "visibility",
                    None,
                )
            )

            try:

                if visibility_value is None:

                    visibility = 1.0

                else:

                    visibility = float(
                        visibility_value
                    )

            except (
                TypeError,
                ValueError,
            ):

                visibility = 1.0

            visibility = _clamp(
                visibility,
                0.0,
                1.0,
            )

            landmarks.append(
                {
                    "id": index,

                    "name": (
                        LANDMARK_NAMES[index]
                    ),

                    "x": float(
                        point.x
                    ),

                    "y": float(
                        point.y
                    ),

                    "z": float(
                        point.z
                    ),

                    "visibility": (
                        visibility
                    ),
                }
            )

        # ====================================================
        # LANDMARK REFERENCES
        # ====================================================

        wrist = hand_landmarks[0]

        thumb_cmc = hand_landmarks[1]

        thumb_mcp = hand_landmarks[2]

        thumb_ip = hand_landmarks[3]

        thumb_tip = hand_landmarks[4]

        index_mcp = hand_landmarks[5]

        index_pip = hand_landmarks[6]

        index_dip = hand_landmarks[7]

        index_tip = hand_landmarks[8]

        middle_mcp = hand_landmarks[9]

        middle_pip = hand_landmarks[10]

        middle_dip = hand_landmarks[11]

        middle_tip = hand_landmarks[12]

        ring_mcp = hand_landmarks[13]

        ring_pip = hand_landmarks[14]

        ring_dip = hand_landmarks[15]

        ring_tip = hand_landmarks[16]

        pinky_mcp = hand_landmarks[17]

        pinky_pip = hand_landmarks[18]

        pinky_dip = hand_landmarks[19]

        pinky_tip = hand_landmarks[20]

        # ====================================================
        # PALM CENTER
        # ====================================================

        palm_points = [
            wrist,
            index_mcp,
            middle_mcp,
            ring_mcp,
            pinky_mcp,
        ]

        palm_x = sum(
            float(point.x)
            for point in palm_points
        ) / len(palm_points)

        palm_y = sum(
            float(point.y)
            for point in palm_points
        ) / len(palm_points)

        palm_z = sum(
            float(point.z)
            for point in palm_points
        ) / len(palm_points)

        # ====================================================
        # PALM ORIENTATION
        # ====================================================

        wrist_to_middle = _normalize(
            _vector(
                wrist,
                middle_mcp,
            )
        )

        index_to_pinky = _normalize(
            _vector(
                index_mcp,
                pinky_mcp,
            )
        )

        palm_normal = _normalize(
            _cross(
                wrist_to_middle,
                index_to_pinky,
            )
        )

        nx, ny, nz = palm_normal

        fx, fy, fz = wrist_to_middle

        sx, sy, sz = index_to_pinky

        # ----------------------------------------------------
        # YAW
        # ----------------------------------------------------

        yaw = math.atan2(
            nx,
            max(
                0.001,
                abs(nz),
            ),
        )

        # ----------------------------------------------------
        # PITCH
        # ----------------------------------------------------

        pitch = math.atan2(
            fy,
            math.sqrt(
                fx * fx +
                fz * fz,
            ),
        )

        # ----------------------------------------------------
        # ROLL
        # ----------------------------------------------------

        roll = math.atan2(
            sy,
            sx,
        )

        # ====================================================
        # DEPTH
        # ====================================================

        depth = _clamp(
            -palm_z,
            -1.0,
            1.0,
        )

        # ====================================================
        # PINCH
        # ====================================================

        pinch_distance = _distance(
            thumb_tip,
            index_tip,
        )

        pinch_threshold = 0.065

        pinch = (
            pinch_distance
            < pinch_threshold
        )

        # ----------------------------------------------------
        # PINCH STRENGTH
        # ----------------------------------------------------

        pinch_strength = 1.0 - _clamp(
            pinch_distance /
            max(
                pinch_threshold * 2.0,
                0.001,
            ),
            0.0,
            1.0,
        )

        # ====================================================
        # FINGER EXTENSION
        # ====================================================

        def finger_extension(
            mcp: Any,
            pip: Any,
            dip: Any,
            tip: Any,
        ) -> float:

            upper = _vector(
                mcp,
                pip,
            )

            middle = _vector(
                pip,
                dip,
            )

            lower = _vector(
                dip,
                tip,
            )

            angle_1 = _angle_between(
                upper,
                middle,
            )

            angle_2 = _angle_between(
                middle,
                lower,
            )

            total_angle = (
                angle_1 +
                angle_2
            )

            # Smaller bend = more extended.
            extension = 1.0 - _clamp(
                total_angle /
                math.pi,
                0.0,
                1.0,
            )

            return extension

        index_extension = (
            finger_extension(
                index_mcp,
                index_pip,
                index_dip,
                index_tip,
            )
        )

        middle_extension = (
            finger_extension(
                middle_mcp,
                middle_pip,
                middle_dip,
                middle_tip,
            )
        )

        ring_extension = (
            finger_extension(
                ring_mcp,
                ring_pip,
                ring_dip,
                ring_tip,
            )
        )

        pinky_extension = (
            finger_extension(
                pinky_mcp,
                pinky_pip,
                pinky_dip,
                pinky_tip,
            )
        )

        # ====================================================
        # HAND OPENNESS
        # ====================================================

        openness = (
            index_extension +
            middle_extension +
            ring_extension +
            pinky_extension
        ) / 4.0

        openness = _clamp(
            openness,
            0.0,
            1.0,
        )

        # ====================================================
        # FIST
        # ====================================================

        fist = (
            openness < 0.25
            and not pinch
        )

        # ====================================================
        # OPEN HAND
        # ====================================================

        open_hand = (
            openness > 0.72
        )

        # ====================================================
        # POINTING
        # ====================================================

        pointing = (
            index_extension > 0.70
            and middle_extension < 0.45
            and ring_extension < 0.45
            and pinky_extension < 0.45
        )

        # ====================================================
        # PEACE SIGN
        # ====================================================

        peace = (
            index_extension > 0.70
            and middle_extension > 0.70
            and ring_extension < 0.45
            and pinky_extension < 0.45
        )

        # ====================================================
        # THUMBS UP
        # ====================================================

        thumb_up_distance = (
            float(thumb_tip.y)
            -
            float(thumb_mcp.y)
        )

        thumbs_up = (
            thumb_up_distance < -0.08
            and middle_extension < 0.45
            and ring_extension < 0.45
            and pinky_extension < 0.45
        )

        # ====================================================
        # TRACKING CONFIDENCE
        # ====================================================

        tracking_confidence = 1.0

        if result.handedness:

            if result.handedness[0]:

                score = getattr(
                    result.handedness[0][0],
                    "score",
                    None,
                )

                try:

                    if score is not None:

                        tracking_confidence = float(
                            score
                        )

                except (
                    TypeError,
                    ValueError,
                ):

                    tracking_confidence = 1.0

        tracking_confidence = _clamp(
            tracking_confidence,
            0.0,
            1.0,
        )

        # ====================================================
        # COMPLETE STATE
        # ====================================================

        state = {

            "detected": True,

            "handedness": handedness,

            "tracking_confidence": (
                tracking_confidence
            ),

            "landmarks": landmarks,

            "palm": {
                "x": float(palm_x),
                "y": float(palm_y),
                "z": float(palm_z),
            },

            "position": {
                "x": float(palm_x),
                "y": float(palm_y),
                "z": float(palm_z),
            },

            "orientation": {
                "yaw": float(yaw),
                "pitch": float(pitch),
                "roll": float(roll),
            },

            "depth": float(depth),

            "relative_z": float(
                palm_z
            ),

            "pinch": bool(
                pinch
            ),

            "pinch_strength": float(
                pinch_strength
            ),

            "openness": float(
                openness
            ),

            "fist": bool(
                fist
            ),

            "open_hand": bool(
                open_hand
            ),

            "pointing": bool(
                pointing
            ),

            "peace": bool(
                peace
            ),

            "thumbs_up": bool(
                thumbs_up
            ),

            "timestamp": int(
                timestamp_ms
            ),
        }

        # ====================================================
        # THREAD-SAFE UPDATE
        # ====================================================

        with self._lock:

            self._state = state

    # ========================================================
    # GET CURRENT STATE
    # ========================================================

    def get_state(
        self,
    ) -> dict[str, Any]:

        with self._lock:

            state = self._state

            return {

                **state,

                "palm": {
                    **state["palm"],
                },

                "position": {
                    **state["position"],
                },

                "orientation": {
                    **state["orientation"],
                },

                "landmarks": [
                    {
                        **landmark
                    }

                    for landmark
                    in state["landmarks"]
                ],
            }

    # ========================================================
    # STOP
    # ========================================================

    def stop(self) -> None:

        if not self._running:
            return

        print(
            "🖐️ Stopping hand tracker..."
        )

        # ----------------------------------------------------
        # STOP CAPTURE LOOP
        # ----------------------------------------------------

        self._running = False

        # ----------------------------------------------------
        # WAIT FOR THREAD
        # ----------------------------------------------------

        if self._thread is not None:

            self._thread.join(
                timeout=2.0
            )

            self._thread = None

        # ----------------------------------------------------
        # RELEASE CAMERA
        # ----------------------------------------------------

        if self._camera is not None:

            try:
                self._camera.release()

            except Exception:
                pass

            self._camera = None

        # ----------------------------------------------------
        # CLOSE MEDIAPIPE
        # ----------------------------------------------------

        if self._landmarker is not None:

            try:

                self._landmarker.close()

            except Exception:
                pass

            self._landmarker = None

        # ----------------------------------------------------
        # RESET STATE
        # ----------------------------------------------------

        with self._lock:

            self._state = {

                "detected": False,

                "handedness": "Unknown",

                "tracking_confidence": 0.0,

                "landmarks": [],

                "palm": {
                    "x": 0.5,
                    "y": 0.5,
                    "z": 0.0,
                },

                "position": {
                    "x": 0.5,
                    "y": 0.5,
                    "z": 0.0,
                },

                "orientation": {
                    "yaw": 0.0,
                    "pitch": 0.0,
                    "roll": 0.0,
                },

                "depth": 0.0,

                "relative_z": 0.0,

                "pinch": False,

                "pinch_strength": 0.0,

                "openness": 0.0,

                "fist": False,

                "open_hand": False,

                "pointing": False,

                "peace": False,

                "thumbs_up": False,

                "timestamp": 0,
            }

        print(
            "🖐️ Hand tracker stopped."
        )