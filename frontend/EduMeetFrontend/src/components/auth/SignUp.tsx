import { useState, type FormEvent } from 'react';
import type { SignUpFormProps, SignUpFormValues } from '../../types/user/auth';
import './auth.css';

const initialValues: SignUpFormValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function SignUp({ onSubmit, onSwitchMode }: SignUpFormProps) {
  const [values, setValues] = useState<SignUpFormValues>(initialValues);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.password !== values.confirmPassword) {
      setPasswordError('Passwords must match.');
      return;
    }

    setPasswordError('');
    void onSubmit?.(values);
  };

  return (
    <section className="auth-card" aria-labelledby="signup-title">
      <h1 id="signup-title">Create your account</h1>
      <p className="auth-card__intro">Join EduMeet and start learning together.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="signup-name">Full name</label>
        <input
          id="signup-name"
          type="text"
          name="fullName"
          value={values.fullName}
          onChange={(event) =>
            setValues((current) => ({ ...current, fullName: event.target.value }))
          }
          autoComplete="name"
          required
        />

        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          name="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          autoComplete="email"
          required
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          name="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label htmlFor="signup-confirm-password">Confirm password</label>
        <input
          id="signup-confirm-password"
          type="password"
          name="confirmPassword"
          value={values.confirmPassword}
          onChange={(event) => {
            setValues((current) => ({
              ...current,
              confirmPassword: event.target.value,
            }));
            setPasswordError('');
          }}
          autoComplete="new-password"
          aria-describedby={passwordError ? 'password-error' : undefined}
          aria-invalid={Boolean(passwordError)}
          minLength={8}
          required
        />
        {passwordError && (
          <p id="password-error" className="auth-form__error" role="alert">
            {passwordError}
          </p>
        )}

        <button className="auth-form__submit" type="submit">
          Sign up
        </button>
      </form>

      <p className="auth-card__switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchMode}>
          Log in
        </button>
      </p>
    </section>
  );
}

export default SignUp;
