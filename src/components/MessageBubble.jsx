import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ text, type = 'out' }) => {
  return (
    <div className={"message-row"}>
      <div
        className={"message-bubble " + (type === 'in' ? 'in' : 'out')}
        role="article"
        tabIndex={0}
        aria-label={(type === 'in' ? 'Incoming message: ' : 'Outgoing message: ') + (typeof text === 'string' ? text : '')}
      >
        {text}
      </div>
    </div>
  )
}

export default MessageBubble;