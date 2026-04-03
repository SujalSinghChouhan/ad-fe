import { useState } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceSearch({ onResult }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startListening = () => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  if (!supported) return null;

  return (
    <button onClick={startListening}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${listening ? "bg-red-500 animate-pulse" : "bg-gray-100 hover:bg-gray-200"}`}
      title="Voice Search">
      {listening ? <MicOff size={16} className="text-white" /> : <Mic size={16} className="text-gray-600" />}
    </button>
  );
}
