import React, { useState } from 'react'
import './style/ChatPage.css'
import MessageBubble from '../components/MessageBubble'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'

const ChatPage = () => {
  const [messages, setMessages] = useState([])
  const [aiText, setAiText] = useState('')

  // 🔹 Pass a callback to the hook
  const {
    isListening,
    interimText,
    finalText,
    toggleListening,
    finalTextRef,
    setInterimText,
    setFinalText,
    stopAndSend,
  } = useSpeechRecognition(handleFinalTranscript)

  function handleFinalTranscript(text) {
    // Append user message
    setMessages(prev => [...prev, { text, type: 'in' }])
    sendMessage(text)
  }

  const sendMessage = async (text) => {
    try {
      setAiText('') // live streaming

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
            setAiText(aiMessage)
          }
        }
      }

      if (aiMessage) {
        setMessages(prev => [...prev, { text: aiMessage, type: 'out' }])
        setAiText('')
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
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} text={msg.text} type={msg.type} />
            ))}

            {aiText && <MessageBubble text={aiText} type="out" />}

            {(finalText || interimText) && (
              <MessageBubble text={finalText + interimText} type="in" />
            )}
          </div>
        </section>

        <footer className="chatpage-input">
          <button onClick={toggleListening}>
            {isListening ? '⏹ Stop' : '🎤 Speak'}
          </button>

          {/* <input
            type="text"
            value={finalText + interimText}
            placeholder="Speak freely..."
            readOnly
          /> */}
        </footer>
      </main>
    </div>
  )
}

export default ChatPage
