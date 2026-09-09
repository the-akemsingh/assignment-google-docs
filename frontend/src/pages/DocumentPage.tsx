import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDocument, updateDocument } from '../api/documents';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Toolbar } from '../components/Toolbar';
import { ShareModal } from '../components/ShareModal';
import type { Document } from '../types';
import '../components/Toolbar.css';
import '../components/ShareModal.css';

export const DocumentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [titleInput, setTitleInput] = useState<string>('');
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const doc = await getDocument(id!);
        setDocumentData(doc);
        setTitleInput(doc.title || '');
      } catch (err) {
        setError('Failed to load document');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Initialize editor when document loads
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: documentData?.content || null,
    editable: true,
    // onUpdate: ({ editor }) => {
    //   // We'll handle saving explicitly via the Save button
    // },
  });

  useEffect(() => {
    if (!editor || !documentData) return;

    editor.commands.setContent(documentData.content || null);
  }, [editor, documentData]);

  const handleTitleBlur = async () => {
    if (!documentData || titleInput === documentData.title) return;

    try {
      await updateDocument(id!, { title: titleInput });
      setDocumentData(prev => prev ? { ...prev, title: titleInput } : null);
    } catch (err) {
      setError('Failed to update title');
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!documentData || !editor) return;

    setSaveStatus('saving');
    try {
      const updatedDoc = await updateDocument(id!, {
        content: editor.getJSON()
      });
      if (updatedDoc) {
        setDocumentData(updatedDoc);
      }
      setSaveStatus('success');

      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      setSaveStatus('error');
      setError('Failed to save document');
      console.error(err);

      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }
  };

  const handleShareModalOpen = () => {
    setShareModalOpen(true);
  };

  const handleShareModalClose = () => {
    setShareModalOpen(false);
  };

  if (loading) {
    return (
      <div>
        <h1>Document</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Document</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div>
        <h1>Document</h1>
        <p>Document not found.</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  // Check if current user owns the document
  const isOwner = user && documentData.owner_id === user.id;

  return (
    <div>
      <div>
        <button onClick={() => navigate(-1)}>Back to Dashboard</button>
        {/* Share button only visible for document owners */}
        {isOwner && (
          <button onClick={handleShareModalOpen} style={{ marginLeft: '8px' }}>
            Share
          </button>
        )}
      </div>

      <div>
        <h1>Editing: {documentData.title || 'Untitled'}</h1>
        <div>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Enter document title"
            style={{ width: '300px', marginBottom: '16px' }}
          />
        </div>

        <div>
          {!editor || !editor.isEditable ? (
            <p>Loading editor...</p>
          ) : (
            <>
              <Toolbar editor={editor} />
              <EditorContent
                editor={editor}
                style={{
                  minHeight: '400px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              />
              <div>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                </button>
                {saveStatus === 'success' && (
                  <span style={{ color: 'green', marginLeft: '8px' }}>Saved!</span>
                )}
                {saveStatus === 'error' && (
                  <span style={{ color: 'red', marginLeft: '8px' }}>Save failed</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        documentId={id!}
        isOpen={shareModalOpen}
        onClose={handleShareModalClose}
      />
    </div>
  );
};