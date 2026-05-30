import { useRef, useEffect } from 'react';
import useMediaPipe from '../hooks/useMediaPipe';

const WebcamCapture = ({ onLandmarks, isActive = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { isLoading, error, isHandDetected } = useMediaPipe(
    videoRef,
    canvasRef,
    isActive ? onLandmarks : null
  );

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Hidden video element for camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: "none" }}
      />

      {/* Canvas for displaying processed video with landmarks */}
      <div className="relative rounded-xl overflow-hidden shadow-xl bg-gray-900">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-auto"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
{error && (
  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
    <div className="text-center text-white p-6 max-w-sm">
      {/* Combined error sentence */}
      <p className="text-base font-medium mb-4">
        ⚠️Camera access was denied. Please grant camera permission to continue.
      </p>

      {/* Guidance */}
      <div className="text-sm text-gray-200 space-y-1">
        <p>👋
         Position your hand clearly in the camera frame.</p>
      </div>
    </div>
  </div>
)}


        
      </div>
    </div>
  );
};

export default WebcamCapture;
