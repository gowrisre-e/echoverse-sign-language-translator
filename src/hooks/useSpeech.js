import { useState, useCallback, useEffect, useRef } from 'react';

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);

  // Check browser support
  useEffect(() => {
    // Check TTS support
    setTtsSupported('speechSynthesis' in window);

    // Check STT support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSttSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Text-to-Speech
  const speak = useCallback((text) => {
    if (!ttsSupported || !ttsEnabled || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = 'en-US';
    utteranceRef.current.rate = 1;
    utteranceRef.current.pitch = 1;

    utteranceRef.current.onstart = () => setIsSpeaking(true);
    utteranceRef.current.onend = () => setIsSpeaking(false);
    utteranceRef.current.onerror = (event) => {
      console.error('TTS error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utteranceRef.current);
  }, [ttsEnabled, ttsSupported]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (ttsSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [ttsSupported]);

  // Toggle TTS
  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => {
      if (prev) {
        window.speechSynthesis?.cancel();
      }
      return !prev;
    });
  }, []);

  // Speech-to-Text
  const startListening = useCallback(() => {
    if (!sttSupported || !recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
    }
  }, [sttSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    // TTS
    isSpeaking,
    ttsEnabled,
    ttsSupported,
    speak,
    stopSpeaking,
    toggleTTS,
    // STT
    isListening,
    transcript,
    sttSupported,
    startListening,
    stopListening,
    clearTranscript,
    // Error
    error
  };
};

export default useSpeech;
