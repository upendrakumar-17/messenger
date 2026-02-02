< footer className="chatpage-input" >
  <div>
    {!isListening ? (
      <button onClick={startListening}>🎤 Start</button>
    ) : (
      <button onClick={stopListening}>🛑 Stop</button>
    )}
  </div>

  <div>
    {isListening ? 'Listening...' : 'Mic Off'}
  </div>

  <div>
    <input
      type="text"
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      placeholder="Speak or type..."
    />
  </div>

  <div>
    ☰
  </div>
</footer > 