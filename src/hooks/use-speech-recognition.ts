import { useState, useEffect, useCallback } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - Gestione compatibilità browser
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false; // Si ferma quando fai una pausa lunga
        recognitionInstance.lang = "it-IT"; // Lingua Italiana
        recognitionInstance.interimResults = false;

        recognitionInstance.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          setIsListening(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error("Errore riconoscimento vocale:", event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript(""); // Reset precedente
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Impossibile avviare:", e);
      }
    } else {
      alert("Il tuo browser non supporta la dettatura vocale.");
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  return { isListening, transcript, startListening, stopListening };
}