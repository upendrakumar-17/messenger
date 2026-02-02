import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar-container">
        <div className="sidebar-header">
            <div className="sidebar-logo">
                B
            </div>
            <div className="sidebar-toggle">
                ☰
            </div>
        </div>
        <div className="sidebar-content">
            <div className='sidebar-newchat-button'>
                + 
            </div>
            <div className='sidebar-chatlist'>
                <div>1</div>
                <div>2</div>
            </div>

        </div>
        <div className="sidebar-footer">

        </div>
    </div>
  )
}

export default Sidebar