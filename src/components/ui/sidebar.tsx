import React, { useState, useRef, useEffect } from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const [width, setWidth] = useState(250);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing.current && sidebarRef.current) {
      // Ensure a minimum width for sidebar
      const newWidth = Math.max(200, e.clientX);
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${width}px`,
        height: '100vh',
        borderRight: '1px solid #ccc',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto'
        }}
      >
        {children}
      </div>
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '5px',
          height: '100%',
          cursor: 'ew-resize',
          backgroundColor: 'transparent'
        }}
      />
    </div>
  );
};

export default Sidebar;