import { useState, useMemo, useEffect } from "react";
import { GESTURE_LABELS } from "../data/gestures";
import "../styles/LearningModule.css";
import learnImage from "../images/learn-sign-language.png";
import useSpeech from "../hooks/useSpeech";

const SIGN_DESCRIPTIONS = {
  A: "Make a fist with thumb alongside",
  B: "Flat hand, fingers together, thumb tucked",
  C: "Curved hand like holding a cup",
  D: "Index up, other fingers touch thumb",
  E: "Fingers curled, thumb across",
  F: "OK sign but with other fingers up",
  G: "Index and thumb point sideways",
  H: "Index and middle finger point sideways",
  I: "Pinky up, other fingers in fist",
  J: "Like I, but draw J in air",
  K: "Index and middle up, thumb between",
  L: "L-shape with index and thumb",
  M: "Fingers over thumb, three bumps",
  N: "Fingers over thumb, two bumps",
  O: "All fingers touch thumb, circle shape",
  P: "Like K but pointing down",
  Q: "Like G but pointing down",
  R: "Index and middle crossed",
  S: "Fist with thumb over fingers",
  T: "Thumb between index and middle",
  U: "Index and middle up together",
  V: "Peace sign",
  W: "Three fingers up (index, middle, ring)",
  X: "Index finger hooked",
  Y: "Thumb and pinky out",
  Z: "Index draws Z in air",
  0: "O shape with all fingers",
  1: "Index finger up",
  2: "Peace sign",
  3: "Thumb, index, middle up",
  4: "Four fingers up",
  5: "All five fingers spread",
  6: "Pinky and thumb touch",
  7: "Ring and thumb touch",
  8: "Middle and thumb touch",
  9: "Index and thumb touch",
  SPACE: "Open palm facing up",
};

