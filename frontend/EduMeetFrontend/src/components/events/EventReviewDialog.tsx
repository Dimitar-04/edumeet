import { useEffect, useRef } from 'react';

export type ReviewDialogPhase = 'form' | 'success' | 'error';

interface EventReviewDialogProps {
  open: boolean;
  phase: ReviewDialogPhase;
  eventTitle: string;
  grade: number;
  description: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onGradeChange: (grade: number) => void;
  onDescriptionChange: (description: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function EventReviewDialog({
  open,
  phase,
  eventTitle,
  grade,
  description,
  isSubmitting,
  errorMessage,
  onGradeChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}: EventReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canSubmit = grade >= 1 && grade <= 5 && description.trim().length >= 3;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="registration-dialog review-dialog"
      aria-labelledby="review-dialog-title"
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
        <p className="registration-dialog-eyebrow">Event review</p>

        {phase === 'form' ? (
          <>
            <h2 id="review-dialog-title">How was {eventTitle}?</h2>
            <p>Share a rating and a short note about your experience.</p>

            <div className="review-grade-field">
              <span id="review-grade-label">Your rating</span>
              <div role="group" aria-labelledby="review-grade-label">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={grade === value}
                    onClick={() => onGradeChange(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <label className="review-description-field">
              <span>Your experience</span>
              <textarea
                value={description}
                maxLength={1000}
                placeholder="Write your review here..."
                onChange={(event) => onDescriptionChange(event.target.value)}
              />
              <small>{description.length} / 1000</small>
            </label>

            <div className="registration-dialog-actions">
              <button
                className="button button-secondary"
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                type="button"
                disabled={isSubmitting || !canSubmit}
                onClick={onSubmit}
              >
                {isSubmitting ? 'Publishing…' : 'Publish review'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="review-dialog-title">
              {phase === 'success'
                ? 'Thank you for reviewing.'
                : 'Your review could not be published.'}
            </h2>
            <p>
              {phase === 'success'
                ? 'Your rating is now included in the event score.'
                : (errorMessage ?? 'Please try again.')}
            </p>
            <div className="registration-dialog-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

export default EventReviewDialog;
