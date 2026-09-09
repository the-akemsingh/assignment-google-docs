import React from 'react';
import './Toolbar.css';

interface ToolbarProps {
  editor: any; // Tiptap editor instance
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return <div>Editor not available</div>;
  }

  const handleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const handleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const handleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
  };

  const handleHeading1 = () => {
    editor.chain().focus().toggleHeading({ level: 1 }).run();
  };

  const handleHeading2 = () => {
    editor.chain().focus().toggleHeading({ level: 2 }).run();
  };

  const handleParagraph = () => {
    editor.chain().focus().toggleParagraph().run();
  };

  const handleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  const handleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  return (
    <div className="toolbar">
      <button
        className={editor.isActive('bold') ? 'active' : ''}
        onClick={handleBold}
        disabled={!editor}
      >
        B
      </button>
      <button
        className={editor.isActive('italic') ? 'active' : ''}
        onClick={handleItalic}
        disabled={!editor}
      >
        I
      </button>
      <button
        className={editor.isActive('underline') ? 'active' : ''}
        onClick={handleUnderline}
        disabled={!editor}
      >
        U
      </button>
      <button
        className={editor.isActive({ type: 'heading', attrs: { level: 1 } }) ? 'active' : ''}
        onClick={handleHeading1}
        disabled={!editor}
      >
        H1
      </button>
      <button
        className={editor.isActive({ type: 'heading', attrs: { level: 2 } }) ? 'active' : ''}
        onClick={handleHeading2}
        disabled={!editor}
      >
        H2
      </button>
      <button
        className={editor.isActive('paragraph') ? 'active' : ''}
        onClick={handleParagraph}
        disabled={!editor}
      >
        P
      </button>
      <button
        className={editor.isActive('bulletList') ? 'active' : ''}
        onClick={handleBulletList}
        disabled={!editor}
      >
        •
      </button>
      <button
        className={editor.isActive('orderedList') ? 'active' : ''}
        onClick={handleOrderedList}
        disabled={!editor}
      >
        1.
      </button>
    </div>
  );
};