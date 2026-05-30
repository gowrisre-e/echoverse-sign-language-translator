import SignRecognition from "../components/SignRecognition";
import "../styles/translator.css";
import useIndexedDB from "../hooks/useIndexedDB";

export default function Translator() {
  const { addTranslation } = useIndexedDB(); // ✅ CONNECT DB

  const handleSave = async (text) => {
    await addTranslation(text); // ✅ SAVE TO INDEXED DB
  };

  return (
    <div className="translator-page">
      <h1 className="translator-title">Translator</h1>
      <p className="translator-subtitle">
        This is where sign-to-text and voice-to-text translation happens.
      </p>

      <div className="translator-content">
        <SignRecognition onSave={handleSave} /> {/* ✅ PASS CALLBACK */}
      </div>
    </div>
  );
}
