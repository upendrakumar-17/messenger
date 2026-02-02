import React, { useEffect, useRef, useState } from 'react'
import './style/ChatPage.css'

const ChatPage = () => {

  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')

  const recognitionRef = useRef(null)
  const finalTextRef = useRef('')
  const silenceTimerRef = useRef(null)

  const SILENCE_DELAY = 1500 // 👈 ms (adjustable)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech Recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true          // 🔥 keep listening
    recognition.interimResults = true

    recognition.onstart = () => {
      console.log('▶️ recognition started')
    }

    recognition.onresult = (event) => {
      clearTimeout(silenceTimerRef.current)

      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      setInterimText(interim)

      if (final) {
        finalTextRef.current += final
        setFinalText(finalTextRef.current)
      }

      // 🔕 start silence countdown
      silenceTimerRef.current = setTimeout(() => {
        stopAndSend()
      }, SILENCE_DELAY)
    }

    recognition.onerror = (e) => {
      console.error('Speech error:', e)
      stopRecognition()
    }

    recognitionRef.current = recognition
  }, [])

  const stopRecognition = () => {
    clearTimeout(silenceTimerRef.current)
    recognitionRef.current.stop()
    setIsListening(false)
  }

  const stopAndSend = () => {
    console.log('⏳ silence detected — sending')

    stopRecognition()

    if (finalTextRef.current.trim()) {
      sendMessage(finalTextRef.current)
    }

    finalTextRef.current = ''
    setFinalText('')
    setInterimText('')
  }

  const startListening = () => {
    finalTextRef.current = ''
    setFinalText('')
    setInterimText('')

    recognitionRef.current.start()
    setIsListening(true)
  }

  const sendMessage = (text) => {
    console.log('📨 SENT:', text)
  }

  return (
    <div className="chatpage">

      <main className="chatpage-window">

        <header className="chatpage-header">
          Chat Header
        </header>

        <section className="chatpage-body">

          <div className="chatpage-messages">
            Input / Output Messages
          </div>

          <footer className="chatpage-input">

            <button onClick={startListening} disabled={isListening}>
              {isListening ? '🎙 Listening...' : '🎤 Speak'}
            </button>

            <input
              type="text"
              value={finalText + interimText}
              placeholder="Speak freely..."
              readOnly
            />

          </footer>

        </section>

      </main>

    </div>
  )
}

export default ChatPage
