import React from 'react'
import './MessageBubble.css'

const MessageBubble = ({ text, type = 'out' }) => {
  return (
    <div className={`message-row ${type}`}>
      <div className="message-bubble">
        {text}
      </div>
    </div>
  )
}

export default MessageBubble
