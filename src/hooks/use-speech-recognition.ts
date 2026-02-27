import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// Web Speech API types are not in the default TS lib — declare them narrowly
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

function detectSpeechRecognition():
  | (new () => SpeechRecognitionInstance)
  | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as (new () => SpeechRecognitionInstance) | undefined) ??
    (w.webkitSpeechRecognition as (new () => SpeechRecognitionInstance) | undefined)
  );
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  // Use a ref for the recognition instance — no re-render needed when it initialises
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // isSupported is computed once at mount via lazy initializer — no setState needed in effect
  const [isSupported] = useState<boolean>(() => !!detectSpeechRecognition());

  useEffect(() => {
    const SpeechRecognitionConstructor = detectSpeechRecognition();
    if (!SpeechRecognitionConstructor) return;

    const instance = new SpeechRecognitionConstructor();
    instance.continuous = false;
    instance.lang = "en-US";
    instance.interimResults = false;

    instance.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };

    instance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    instance.onend = () => {
      setIsListening(false);
    };

    // Assign to ref — avoids calling setState inside effect body
    recognitionRef.current = instance;

    return () => {
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Voice dictation is not supported by your browser.");
      return;
    }
    setTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error("Could not start speech recognition:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, transcript, startListening, stopListening, isSupported };
}
