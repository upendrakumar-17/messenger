import React from 'react'
import './Footer.css' // optional if you want separate styles
import { FiMoreVertical } from 'react-icons/fi'
import { FaPlay, FaStop } from 'react-icons/fa'
import { MdClear } from 'react-icons/md'

const Footer = ({
  isListening,
  onToggleListening,
  onCancel,
}) => {
  return (
    <footer className="chatpage-input" role="contentinfo">
      <div className="footer-controls">
        <button
          type="button"
          className={`footer-btn footer-btn-primary ${isListening ? 'listening' : ''}`}
          onClick={onToggleListening}
          aria-pressed={!!isListening}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
          title={isListening ? 'Stop' : 'Start'}
        >
          {isListening ? <FaStop aria-hidden/> : <FaPlay aria-hidden/>}
          <span className="visually-hidden">{isListening ? 'Stop listening' : 'Start listening'}</span>
        </button>

        <button
          type="button"
          className="footer-btn footer-btn-ghost"
          onClick={onCancel}
          aria-label="Cancel"
          title="Cancel"
        >
          <MdClear aria-hidden/>
          <span className="visually-hidden">Cancel</span>
        </button>
      </div>

      <div className="footer-visuals" aria-hidden>
        <div className="mic-wrap">
          <div className={`mic-dot ${isListening ? 'pulse' : ''}`}></div>
        </div>
      </div>

      <div className="footer-menu">
        <button className="footer-btn footer-menu-btn" aria-label="More options" title="More">
          <FiMoreVertical aria-hidden/>
        </button>
      </div>
    </footer>
  )
}

export default Footer
