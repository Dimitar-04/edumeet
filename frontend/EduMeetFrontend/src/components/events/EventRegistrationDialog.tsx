import { useEffect, useRef } from 'react';

export type RegistrationAction = 'register' | 'unregister';
export type RegistrationDialogPhase = 'confirm' | 'success' | 'error';

interface EventRegistrationDialogProps {
  open: boolean;
  phase: RegistrationDialogPhase;
  action: RegistrationAction;
  eventTitle: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

function EventRegistrationDialog({
  open,
  phase,
  action,
  eventTitle,
  isSubmitting,
  errorMessage,
  onConfirm,
  onClose,
}: EventRegistrationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const isRegistering = action === 'register';
  const title =
    phase === 'confirm'
      ? isRegistering
        ? 'Register for this event?'
        : 'Cancel your registration?'
      : phase === 'success'
        ? isRegistering
          ? "You're registered."
          : 'Registration cancelled.'
        : 'Registration could not be updated.';

  const description =
    phase === 'confirm'
      ? isRegistering
        ? `Confirm your place at ${eventTitle}.`
        : `You will give up your place at ${eventTitle}. You can register again later if places are still available.`
      : phase === 'success'
        ? isRegistering
          ? `Your place at ${eventTitle} has been reserved.`
          : `You are no longer registered for ${eventTitle}.`
        : errorMessage ?? 'Please try again.';

  return (
    <dialog
      ref={dialogRef}
      className="registration-dialog"
      aria-labelledby="registration-dialog-title"
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
        <p className="registration-dialog-eyebrow">
          {phase === 'confirm' ? 'Confirm action' : 'Event registration'}
        </p>
        <h2 id="registration-dialog-title">{title}</h2>
        <p>{description}</p>

        <div className="registration-dialog-actions">
          {phase === 'confirm' ? (
            <>
              <button
                className="button button-secondary"
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Keep as is
              </button>
              <button
                className={
                  isRegistering
                    ? 'button button-primary'
                    : 'button button-danger'
                }
                type="button"
                disabled={isSubmitting}
                onClick={onConfirm}
              >
                {isSubmitting
                  ? 'Updating…'
                  : isRegistering
                    ? 'Register'
                    : 'Unregister'}
              </button>
            </>
          ) : (
            <button
              className="button button-primary"
              type="button"
              onClick={onClose}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default EventRegistrationDialog;
