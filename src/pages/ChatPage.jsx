import React from 'react'
import './style/ChatPage.css'
import Sidebar from '../components/Sidebar'

const ChatPage = () => {
  return (
    <div className="chatpage">

      <Sidebar />

      <main className="chatpage-window">

        <header className="chatpage-header">
          {/* header */}
        </header>

        <section className="chatpage-body">

          <div className="chatpage-messages">
            {/* messages */}
          </div>

          <footer className="chatpage-input">
            {/* input */}
          </footer>

        </section>

      </main>

    </div>
  )
}

export default ChatPage
