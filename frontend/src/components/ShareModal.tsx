import React, { useState } from 'react';
import { listShares, shareDocument, revokeShare } from '../api/documents';

interface ShareModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ documentId, isOpen, onClose }) => {
  const [shares, setShares] = useState<Array<{ id: string; email: string; name: string }>>([]);
  const [emailInput, setEmailInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch shares when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen]);

  const loadShares = async () => {
    try {
      setLoading(true);
      setError(null);
      const sharesList = await listShares(documentId);
      setShares(sharesList);
    } catch (err) {
      setError('Failed to load shares');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!emailInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await shareDocument(documentId, emailInput.trim());
      setEmailInput('');
      setSuccess('Document shared successfully!');

      // Refresh shares list
      await loadShares();
    } catch (err: any) {
      setError(err.message || 'Failed to share document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (userIdToRevoke: string) => {
    try {
      setLoading(true);
      setError(null);
      await revokeShare(documentId, userIdToRevoke);

      // Refresh shares list
      await loadShares();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke share');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share Document</h2>
          <button onClick={onClose} className="share-modal-close">
            ×
          </button>
        </div>

        <div className="share-modal-body">
          {success && (
            <div className="share-modal-success">{success}</div>
          )}

          {error && (
            <div className="share-modal-error">{error}</div>
          )}

          <div className="share-modal-section">
            <h3>Share with someone</h3>
            <div className="share-modal-input-group">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email address"
                disabled={loading}
              />
              <button onClick={handleShare} disabled={loading || !emailInput.trim()}>
                {loading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>

          <div className="share-modal-section">
            <h3>Shared with ({shares.length})</h3>
            {shares.length === 0 ? (
              <p>No one shared yet</p>
            ) : (
              <ul className="share-modal-shares-list">
                {shares.map(share => (
                  <li key={share.id} className="share-modal-share-item">
                    <span>{share.name} ({share.email})</span>
                    <button
                      onClick={() => handleRevoke(share.id)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};