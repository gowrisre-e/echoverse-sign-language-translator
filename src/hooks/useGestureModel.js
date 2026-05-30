import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { SEQUENCE_LENGTH, FEATURES_PER_FRAME, createFrameBuffer, addFrameToBuffer } from '../utils/landmarkUtils';
import { INDEX_TO_LABEL, NUM_CLASSES } from '../data/gestures';

export const useGestureModel = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelSource, setModelSource] = useState(null); // 'pretrained', 'custom', or null
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);

  const modelRef = useRef(null);
  const frameBufferRef = useRef(createFrameBuffer());
  const frameCountRef = useRef(0);
  const lastPredictionRef = useRef(null);
  const predictionCountRef = useRef(0);

  // Load or create model
  const loadModel = useCallback(async () => {
    try {
      setIsModelLoading(true);
      setError(null);

      // First, try to load pre-trained model from public folder (trained on ASL dataset)
      try {
        console.log('Attempting to load pre-trained model from /model/model.json...');
        modelRef.current = await tf.loadLayersModel('/model/model.json');
        console.log('Pre-trained model loaded successfully!');
        console.log('Model input shape:', modelRef.current.inputs[0].shape);
        console.log('Model output shape:', modelRef.current.outputs[0].shape);
        setIsModelLoaded(true);
        setModelSource('pretrained');
        return;
      } catch (pretrainedError) {
        console.log('Failed to load pre-trained model:', pretrainedError.message);
      }

      // Fallback: Try to load custom model from IndexedDB (trained in browser)
      try {
        console.log('Attempting to load custom model from IndexedDB...');
        modelRef.current = await tf.loadLayersModel('indexeddb://echoverse-gesture-model');
        console.log('Custom model loaded from IndexedDB');
        setIsModelLoaded(true);
        setModelSource('custom');
        return;
      } catch (indexedDbError) {
        console.log('No custom model found in IndexedDB:', indexedDbError.message);
      }

      // No model found
      console.log('No model available. Please train the model or add a pre-trained model.');
      setIsModelLoaded(false);
      setModelSource(null);
    } catch (err) {
      console.error('Error loading model:', err);
      setError(err.message);
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  // Process incoming landmarks
  const processLandmarks = useCallback((landmarks) => {
    if (!landmarks) {
      // No hand detected - might be "NOTHING" gesture
      const emptyFrame = Array(FEATURES_PER_FRAME).fill(0);
      frameBufferRef.current = addFrameToBuffer(frameBufferRef.current, emptyFrame);
      frameCountRef.current++;
      return;
    }

    // Add normalized landmarks to buffer
    frameBufferRef.current = addFrameToBuffer(frameBufferRef.current, landmarks);
    frameCountRef.current++;

    // Run prediction every 15 frames (0.5 seconds at 30fps)
    if (frameCountRef.current >= 15 && modelRef.current) {
      runPrediction();
      frameCountRef.current = 0;
    }
  }, []);

  // Run inference
  const runPrediction = useCallback(async () => {
    if (!modelRef.current) return;

    try {
      const inputTensor = tf.tensor3d([frameBufferRef.current]);
      const output = modelRef.current.predict(inputTensor);
      const probabilities = await output.data();

      // Get top prediction
      let maxIdx = 0;
      let maxProb = probabilities[0];
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          maxIdx = i;
        }
      }

      const predictedLabel = INDEX_TO_LABEL[maxIdx];
      const conf = maxProb;

      // Debounce: require same prediction 2 times in a row with high confidence
      if (predictedLabel === lastPredictionRef.current && conf > 0.7) {
        predictionCountRef.current++;
        if (predictionCountRef.current >= 2) {
          setPrediction(predictedLabel);
          setConfidence(conf);
          predictionCountRef.current = 0;
        }
      } else {
        lastPredictionRef.current = predictedLabel;
        predictionCountRef.current = 1;
      }

      // Cleanup tensors
      inputTensor.dispose();
      output.dispose();
    } catch (err) {
      console.error('Prediction error:', err);
    }
  }, []);

  // Clear prediction (after it's been processed)
  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setConfidence(0);
  }, []);

  // Reset buffer
  const resetBuffer = useCallback(() => {
    frameBufferRef.current = createFrameBuffer();
    frameCountRef.current = 0;
    lastPredictionRef.current = null;
    predictionCountRef.current = 0;
  }, []);

  // Load model on mount
  useEffect(() => {
    loadModel();

    return () => {
      if (modelRef.current) {
        modelRef.current.dispose();
      }
    };
  }, [loadModel]);

  return {
    isModelLoaded,
    isModelLoading,
    modelSource, // 'pretrained' or 'custom'
    prediction,
    confidence,
    error,
    processLandmarks,
    clearPrediction,
    resetBuffer,
    loadModel
  };
};

export default useGestureModel;
