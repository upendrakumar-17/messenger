import React, { useState } from 'react'
import './Sidebar.css'

const Sidebar = ({chats,
          activeChatId,
          onNewChat,
          onSelectChat,
          onDeleteChat}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating open button */}
      {!isOpen && (
        <div
          className="sidebar-toggle-float"
          onClick={() => setIsOpen(true)}
        >
          ☰
        </div>
      )}

      {/* Sidebar panel */}
      <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>

        <div className="sidebar-header">
          <div
            className="sidebar-toggle"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </div>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-newchat-button">+</div>
          <div className="sidebar-chatlist">
            <div>Chat 1</div>
            <div>Chat 2</div>
          </div>
        </div>

        <div className="sidebar-footer" />
      </div>
    </>
  )
}

export default Sidebar
