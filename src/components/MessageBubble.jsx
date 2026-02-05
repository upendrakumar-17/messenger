import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ text, type = 'out' }) => {
  return (
    <div className={"message-row"}>
      <div className={"message-bubble " + (type === 'in' ? 'in' : 'out')}>
        {text}
      </div>
    </div>
  )
}

export default MessageBubble;