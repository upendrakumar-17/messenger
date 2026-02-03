import React, { useState } from 'react'
import './style/ChatPage.css'
import MessageBubble from '../components/MessageBubble'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import Sidebar from '../components/Sidebar';
import useAzureTTS from "../hooks/useAzureTTS";

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

  // const sendMessage = async (text) => {
  //   setAiText('...') 
  //   try {
  //     setAiText('') // live streaming reset

  //     const response = await fetch('http://localhost:8002/chat/stream', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         message: text,
  //         session_id: 'user123',
  //         use_streaming: true,
  //       }),
  //     })

  //     const reader = response.body.getReader()
  //     const decoder = new TextDecoder()
  //     let aiMessage = ''

  //     while (true) {
  //       const { value, done } = await reader.read()
  //       if (done) break

  //       const chunkText = decoder.decode(value, { stream: true })
  //       const lines = chunkText.split('\n')

  //       for (const line of lines) {
  //         if (!line.startsWith('data:')) continue

  //         const jsonStr = line.replace('data:', '').trim()
  //         if (!jsonStr) continue

  //         const data = JSON.parse(jsonStr)

  //         if (data.chunk) {
  //             if (aiMessage === '') {
  //     setAiText('') // remove "..."
  //   }
  //           await streamWords(data.chunk, (word) => {
  //             aiMessage += word
  //             setAiText(aiMessage)
  //           }, 35) // typing speed here
  //         }
  //       }
  //     }

  //     if (aiMessage) {
  //       setMessages(prev => [...prev, { text: aiMessage, type: 'out' }])
  //       setAiText('')
  //     }
  //   } catch (err) {
  //     console.error('❌ Error sending message:', err)
  //   }
  // }
  // const sendMessage = async (text) => {
  //   try {
  //     let aiMessage = ''

  //     setAiText('...') 

  //     const response = await fetch('http://localhost:8002/chat/stream', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         message: text,
  //         session_id: 'user123',
  //         use_streaming: true,
  //       }),
  //     })

  //     const reader = response.body.getReader()
  //     const decoder = new TextDecoder()

  //     while (true) {
  //       const { value, done } = await reader.read()
  //       if (done) break

  //       const chunkText = decoder.decode(value, { stream: true })
  //       const lines = chunkText.split('\n')

  //       for (const line of lines) {
  //         if (!line.startsWith('data:')) continue

  //         const jsonStr = line.replace('data:', '').trim()
  //         if (!jsonStr) continue

  //         const data = JSON.parse(jsonStr)

  //         if (data.chunk) {
  //           if (aiMessage === '') setAiText('') // remove "..."

  //           await streamWords(data.chunk, (word) => {
  //             aiMessage += word
  //             setAiText(aiMessage)
  //           }, 35)
  //         }
  //       }
  //     }

  //     if (aiMessage) {
  //       setMessages(prev => [...prev, { text: aiMessage, type: 'out' }])
  //       setAiText('')
  //     }
  //   } catch (err) {
  //     console.error('❌ Error sending message:', err)
  //     setAiText('') // clear thinking dots on error
  //   }
  // }

  // const sendMessage = async (text) => {
  //   try {
  //     let aiMessage = '';

  //     setAiText('...');

  //     // reset audio for new AI turn
  //     ttsTextBuffer = '';
  //     nextPlayTime = audioCtx.currentTime;

  //     const response = await fetch('http://localhost:8002/chat/stream', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         message: text,
  //         session_id: 'user123',
  //         use_streaming: true,
  //       }),
  //     });

  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder();

  //     while (true) {
  //       const { value, done } = await reader.read();
  //       if (done) break;

  //       const chunkText = decoder.decode(value, { stream: true });
  //       const lines = chunkText.split('\n');

  //       for (const line of lines) {
  //         if (!line.startsWith('data:')) continue;

  //         const jsonStr = line.replace('data:', '').trim();
  //         if (!jsonStr) continue;

  //         const data = JSON.parse(jsonStr);

  //         if (data.chunk) {
  //           if (aiMessage === '') setAiText('');

  //           // 🔊 SEND STREAMED TEXT TO AZURE
  //           pushToAzureTTS(data.chunk);

  //           // 📝 YOUR EXISTING WORD STREAMING
  //           await streamWords(data.chunk, (word) => {
  //             aiMessage += word;
  //             setAiText(aiMessage);
  //           }, 35);
  //         }
  //       }
  //     }

  //     // 🔔 flush remaining text to Azure
  //     await pushToAzureTTS('', true);

  //     if (aiMessage) {
  //       setMessages(prev => [...prev, { text: aiMessage, type: 'out' }]);
  //       setAiText('');
  //     }

  //   } catch (err) {
  //     console.error('❌ Error sending message:', err);
  //     setAiText('');
  //   }
  // };

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
          <button onClick={async () => {
    await unlockAudio();   // 👈 REQUIRED
    stopTTS();
    toggleListening();
  }}>
            {isListening ? '⏹ Stop' : '🎤 Speak'}
          </button>


        </footer>
      </main>
    </div>
  )
}

export default ChatPage
