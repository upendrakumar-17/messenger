import { useEffect, useRef, useState } from 'react'

export const useSpeechRecognition = (onFinalTranscript) => {
  const SILENCE_DELAY = 2000 // ms

  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')

  const recognitionRef = useRef(null)
  const finalTextRef = useRef('')
  const silenceTimerRef = useRef(null)
  const isRecognizingRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => { 
      console.log('Recognition started.');
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(stopAndSend, SILENCE_DELAY)
    }

    recognition.onresult = (event) => {
      console.log('Recognition result received.');
      if (!isRecognizingRef.current) return

      clearTimeout(silenceTimerRef.current)

      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        event.results[i].isFinal ? (final += transcript) : (interim += transcript)
      }

      setInterimText(interim)

      if (final) {
        finalTextRef.current += final
        setFinalText(finalTextRef.current)
      }

      silenceTimerRef.current = setTimeout(stopAndSend, SILENCE_DELAY)
    }

    recognition.onerror = stopRecognition
    recognition.onend = () => {
      isRecognizingRef.current = false
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      clearTimeout(silenceTimerRef.current)
    }
  }, [])

  const startListening = () => {
    console.log('Starting recognition.');
    if (isRecognizingRef.current) return

    finalTextRef.current = ''
    setFinalText('')
    setInterimText('')

    recognitionRef.current.start()
    isRecognizingRef.current = true
    setIsListening(true)
  }

  const stopRecognition = () => {
    console.log('Stopping recognition.');
    if (!isRecognizingRef.current) return
     isRecognizingRef.current = false
    clearTimeout(silenceTimerRef.current)
    recognitionRef.current.stop()
    setIsListening(false)
  }

  const stopAndSend = () => {
    console.log('Stopping recognition and sending transcript.')
    if (!isRecognizingRef.current) return

    stopRecognition()

    // ✅ Call the callback with the full transcript
    const text = (finalTextRef.current + interimText).trim()
    if (text && typeof onFinalTranscript === 'function') {
      onFinalTranscript(text)
    }

    finalTextRef.current = ''
    setFinalText('')
    setInterimText('')
  }

  const toggleListening = () => {
    console.log('Toggling listening. Current state:')
    isRecognizingRef.current ? stopAndSend() : startListening()
  }

  return {
    isListening,
    interimText,
    finalText,
    startListening,
    stopRecognition,
    stopAndSend,
    toggleListening,
    recognitionRef,
    finalTextRef,
    setInterimText,
    setFinalText,
    isRecognizingRef,
  }
}
