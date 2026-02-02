import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
    const [open, setOpen] = useState(true);
    const [conversations, setConversations] = useState([
        { id: 1, name: 'Chat 1' },
        { id: 2, name: 'Chat 2' },
    ]);
    const [selectedId, setSelectedId] = useState(null);

    const handleToggle = () => setOpen((prev) => !prev);

    const handleNewChat = () => {
        const newId = conversations.length ? Math.max(...conversations.map(c => c.id)) + 1 : 1;
        const newChat = { id: newId, name: `Chat ${newId}` };
        setConversations([newChat, ...conversations]);
        setSelectedId(newId);
    };


    const handleSelect = (id) => setSelectedId(id);

    const handleRename = (id) => {
        const newName = window.prompt('Enter new chat name:');
        if (newName && newName.trim()) {
            setConversations(conversations.map(c => c.id === id ? { ...c, name: newName } : c));
        }
    };

    const handleDelete = (id) => {
        setConversations(conversations.filter(c => c.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    return (
        <>
            <aside
                className="sidebar-root"
                style={{
                    width: open ? 280 : 50,
                    minWidth: open ? 180 : 50,
                    transition: 'width 0.2s',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <button
                    className="sidebar-toggle-btn"
                    onClick={handleToggle}
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}
                >
                    {open ? '<' : '>'}
                </button>
                <div className="sidebar-header" style={{ display: open ? undefined : 'none' }}>
                    <div className='sidebar-logo'>Logo</div>
                    <div className='sidebar-header-toggle' onClick={handleToggle} style={{ cursor: 'pointer' }}>X</div>
                </div>
                <div className="sidebar-content" style={{ display: open ? undefined : 'none' }}>
                    <div className='sidebar-newchats-btn' onClick={handleNewChat} style={{ cursor: 'pointer' }}>+</div>
                    <div className="sidebar-conversation-list">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={
                                    'sidebar-conversation-item' + (selectedId === conv.id ? ' sidebar-conversation-item-selected' : '')
                                }
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 8px 8px 12px',
                                    background: selectedId === conv.id ? '#e0e0e0' : 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: 4,
                                    gap: 4,
                                }}
                                onClick={() => handleSelect(conv.id)}
                            >
                                <span className="sidebar-conversation-name" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.name}</span>
                                <button
                                    className="sidebar-conversation-rename-btn"
                                    title="Rename"
                                    style={{ marginLeft: 4, fontSize: 12, padding: '2px 6px', cursor: 'pointer' }}
                                    onClick={e => { e.stopPropagation(); handleRename(conv.id); }}
                                >✏️</button>
                                <button
                                    className="sidebar-conversation-delete-btn"
                                    title="Delete"
                                    style={{ marginLeft: 2, fontSize: 12, padding: '2px 6px', cursor: 'pointer', color: 'red' }}
                                    onClick={e => { e.stopPropagation(); handleDelete(conv.id); }}
                                >🗑️</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="sidebar-footer" style={{ display: open ? undefined : 'none' }}>
                    <span className="sidebar-footer-text" style={{ fontSize: 12, color: '#888' }}>Sidebar Footer</span>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
