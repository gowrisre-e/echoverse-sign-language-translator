import { useState, useRef, useCallback, useEffect } from 'react';
import WebcamCapture from './WebcamCapture';
import { GESTURE_LABELS, NUM_CLASSES } from '../data/gestures';
import { SEQUENCE_LENGTH, FEATURES_PER_FRAME, createFrameBuffer, addFrameToBuffer } from '../utils/landmarkUtils';
import { trainModel, resetModel } from '../model/train';
import * as tf from '@tensorflow/tfjs';

const MIN_SAMPLES_PER_CLASS = 5;
const RECORDING_FRAMES = SEQUENCE_LENGTH;

const TrainingPanel = () => {
  const [selectedGesture, setSelectedGesture] = useState('A');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [trainingData, setTrainingData] = useState(() => {
    // Initialize with empty arrays for each gesture
    const initial = {};
    GESTURE_LABELS.forEach(label => {
      initial[label] = [];
    });
    return initial;
  });
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [modelStatus, setModelStatus] = useState('not_trained');
  const [message, setMessage] = useState(null);

  const frameBufferRef = useRef(createFrameBuffer());
  const frameCountRef = useRef(0);
  const recordingRef = useRef(false);

  // Check if model exists
  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const model = await tf.loadLayersModel('indexeddb://echoverse-gesture-model');
      if (model) {
        setModelStatus('trained');
        model.dispose();
      }
    } catch {
      setModelStatus('not_trained');
    }
  };

  // Handle incoming landmarks during recording
  const handleLandmarks = useCallback((landmarks) => {
    if (!recordingRef.current) return;

    if (landmarks) {
      frameBufferRef.current = addFrameToBuffer(frameBufferRef.current, landmarks);
    } else {
      // No hand detected - add zero frame
      const emptyFrame = Array(FEATURES_PER_FRAME).fill(0);
      frameBufferRef.current = addFrameToBuffer(frameBufferRef.current, emptyFrame);
    }

    frameCountRef.current++;
    setRecordingProgress(Math.min(100, (frameCountRef.current / RECORDING_FRAMES) * 100));

    // Check if recording is complete
    if (frameCountRef.current >= RECORDING_FRAMES) {
      finishRecording();
    }
  }, [selectedGesture]);

  // Start recording
  const startRecording = () => {
    frameBufferRef.current = createFrameBuffer();
    frameCountRef.current = 0;
    recordingRef.current = true;
    setIsRecording(true);
    setRecordingProgress(0);
    setMessage(null);
  };

  // Finish recording
  const finishRecording = () => {
    recordingRef.current = false;
    setIsRecording(false);

    // Save the recorded sequence
    const sequence = [...frameBufferRef.current];
    setTrainingData(prev => ({
      ...prev,
      [selectedGesture]: [...prev[selectedGesture], sequence]
    }));

    setMessage({ type: 'success', text: `Sample recorded for "${selectedGesture}"` });
  };

  // Delete a sample
  const deleteSample = (gesture, index) => {
    setTrainingData(prev => ({
      ...prev,
      [gesture]: prev[gesture].filter((_, i) => i !== index)
    }));
  };

  // Clear all samples for a gesture
  const clearGestureSamples = (gesture) => {
    if (window.confirm(`Clear all samples for "${gesture}"?`)) {
      setTrainingData(prev => ({
        ...prev,
        [gesture]: []
      }));
    }
  };

  // Get total sample count
  const getTotalSamples = () => {
    return Object.values(trainingData).reduce((sum, arr) => sum + arr.length, 0);
  };

  // Get gestures with enough samples
  const getReadyGestures = () => {
    return Object.entries(trainingData)
      .filter(([_, samples]) => samples.length >= MIN_SAMPLES_PER_CLASS)
      .map(([label]) => label);
  };

  // Train model
  const handleTrain = async () => {
    const readyGestures = getReadyGestures();

    if (readyGestures.length < 2) {
      setMessage({
        type: 'error',
        text: `Need at least 2 gestures with ${MIN_SAMPLES_PER_CLASS}+ samples each to train.`
      });
      return;
    }

    // Filter training data to only include ready gestures
    const filteredData = {};
    readyGestures.forEach(gesture => {
      filteredData[gesture] = trainingData[gesture];
    });

    setIsTraining(true);
    setMessage({ type: 'info', text: 'Training started...' });

    try {
      await trainModel(
        filteredData,
        { epochs: 30, batchSize: 16 },
        (progress) => {
          setTrainingProgress(progress);
        }
      );

      setModelStatus('trained');
      setMessage({ type: 'success', text: 'Model trained successfully! Go to Translate tab to use it.' });
    } catch (error) {
      console.error('Training error:', error);
      setMessage({ type: 'error', text: `Training failed: ${error.message}` });
    } finally {
      setIsTraining(false);
      setTrainingProgress(null);
    }
  };

  // Reset model
  const handleReset = async () => {
    if (window.confirm('Delete the trained model? You will need to train again.')) {
      await resetModel();
      setModelStatus('not_trained');
      setMessage({ type: 'info', text: 'Model deleted.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className={`rounded-xl p-4 ${
        modelStatus === 'trained'
          ? 'bg-green-50 border border-green-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{modelStatus === 'trained' ? '✅' : '🧠'}</span>
            <div>
              <h3 className="font-semibold">
                {modelStatus === 'trained' ? 'Model Trained' : 'Model Not Trained'}
              </h3>
              <p className="text-sm text-gray-600">
                {modelStatus === 'trained'
                  ? 'Ready to recognize gestures'
                  : 'Collect training data and train the model'
                }
              </p>
            </div>
          </div>
          {modelStatus === 'trained' && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              Reset Model
            </button>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Camera and recording */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Record Training Data</h3>

            {/* Gesture selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Gesture to Record
              </label>
              <select
                value={selectedGesture}
                onChange={(e) => setSelectedGesture(e.target.value)}
                disabled={isRecording || isTraining}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {GESTURE_LABELS.map(label => (
                  <option key={label} value={label}>
                    {label} ({trainingData[label]?.length || 0} samples)
                  </option>
                ))}
              </select>
            </div>

            {/* Recording progress */}
            {isRecording && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Recording...</span>
                  <span>{Math.round(recordingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${recordingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Record button */}
            <button
              onClick={startRecording}
              disabled={isRecording || isTraining}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-50`}
            >
              {isRecording ? '🔴 Recording...' : '⏺️ Record Sample'}
            </button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Hold the sign steady while recording (~1 second)
            </p>
          </div>

          {/* Webcam */}
          <WebcamCapture onLandmarks={handleLandmarks} isActive={true} />
        </div>

        {/* Right: Training status and controls */}
        <div className="space-y-4">
          {/* Training data summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Training Data Summary</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-indigo-600">{getTotalSamples()}</div>
                <div className="text-sm text-gray-600">Total Samples</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{getReadyGestures().length}</div>
                <div className="text-sm text-gray-600">Ready Gestures</div>
              </div>
            </div>

            {/* Gesture sample counts */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {GESTURE_LABELS.map(label => {
                const count = trainingData[label]?.length || 0;
                const isReady = count >= MIN_SAMPLES_PER_CLASS;
                return (
                  <div
                    key={label}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      selectedGesture === label ? 'bg-indigo-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-medium ${
                        isReady ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {label.length === 1 ? label : label[0]}
                      </span>
                      <span className="text-sm">{label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${isReady ? 'text-green-600' : 'text-gray-500'}`}>
                        {count}/{MIN_SAMPLES_PER_CLASS}
                      </span>
                      {count > 0 && (
                        <button
                          onClick={() => clearGestureSamples(label)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Train button */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Train Model</h3>

            {isTraining && trainingProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Epoch {trainingProgress.epoch}/{trainingProgress.totalEpochs}</span>
                  <span>Accuracy: {(trainingProgress.valAccuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleTrain}
              disabled={isTraining || getReadyGestures().length < 2}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? '🔄 Training...' : '🚀 Train Model'}
            </button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Need at least 2 gestures with {MIN_SAMPLES_PER_CLASS}+ samples each
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Tips for Better Training</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Record 10-20 samples per gesture for best results</li>
              <li>• Vary your hand position and angle slightly</li>
              <li>• Ensure good lighting on your hand</li>
              <li>• Keep your hand clearly visible in frame</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPanel;
