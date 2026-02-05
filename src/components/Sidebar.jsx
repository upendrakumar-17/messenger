import React, { useEffect, useRef, useState } from "react";
import { FiMenu, FiPlus, FiX } from "react-icons/fi";
import './Sidebar.css'

const LS_CHATS = 'bm_chats_v1';
const LS_OPEN = 'bm_sidebar_open_v1';

const defaultChats = [
  { id: 1, title: 'General' },
  { id: 2, title: 'Project Ideas' }
];

const Sidebar = ({ chats: propsChats, activeChatId, onNewChat, onSelectChat, onDeleteChat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = Array.isArray(propsChats);
  const [internalChats, setInternalChats] = useState(defaultChats);
  const chats = isControlled ? propsChats : internalChats;
  const prevActiveRef = useRef(null);
  const closeBtnRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // load internal chats and open state from localStorage only when uncontrolled
    try {
      const wide = window.matchMedia('(min-width: 992px)').matches;
      const rawOpen = localStorage.getItem(LS_OPEN);
      setIsOpen(rawOpen ? JSON.parse(rawOpen) : wide);
    } catch (e) {}

    if (!isControlled) {
      try {
        const raw = localStorage.getItem(LS_CHATS);
        if (raw) setInternalChats(JSON.parse(raw));
      } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isControlled) {
      try { localStorage.setItem(LS_CHATS, JSON.stringify(internalChats)); } catch (e) {}
    }
  }, [internalChats, isControlled]);

  useEffect(() => {
    try { localStorage.setItem(LS_OPEN, JSON.stringify(isOpen)); } catch (e) {}
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (isOpen) {
      prevActiveRef.current = document.activeElement;
      // move focus to close button
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      // restore focus
      prevActiveRef.current?.focus?.();
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(s => !s);

  const createNewChat = () => {
    if (typeof onNewChat === 'function') { onNewChat(); setIsOpen(true); return; }
    const id = Date.now();
    const title = `New chat ${chats.length + 1}`;
    const next = [{ id, title }, ...chats];
    setInternalChats(next);
    setTimeout(() => containerRef.current?.querySelector('button.chat-item')?.focus(), 50);
  };

  const selectChat = (chat) => {
    if (typeof onSelectChat === 'function') { onSelectChat(chat); setIsOpen(false); return; }
    console.log('Selected chat', chat);
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={`sidebar-toggle-float ${isOpen ? 'hidden' : ''}`}
        aria-label="Open sidebar"
        onClick={() => setIsOpen(true)}
      >
        <FiMenu />
      </button>

      {isOpen && <button className="sidebar-overlay" aria-hidden onClick={() => setIsOpen(false)} />}

      <aside
        className={`sidebar-container ${isOpen ? 'open' : ''}`}
        ref={containerRef}
        role="navigation"
        aria-label="Chat sidebar"
        aria-hidden={!isOpen}
      >
        <header className="sidebar-header">
          <div className="sidebar-brand" onClick={() => setIsOpen(false)}>
            <div className="brand-logo">BM</div>
            <div className="brand-text"></div>
          </div>

          <button
            ref={closeBtnRef}
            className="sidebar-close"
            aria-label="Close sidebar"
            onClick={() => setIsOpen(false)}
          >
            <FiX />
          </button>
        </header>

        <div className="sidebar-content">
          <div className="sidebar-actions">
            <button className="new-chat-btn" onClick={createNewChat} aria-label="Start new chat">
              <FiPlus /> New chat
            </button>
          </div>

          <nav className="sidebar-chatlist" aria-label="Chats">
            {chats.length === 0 && <div className="empty">No chats yet — start a new one.</div>}
            {chats.map((c) => (
              <button key={c.id} className="chat-item" onClick={() => selectChat(c)}>
                <div className="chat-thumb">{c.title.charAt(0)}</div>
                <div className="chat-meta">
                  <div className="chat-title">{c.title}</div>
                  <div className="chat-sub">Tap to open</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">Made by BodhitaMinds</div>
      </aside>
    </>
  );
};

export default Sidebar;
