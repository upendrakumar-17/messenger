import React, { useState, useEffect } from 'react'
import './style/ChatPage.css'
import MessageBubble from '../components/MessageBubble'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import Sidebar from '../components/Sidebar';
import useAzureTTS from "../hooks/useAzureTTS";
import SandDunes from '../components/SandDunes';
import DotVisualizer from '../components/VoiceOrb';
import SiriOrb from '../components/SiriOrb';

const LOCAL_KEY = 'saved-chats'
const ACTIVE_KEY = 'active-chat-id'

const ChatPage = () => {

  const {
    bufferTTS,
    flushTTS,
    stopTTS,
    unlockAudio,
    isSpeaking
  } = useAzureTTS();

  const [messages, setMessages] = useState([])
  const [aiText, setAiText] = useState('')

  // Chat list + active chat id (persisted)
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      setChats(parsed || [])
      const savedActive = localStorage.getItem(ACTIVE_KEY)
      if (savedActive) setActiveChatId(savedActive)
      if (savedActive) {
        const c = (parsed || []).find(x => x.id === savedActive)
        if (c) setMessages(c.messages || [])
      }
    } catch (e) {
      console.error('Failed to load chats from localStorage', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(chats))
    } catch (e) {
      console.error('Failed to save chats to localStorage', e)
    }
  }, [chats])

  useEffect(() => {
    if (activeChatId) localStorage.setItem(ACTIVE_KEY, activeChatId)
    else localStorage.removeItem(ACTIVE_KEY)
  }, [activeChatId])

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

  const streamWords = async (chunk, appendFn, delay = 30) => {
    const words = chunk.split(/(\s+)/) // keep spaces

    for (const word of words) {
      appendFn(word)
      await new Promise(res => setTimeout(res, delay))
    }
  }

  const sendMessage = async (text) => {

    try {
      let aiMessage = ''

      setAiText('...')

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
            console.log('Received chunk:', data.chunk)
            if (aiMessage === '') setAiText('')

            // 🔊 AZURE TTS (streamed)
            bufferTTS(data.chunk)

            // 📝 existing typing animation
            await streamWords(data.chunk, (word) => {
              aiMessage += word
              setAiText(aiMessage)
            }, 35)
          }
        }
      }

      // 🔔 flush leftover audio
      flushTTS()

      if (aiMessage) {
        setMessages(prev => [...prev, { text: aiMessage, type: 'out' }])
        setAiText('')
      }

    } catch (err) {
      console.error('❌ Error sending message:', err)
      setAiText('')
      stopTTS()
    }
  }

  /* ----------------------
     Chat saving utilities (auto-save on New Chat)
     ---------------------- */
  const genId = () => Date.now().toString()

  const getTitleFromMessages = (msgs = []) => {
    if (!msgs || msgs.length === 0) return `Chat ${new Date().toLocaleString()}`
    const first = msgs.find(m => m.text && m.text.trim()) || msgs[0]
    const text = (first && first.text) || ''
    const snippet = text.trim().split(/\s+/).slice(0, 6).join(' ')
    return snippet + (snippet.length < text.length ? '...' : '')
  }

  const handleNewChat = () => {
    const trimmed = messages.filter(m => m && m.text && m.text.trim())
    if (trimmed.length > 0) {
      const id = genId()
      const newChat = {
        id,
        title: getTitleFromMessages(trimmed),
        messages: trimmed,
        createdAt: Date.now()
      }
      setChats(prev => [newChat, ...prev])
      setActiveChatId(id)
    } else {
      setActiveChatId(null)
    }

    setMessages([])
    setAiText('')
  }

  const handleSelectChat = (id) => {
    const c = chats.find(x => x.id === id)
    if (c) {
      setMessages(c.messages || [])
      setActiveChatId(id)
      setAiText('')
    }
  }

  const handleDeleteChat = (id) => {
    setChats(prev => prev.filter(c => c.id !== id))
    if (activeChatId === id) {
      setActiveChatId(null)
      setMessages([])
      setAiText('')
    }
  }

  /* ----------------------
     UI
     ---------------------- */
  return (
    <div className="chatpage-window">

      <header className="chatpage-header">
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
        <div className='chatpage-heading'>Chat heading</div>
      </header>
      <main className="chatpage-container">
        <section className="chatpage-body">
          <div className='section-background'>
            {/* <SandDunes/> */}
            {/* <DotVisualizer/> */}
            <SiriOrb/>
            
          </div>
          <div className="chatpage-messages">

            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                text={msg.text}
                type={msg.type}
              />
            ))}
            {aiText && (
              <MessageBubble
                text={aiText}
                type="out"
              />
            )}
            {(finalText || interimText) && (
              <MessageBubble
                text={finalText + interimText}
                type="in"
              />
            )}
          </div>
        </section>
        <footer className="chatpage-input">
          <div className='footer-controls'>

            <button
              onClick={async () => {
                await unlockAudio();
                stopTTS();
                toggleListening();
              }}
            >
              {isListening ? '⏹ Stop' : '🎤 Speak'}
            </button>
            <button
              onClick={() => {
                stopTTS()
              }}>
              cancel
            </button>

          </div>
          <div className='footer-visuals'>

          </div>
          <div className='footer-menu'>

          </div>
        </footer>
      </main>
    </div>
  )

}

export default ChatPage