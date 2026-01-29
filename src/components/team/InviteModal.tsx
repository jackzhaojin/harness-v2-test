import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// --- Types ---

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

// --- Helpers ---

/** Basic email validation: non-empty, contains @ and . */
function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}

// --- Component ---

/**
 * Modal for inviting a new team member by email.
 * UI demonstration only — no actual member is created.
 * Follows the compound Modal pattern from ProjectModal.
 */
export function InviteModal({ isOpen, onClose, onSubmit }: InviteModalProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  // Reset form state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setTouched(false);
    }
  }, [isOpen]);

  const trimmedEmail = email.trim();
  const valid = isValidEmail(trimmedEmail);
  const showError = touched && trimmedEmail.length > 0 && !valid;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(trimmedEmail);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>Invite Member</Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            error={showError ? 'Please enter a valid email address' : undefined}
            autoFocus
            data-testid="invite-email-input"
          />
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="outline" onClick={onClose} data-testid="invite-cancel-btn">
            Cancel
          </Button>
          <Button type="submit" disabled={!valid} data-testid="invite-submit-btn">
            Send Invite
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default InviteModal;
