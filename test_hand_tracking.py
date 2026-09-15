import time

from hand_tracking import HandTracker


def main() -> None:
    print("🖐️ Starting MediaPipe hand tracker...")

    tracker = HandTracker(
        camera_index=0,
        width=640,
        height=480,
        target_fps=30,
    )

    try:
        tracker.start()

        while True:
            state = tracker.get_state()

            if state["detected"]:
                position = state["position"]
                orientation = state["orientation"]

                print(
                    "🖐️ Hand detected | "
                    f"{state['handedness']} | "
                    f"landmarks={len(state['landmarks'])} | "
                    f"position=("
                    f"{position['x']:.2f}, "
                    f"{position['y']:.2f}, "
                    f"{position['z']:.2f}"
                    f") | "
                    f"yaw={orientation['yaw']:.2f} | "
                    f"pitch={orientation['pitch']:.2f} | "
                    f"roll={orientation['roll']:.2f}"
                )
            else:
                print("🔎 No hand detected")

            time.sleep(0.25)

    except KeyboardInterrupt:
        print("\nStopping tracker...")

    finally:
        tracker.stop()


if __name__ == "__main__":
    main()