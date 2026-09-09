import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importDocument } from '../api/documents';

interface ImportButtonProps {
  onImportSuccess?: (documentId: string) => void;
}

export const ImportButton: React.FC<ImportButtonProps> = ({ onImportSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const importedDoc = await importDocument(file);
      setLoading(false);

      // Navigate to the newly imported document
      navigate(`/documents/${importedDoc.id}`);

      // Call optional callback if provided
      if (onImportSuccess) {
        onImportSuccess(importedDoc.id);
      }
    } catch (err: any) {
      setLoading(false);
      // Use the backend's error message directly
      setError(err.message || 'Failed to import document');
      console.error(err);
    } finally {
      // Reset file input to allow re-selecting the same file
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileChange}
        disabled={loading}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => {
          // Find the file input and trigger click
          const fileInput = document.querySelector('input[type="file"].import-button-input') as HTMLInputElement | null;
          if (fileInput) {
            fileInput.click();
          }
        }}
        disabled={loading}
        className="import-button"
      >
        {loading ? 'Importing...' : 'Import Document'}
      </button>
      {error && (
        <div className="import-error" style={{ color: 'red', marginTop: '8px' }}>
          {error}
        </div>
      )}
    </div>
  );
};