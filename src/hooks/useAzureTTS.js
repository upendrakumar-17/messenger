import { useRef, useState, useCallback } from "react";

export default function useAzureTTS() {
    const ttsQueueRef = useRef([]);
    const ttsBufferRef = useRef("");
    const currentAudioRef = useRef(null);
    const isSpeakingRef = useRef(false);

    const [, forceUpdate] = useState(0); // only to expose isSpeaking

    const setSpeaking = (val) => {
        isSpeakingRef.current = val;
        forceUpdate(v => v + 1);
    };

    // ---------- Azure Fetch ----------
    const fetchAudioFromAzure = async (text) => {
        const key = process.env.REACT_APP_AZURE_TTS_KEY;
        const region = process.env.REACT_APP_AZURE_TTS_REGION;
        const voiceName =
            process.env.REACT_APP_AZURE_TTS_VOICE || "hi-IN-SwaraNeural";

        if (!key || !region) return null;

        try {
            const response = await fetch(
                `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
                {
                    method: "POST",
                    headers: {
                        "Ocp-Apim-Subscription-Key": key,
                        "Content-Type": "application/ssml+xml",
                        "X-Microsoft-OutputFormat":
                            "audio-16khz-128kbitrate-mono-mp3",
                    },
                    body: `
<speak version="1.0" xml:lang="hi-IN">
  <voice name="${voiceName}">
    ${text}
  </voice>
</speak>`,
                }
            );

            if (!response.ok) return null;
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch {
            return null;
        }
    };

    // ---------- Audio ----------
    // const playAudio = (url) =>
    //     new Promise((resolve) => {
    //         const audio = new Audio(url);
    //         audio.playbackRate = 1.2;
    //         currentAudioRef.current = audio;

    //         audio.onended = audio.onerror = () => {
    //             URL.revokeObjectURL(url);
    //             currentAudioRef.current = null;
    //             resolve();
    //         };

    //         audio.play().catch(resolve);
    //     });
    const playAudio = (url) =>
  new Promise((resolve) => {
    const audio = new Audio(url);
    audio.muted = false;
    audio.volume = 1;
    audio.playbackRate = 1.2;

    console.log("Attempting to play audio");

    audio.onended = audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.play().then(() => {
  console.log("🔊 audio started");
}).catch(err => {
  console.warn("❌ audio blocked", err);
  resolve();
});

    
  });


    // ---------- Queue ----------
    const playNext = async () => {
        if (!ttsQueueRef.current.length) {
            setSpeaking(false);
            return;
        }

        setSpeaking(true);
        const item = ttsQueueRef.current.shift();
        const url = await item.audioPromise;

        if (url) await playAudio(url);
        playNext();
    };

    // ---------- Public API ----------
    const bufferTTS = useCallback((text) => {
        ttsBufferRef.current += text;

        const hasEnd = /[.!?]/.test(ttsBufferRef.current);
        const hasMid = /[,;:]/.test(ttsBufferRef.current);

        if (hasEnd) {
            const sentences =
                ttsBufferRef.current.match(/[^.!?]+[.!?]+/g) || [];

            sentences.forEach(s => {
                ttsQueueRef.current.push({
                    text: s,
                    audioPromise: fetchAudioFromAzure(s.trim()),
                });
            });

            ttsBufferRef.current = "";
            if (!isSpeakingRef.current) playNext();
        } 
        else if ((hasMid && ttsBufferRef.current.length > 50) ||
                 ttsBufferRef.current.length >= 100) {
            const chunk = ttsBufferRef.current;
            ttsBufferRef.current = "";

            ttsQueueRef.current.push({
                text: chunk,
                audioPromise: fetchAudioFromAzure(chunk),
            });

            if (!isSpeakingRef.current) playNext();
        }
    }, []);

    const flushTTS = useCallback(() => {
        if (!ttsBufferRef.current.trim()) return;

        const chunk = ttsBufferRef.current;
        ttsBufferRef.current = "";

        ttsQueueRef.current.push({
            text: chunk,
            audioPromise: fetchAudioFromAzure(chunk),
        });

        if (!isSpeakingRef.current) playNext();
    }, []);

    const stopTTS = () => {
        currentAudioRef.current?.pause();
        currentAudioRef.current = null;
        ttsQueueRef.current = [];
        ttsBufferRef.current = "";
        setSpeaking(false);
    };

    const audioUnlockedRef = useRef(false);

const unlockAudio = async () => {
  if (audioUnlockedRef.current) return;

  try {
    const audio = new Audio();
    audio.src = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAA";
    await audio.play();
    audioUnlockedRef.current = true;
    console.log("🔓 Audio unlocked");
  } catch (e) {
    console.warn("Audio unlock failed");
  }
};

    return {
        bufferTTS,
        flushTTS,
        stopTTS,
        unlockAudio, 
        isSpeaking: isSpeakingRef.current,
    };
}
