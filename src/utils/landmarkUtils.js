// Hand landmark processing utilities

// Number of landmarks per hand (MediaPipe Hands returns 21 landmarks)
export const NUM_LANDMARKS = 21;
// Each landmark has x, y, z coordinates
export const LANDMARK_DIMENSIONS = 3;
// Total features per frame
export const FEATURES_PER_FRAME = NUM_LANDMARKS * LANDMARK_DIMENSIONS; // 63

// Number of frames to buffer for sequence model
export const SEQUENCE_LENGTH = 30;

/**
 * Extract landmark coordinates from MediaPipe hand results
 * @param {Object} handLandmarks - MediaPipe hand landmarks
 * @returns {number[]} Flattened array of [x, y, z] coordinates
 */
export const extractLandmarks = (handLandmarks) => {
  if (!handLandmarks || handLandmarks.length === 0) {
    return null;
  }

  const landmarks = [];
  for (const landmark of handLandmarks) {
    landmarks.push(landmark.x, landmark.y, landmark.z);
  }
  return landmarks;
};

/**
 * Normalize landmarks relative to wrist position and hand size
 * @param {number[]} landmarks - Flattened landmark coordinates
 * @returns {number[]} Normalized landmarks
 */
export const normalizeLandmarks = (landmarks) => {
  if (!landmarks || landmarks.length !== FEATURES_PER_FRAME) {
    return null;
  }

  // Get wrist position (first landmark)
  const wristX = landmarks[0];
  const wristY = landmarks[1];
  const wristZ = landmarks[2];

  // Calculate bounding box for scale normalization
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < landmarks.length; i += 3) {
    minX = Math.min(minX, landmarks[i]);
    maxX = Math.max(maxX, landmarks[i]);
    minY = Math.min(minY, landmarks[i + 1]);
    maxY = Math.max(maxY, landmarks[i + 1]);
  }

  const scaleX = maxX - minX || 1;
  const scaleY = maxY - minY || 1;
  const scale = Math.max(scaleX, scaleY);

  // Normalize: center on wrist, scale to unit size
  const normalized = [];
  for (let i = 0; i < landmarks.length; i += 3) {
    normalized.push(
      (landmarks[i] - wristX) / scale,
      (landmarks[i + 1] - wristY) / scale,
      (landmarks[i + 2] - wristZ) / scale
    );
  }

  return normalized;
};

/**
 * Create a zero-padded frame buffer
 * @param {number} sequenceLength - Number of frames in sequence
 * @returns {number[][]} Empty frame buffer
 */
export const createFrameBuffer = (sequenceLength = SEQUENCE_LENGTH) => {
  return Array(sequenceLength).fill(null).map(() =>
    Array(FEATURES_PER_FRAME).fill(0)
  );
};

/**
 * Add a frame to the buffer (FIFO)
 * @param {number[][]} buffer - Current frame buffer
 * @param {number[]} frame - New frame to add
 * @returns {number[][]} Updated buffer
 */
export const addFrameToBuffer = (buffer, frame) => {
  const newBuffer = [...buffer.slice(1), frame];
  return newBuffer;
};

/**
 * Convert buffer to tensor-ready format
 * @param {number[][]} buffer - Frame buffer
 * @returns {number[][][]} Tensor-ready array [1, sequenceLength, features]
 */
export const bufferToTensorInput = (buffer) => {
  return [buffer];
};
