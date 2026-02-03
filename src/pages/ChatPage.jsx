import React, { useEffect, useRef, useState } from 'react'
import './style/ChatPage.css'
import MessageBubble from '../components/MessageBubble'

const ChatPage = () => {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [aiText, setAiText] = useState('')
  const [messages, setMessages] = useState([]) // <-- full chat history

  const recognitionRef = useRef(null)
  const finalTextRef = useRef('')
  const silenceTimerRef = useRef(null)
  const isRecognizingRef = useRef(false)

  const SILENCE_DELAY = 2000 // ms

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech Recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(stopAndSend, SILENCE_DELAY)
    }

    recognition.onresult = (event) => {
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

  /* ---------- TOGGLE BUTTON ---------- */
  const toggleListening = () => {
    isRecognizingRef.current ? stopAndSend() : startListening()
  }

  const startListening = () => {
    if (isRecognizingRef.current) return

    finalTextRef.current = ''
    setFinalText('')
    setInterimText('')
    setAiText('')

    recognitionRef.current.start()
    isRecognizingRef.current = true
    setIsListening(true)
  }

  const stopRecognition = () => {
    if (!isRecognizingRef.current) return
    clearTimeout(silenceTimerRef.current)
    recognitionRef.current.stop()
  }

  const stopAndSend = () => {
    if (!isRecognizingRef.current) return

    stopRecognition()

    const text = (finalTextRef.current + interimText).trim()
    if (text) {
      // Append user message to history
      setMessages(prev => [...prev, { text, type: 'in' }])
      sendMessage(text)
    }

    finalTextRef.current = ''
    setFinalText('')
    setInterimText('')
  }

  /* ---------- STREAMING BACKEND ---------- */
  const sendMessage = async (text) => {
    try {
      setAiText('') // reset live AI text

      const response = await fetch('http://localhost:8002/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: 'user123',
          use_streaming: true,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let aiMessage = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunkText = decoder.decode(value, { stream: true })
        const lines = chunkText.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          const jsonStr = line.replace('data:', '').trim()
          if (!jsonStr) continue

          const data = JSON.parse(jsonStr)

          if (data.chunk) {
            aiMessage += data.chunk
            setAiText(aiMessage) // 🔥 live streaming
          }
        }
      }

      // Append final AI message to history
      if (aiMessage) {
        setMessages(prev => [...prev, { text: aiMessage, type: 'out' }])
        setAiText('') // clear live stream text
      }
    } catch (err) {
      console.error('❌ Error sending message:', err)
    }
  }

  return (
    <div className="chatpage">
      <main className="chatpage-window">
        <header className="chatpage-header">Chat Header</header>

        <section className="chatpage-body">
          <div className="chatpage-messages">
            {/* Render full message history */}
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} text={msg.text} type={msg.type} />
            ))}

            {/* Show live AI streaming */}
            {aiText && <MessageBubble text={aiText} type="out" />}

            {/* Show current user speech */}
            {(finalText || interimText) && (
              <MessageBubble text={finalText + interimText} type="in" />
            )}
          </div>

          <footer className="chatpage-input">
            <button onClick={toggleListening}>
              {isListening ? '⏹ Stop' : '🎤 Speak'}
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
