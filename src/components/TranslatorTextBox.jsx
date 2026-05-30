import { useState, useEffect } from "react";
import useSpeech from "../hooks/useSpeech";
import { correctSentence } from "../utils/aiSentence";

const TranslatorTextBox = ({
  prediction,
  confidence,
  text,
  setText,
  onSave,
  onTextChange,
}) => {
  const [lastPrediction, setLastPrediction] = useState(null);
  const [aiText, setAiText] = useState("");

  /* ================= SIGN → TEXT (UNCHANGED) ================= */
  useEffect(() => {
    if (!prediction || prediction === lastPrediction) return;

    setLastPrediction(prediction);

    if (prediction === "NOTHING") return;

    if (prediction === "SPACE") {
      setText((prev) => prev + " ");
    } else if (prediction === "DELETE") {
      setText((prev) => prev.slice(0, -1));
    } else {
      setText((prev) => prev + prediction);
    }
  }, [prediction, lastPrediction, setText]);

  useEffect(() => {
    if (onTextChange) onTextChange(text);
  }, [text, onTextChange]);

  /* ================= AI SENTENCE GENERATION ================= */
  useEffect(() => {
    const generateAIText = async () => {
      if (!text.trim()) {
        setAiText("");
        return;
      }

      const corrected = await correctSentence(text);
      setAiText(corrected);
    };

    generateAIText();
  }, [text]);

  /* ================= SPEECH HOOK ================= */
  const {
    isSpeaking,
    ttsEnabled,
    ttsSupported,
    speak,
    stopSpeaking,
    toggleTTS,
    isListening,
    transcript,
    sttSupported,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeech();

  /* ===== UPDATED SPEAK FUNCTION ===== */
  const handleSpeak = () => {
    const speechText =
      aiText && aiText.trim() !== "" ? aiText : text;

    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(speechText);
    }
  };

  const handleListen = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleUseTranscript = () => {
    if (transcript) {
      setText(transcript);
      clearTranscript();
    }
  };

  const handleClear = () => {
    setText("");
    setLastPrediction(null);
    setAiText("");
  };

  const handleSave = async () => {
    if (text.trim() && onSave) {
      const corrected = await correctSentence(text);
      onSave(corrected);
      setText("");
      setLastPrediction(null);
      setAiText("");
    }
  };

  return (
    <div className="translator-textbox-container">

      {/* ===== CURRENT SIGN ===== */}
      <div className="sign-status">
        <strong>Current Sign:</strong>{" "}
        <span>{prediction || "Waiting..."}</span>
        {confidence > 0 && (
          <span className="confidence">
            {" "}({(confidence * 100).toFixed(1)}%)
          </span>
        )}
      </div>

      {/* ===== MAIN TEXT BOX ===== */}
      <div className="translator-textbox">

        {/* Raw text */}
        <div className="textbox-content">
          {text || (
            <span className="placeholder">
              Start signing to see text here...
            </span>
          )}
          <span className="cursor">|</span>
        </div>

        {/* Corrected text */}
        {aiText && (
          <div className="textbox-content">
            <strong>Corrected Text:</strong> {aiText}
          </div>
        )}

        {/* Buttons */}
        <div className="textbox-actions">
          <button onClick={handleClear} disabled={!text}>
            Clear
          </button>

          <button onClick={handleSave} disabled={!text.trim()}>
            Save
          </button>

          <button
            onClick={toggleTTS}
            disabled={!ttsSupported}
          >
            🔊 TTS {ttsEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={handleSpeak}
            disabled={!ttsEnabled || !text}
          >
            {isSpeaking ? "Stop Speaking" : "Speak Text"}
          </button>

          <button
            onClick={handleListen}
            disabled={!sttSupported}
          >
            {isListening ? "Listening..." : "Start Speaking"}
          </button>

          {transcript && (
            <button onClick={handleUseTranscript}>
              Use Speech Text
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslatorTextBox;