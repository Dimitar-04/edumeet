import { useEffect, useRef } from 'react';

interface DeleteReviewDialogProps {
  open: boolean;
  eventTitle: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

function DeleteReviewDialog({
  open,
  eventTitle,
  isSubmitting,
  errorMessage,
  onConfirm,
  onClose,
}: DeleteReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="registration-dialog"
      aria-labelledby="delete-review-dialog-title"
      onCancel={(event) => {
        if (isSubmitting) {
          event.preventDefault();
          return;
        }

        onClose();
      }}
      onClose={onClose}
    >
      <div className="registration-dialog-content">
        <p className="registration-dialog-eyebrow">Confirm action</p>
        <h2 id="delete-review-dialog-title">Remove your review?</h2>
        <p>
          Your rating and feedback for {eventTitle} will be removed. You can
          submit another review later.
        </p>

        {errorMessage ? (
          <p className="dialog-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="registration-dialog-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Keep review
          </button>
          <button
            className="button button-danger"
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? 'Removing…' : 'Remove review'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default DeleteReviewDialog;
