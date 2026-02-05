import React, { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import './Header.css'
import { FiFlag, FiMoreVertical, FiPlus } from 'react-icons/fi'

const LS_HDR_CHATS = 'bm_hdr_chats_v1'

const Header = ({ title = 'Chat' }) => {
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_HDR_CHATS)
      if (raw) setChats(JSON.parse(raw))
      else setChats([{ id: 1, title: 'General' }])
    } catch (e) { setChats([{ id: 1, title: 'General' }]) }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(LS_HDR_CHATS, JSON.stringify(chats)) } catch (e) {}
  }, [chats])

  const handleNewChat = () => {
    const id = Date.now()
    const next = [{ id, title: `New chat ${chats.length + 1}` }, ...chats]
    setChats(next)
    setActiveChatId(id)
  }

  const handleSelectChat = (chat) => {
    setActiveChatId(chat.id)
    // TODO: route or set app state
  }

  const handleDeleteChat = (chatId) => {
    setChats((s) => s.filter(c => c.id !== chatId))
    if (activeChatId === chatId) setActiveChatId(null)
  }

  return (
    <header className="header-container">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="header">
        <div className='header-logo'></div>
        <div className="header-title">{title}</div>
        
      </div>

      <div className='header-menu'>
        <button className="header-action" title="Flag conversation"><FiFlag /></button>
        <div className="header-menu-wrapper">
          <button className="header-action" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
            <FiMoreVertical />
          </button>
          {menuOpen && (
            <div className="header-menu-pop">
              <button onClick={() => { handleNewChat(); setMenuOpen(false) }} className="header-menu-item"><FiPlus/> New chat</button>
              <button onClick={() => { alert('Export not implemented') }} className="header-menu-item">Export</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
