import { useState, useCallback } from 'react';
import WebcamCapture from './WebcamCapture';
import TranslatorTextBox from "./TranslatorTextBox";
import useGestureModel from '../hooks/useGestureModel';

const SignRecognition = ({ onSave }) => {
  const [text, setText] = useState('');

  const {
    isModelLoaded,
    isModelLoading,
    prediction,
    confidence,
    error,
    processLandmarks,
    clearPrediction,
    resetBuffer
  } = useGestureModel();

  // ✅ DO NOT TOUCH – core detection
  const handleLandmarks = useCallback(
    (landmarks) => {
      processLandmarks(landmarks);
    },
    [processLandmarks]
  );

  const handleSave = (savedText) => {
    if (onSave) {
      onSave(savedText);
    }
    resetBuffer();
    clearPrediction();
  };

  return (
    <div className="translator-content space-y-8">

      {/* ================= MODEL STATUS ================= */}
      {!isModelLoaded && !isModelLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800">Model Not Trained</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please train the gesture recognition model before using the translator.
              </p>
            </div>
          </div>
        </div>
      )}

      {isModelLoading && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
          <p className="text-indigo-700">Loading model...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* ================= CAMERA ================= */}
      <div className="flex flex-col items-center">
        <div className="camera-wrapper">
          <WebcamCapture
            onLandmarks={handleLandmarks}
            isActive={isModelLoaded}
          />
        </div>

        
      </div>

      {/* ================= TEXT + SPEECH ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TranslatorTextBox
          prediction={prediction}
          confidence={confidence}
          text={text}
          setText={setText}
          onSave={handleSave}
        />
      </div>

    </div>
  );
};

export default SignRecognition;


