import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { listDocuments, createDocument } from '../api/documents';
import { ImportButton } from '../components/ImportButton';
import '../components/ImportButton.css';
import type { Document } from '../types';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [ownedDocuments, setOwnedDocuments] = useState<Document[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const { owned, shared } = await listDocuments();
        setOwnedDocuments(owned);
        setSharedDocuments(shared);
      } catch (err) {
        setError('Failed to load documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleNewDocument = async () => {
    try {
      const newDoc = await createDocument();
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      setError('Failed to create document');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <button onClick={handleNewDocument}>New Document</button>
        <ImportButton
          onImportSuccess={(documentId) => {
            navigate(`/documents/${documentId}`);
          }}
        />
        <button onClick={() => {
          logout();
          navigate('/login');
        }}>Logout</button>
      </div>

      <div>
        <h2>My Documents</h2>
        {ownedDocuments.length === 0 ? (
          <p>No documents yet.</p>
        ) : (
          <ul>
            {ownedDocuments.map(doc => (
              <li key={doc.id}>
                <Link to={`/documents/${doc.id}`}>{doc.title || 'Untitled'}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2>Shared with Me</h2>
        {sharedDocuments.length === 0 ? (
          <p>No shared documents.</p>
        ) : (
          <ul>
            {sharedDocuments.map(doc => (
              <li key={doc.id}>
                <Link to={`/documents/${doc.id}`}>{doc.title || 'Untitled'}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};