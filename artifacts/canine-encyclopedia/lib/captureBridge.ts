// Router params in Expo Router are string-only and not meant for large
// payloads, so a captured photo's base64 data can't travel back from
// camera-capture.tsx to the screen that opened it via router params alone.
// This tiny module-level bridge holds a single pending "resolve" callback
// instead — the caller registers it right before navigating to the camera
// screen, and the camera screen calls it once a photo is captured (or the
// user cancels), then clears itself.
export type CaptureResult = { uri: string; base64: string; mimeType: string } | null;

let pendingResolve: ((result: CaptureResult) => void) | null = null;

export function waitForCapture(): Promise<CaptureResult> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}

export function resolveCapture(result: CaptureResult) {
  if (pendingResolve) {
    pendingResolve(result);
    pendingResolve = null;
  }
}