const LearningModule = ({ initialText = "" }) => {
  const [inputText, setInputText] = useState(initialText);
  const [mode, setMode] = useState("alphabet");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Voice-to-text (STT)
  const {
    isListening,
    transcript,
    sttSupported,
    startListening,
    stopListening,
    clearTranscript,
    error: speechError,
  } = useSpeech();

  const characters = useMemo(() => {
    if (mode === "alphabet") {
      return GESTURE_LABELS.filter((l) => l.length === 1);
    }
    return inputText
      .toUpperCase()
      .split("")
      .filter((c) => GESTURE_LABELS.includes(c) || c === " ")
      .map((c) => (c === " " ? "SPACE" : c));
  }, [mode, inputText]);

  const currentChar = characters[currentIndex];

  useEffect(() => {
    const t = (transcript || "").trim();
    if (!t) return;

    // When user speaks, treat it as "Word / Phrase" input.
    // (Defer state updates to avoid strict lint complaining about setState-in-effect.)
    const id = window.setTimeout(() => {
      setMode("word");
      setInputText(t);
      setCurrentIndex(0);
      clearTranscript();
    }, 0);

    return () => window.clearTimeout(id);
  }, [transcript, clearTranscript]);

  const handlePrev = () =>
    setCurrentIndex((i) => Math.max(0, i - 1));

  const handleNext = () =>
    setCurrentIndex((i) =>
      Math.min(characters.length - 1, i + 1)
    );

  return (
    <div className="learn-page">

      {/* ===== HERO ===== */}
      <div className="learn-hero">
        <div className="learn-hero-text">
          <h2>Learning Mode</h2>
          <p className="learn-subtitle">
            Learn how to form each sign step by step at your own pace.
          </p>

          <div className="mode-toggle">
            <button
              className={mode === "alphabet" ? "active" : ""}
              onClick={() => {
                setMode("alphabet");
                setCurrentIndex(0);
              }}
            >
              Alphabet
            </button>
            <button
              className={mode === "word" ? "active" : ""}
              onClick={() => {
                setMode("word");
                setCurrentIndex(0);
              }}
            >
              Word / Phrase
            </button>
          </div>

          {mode === "word" && (
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setCurrentIndex(0);
                }}
                placeholder="Type a word"
              />
              <button
                type="button"
                className={`mic-btn ${isListening ? "listening" : ""}`}
                onClick={() => {
                  if (!sttSupported) return;
                  if (isListening) stopListening();
                  else startListening();
                }}
                disabled={!sttSupported}
                aria-label="Voice input"
                title={
                  sttSupported
                    ? isListening
                      ? "Stop listening"
                      : "Start voice input"
                    : "Speech recognition not supported"
                }
              >
                {isListening ? "🛑" : "🎙️"}
              </button>
            </div>
          )}

          {mode === "word" && speechError && (
            <div className="speech-error" role="alert">
              {speechError}
            </div>
          )}
        </div>

        <div className="learn-hero-image">
          {mode === "word" && inputText.trim() && characters.length > 0 ? (
            <div className="learn-hero-sequence" aria-label="Sign sequence">
              {characters.map((ch, idx) => {
                if (ch === "SPACE") {
                  return <div key={idx} className="hero-token space" />;
                }
                return (
                  <div key={idx} className="hero-token">
                    {ch}
                  </div>
                );
              })}
            </div>
          ) : (
            <img src={learnImage} alt="Learn Sign" className="learn-hero-img" />
          )}
        </div>
      </div>

      {/* ===== MAIN GRID ===== */}
      {characters.length > 0 && (
        <div className="learn-main-grid">

          {/* ===== LEFT PANEL ===== */}
          <div className="learn-card sign-card">

            {/* NAVIGATION */}
            <div className="sign-nav">
              <button className="nav-btn" onClick={handlePrev} disabled={currentIndex === 0}>
                ← Previous
              </button>
              <span className="progress">
                {currentIndex + 1} / {characters.length}
              </span>
              <button className="nav-btn" onClick={handleNext} disabled={currentIndex === characters.length - 1}>
                Next →
              </button>
            </div>

            {/* ===== ALPHABET MODE UI ===== */}
            {mode === "alphabet" && (
              <>
                <div className="sign-circle">
                  {currentChar}
                </div>

                <p className="sign-description">
                  {SIGN_DESCRIPTIONS[currentChar]}
                </p>
              </>
            )}

            {/* ===== WORD MODE UI ===== */}
            {mode === "word" && (
              <>
                <h3 className="word-title">
                  Learning <span>{inputText.toUpperCase()}</span>
                </h3>

                <div className="letter-list">
                  {characters.map((char, index) => (
                    <div
                      key={index}
                      className={`letter-row ${index === currentIndex ? "active" : ""}`}
                    >
                      <span className="letter-char">{char}</span>
                      <span className="letter-desc">
                        {SIGN_DESCRIPTIONS[char]}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* HAND GUIDE */}
            <div className="hand-guide">
              <h4>Hand Position Guide</h4>
              <div className="hand-guide-box">
                {mode === "word" && currentChar !== "SPACE" ? (
                  <span className="hand-guide-letter">{currentChar}</span>
                ) : (
                  "🤟"
                )}
              </div>
              <small>Practice this sign in front of the camera</small>
            </div>
          </div>

          

          {/* ===== QUICK REFERENCE ===== */}
          <div className="learn-card quick-ref-card">
            <h3 className="quick-title">Quick Reference</h3>

            <div className="quick-ref-grid">
              {GESTURE_LABELS.filter((l) => l.length === 1).map((label) => {
                const indexInWord = characters.indexOf(label);
                return (
                  <button
                    key={label}
                    className={`quick-btn ${currentChar === label ? "active" : ""}`}
                    onClick={() => {
                      if (mode === "alphabet") {
                        setCurrentIndex(characters.indexOf(label));
                      } else if (indexInWord !== -1) {
                        setCurrentIndex(indexInWord);
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ===== VIDEO REFERENCE ===== */}
<div className="video-guide">
  <h4>Video Reference</h4>

  <div className="video-wrapper">
    <iframe
      src="https://www.youtube.com/embed/0FcwzMq4iWg"
      title="ASL Alphabet Learning Video"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  </div>

  
</div>

    </div>
  );
};

export default LearningModule;
