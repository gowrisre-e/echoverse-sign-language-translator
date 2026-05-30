import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { extractLandmarks, normalizeLandmarks } from '../utils/landmarkUtils';

export const useMediaPipe = (videoRef, canvasRef, onLandmarks) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    const { width, height } = canvasRef.current;

    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);

    // Draw camera image
    canvasCtx.drawImage(results.image, 0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setIsHandDetected(true);

      // Draw hand landmarks
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections
        drawConnectors(canvasCtx, landmarks, width, height);
        // Draw landmarks
        drawLandmarks(canvasCtx, landmarks, width, height);
      }

      // Process first detected hand
      const handLandmarks = results.multiHandLandmarks[0];
      const extracted = extractLandmarks(handLandmarks);
      const normalized = normalizeLandmarks(extracted);

      if (normalized && onLandmarks) {
        onLandmarks(normalized);
      }
    } else {
      setIsHandDetected(false);
      if (onLandmarks) {
        onLandmarks(null);
      }
    }

    canvasCtx.restore();
  }, [canvasRef, onLandmarks]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const initMediaPipe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize MediaPipe Hands
        handsRef.current = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        handsRef.current.onResults(onResults);

        // Initialize camera
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        await cameraRef.current.start();
        setIsLoading(false);
      } catch (err) {
        console.error('MediaPipe initialization error:', err);
        setError(err.message || 'Failed to initialize camera');
        setIsLoading(false);
      }
    };

    initMediaPipe();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [videoRef, canvasRef, onResults]);

  return { isLoading, error, isHandDetected };
};

// Helper function to draw landmark connections
const drawConnectors = (ctx, landmarks, width, height) => {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17] // Palm
  ];

  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;

  for (const [start, end] of connections) {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];

    ctx.beginPath();
    ctx.moveTo(startPoint.x * width, startPoint.y * height);
    ctx.lineTo(endPoint.x * width, endPoint.y * height);
    ctx.stroke();
  }
};

// Helper function to draw landmarks
const drawLandmarks = (ctx, landmarks, width, height) => {
  ctx.fillStyle = '#FF0000';

  for (const landmark of landmarks) {
    ctx.beginPath();
    ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
};

export default useMediaPipe;
