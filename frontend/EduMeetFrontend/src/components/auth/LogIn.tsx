import { useState, type FormEvent } from 'react';
import type { LogInFormProps, LogInFormValues } from '../../types/user/auth';

const inputClassName = 'auth-input';

const initialValues: LogInFormValues = {
  emailOrUserName: '',
  password: '',
};

function LogIn({
  onSubmit,
  onSwitchMode,
  isSubmitting = false,
  submitError,
}: LogInFormProps) {
  const [values, setValues] = useState<LogInFormValues>(initialValues);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(values);
  };

  return (
    <section
      className="auth-card auth-card-login"
      aria-labelledby="login-title"
    >
      <p className="auth-kicker">Welcome back</p>
      <h1 id="login-title" className="auth-title">
        Log in to EduMeet
      </h1>
      <p className="auth-subtitle">Continue discovering and hosting events.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label
          className="auth-label"
          htmlFor="login-identifier"
        >
          Email or username
        </label>
        <input
          className={inputClassName}
          id="login-identifier"
          type="text"
          name="emailOrUserName"
          value={values.emailOrUserName}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              emailOrUserName: event.target.value,
            }))
          }
          autoComplete="username"
          required
        />

        <label className="auth-label" htmlFor="login-password">
          Password
        </label>
        <input
          className={inputClassName}
          id="login-password"
          type="password"
          name="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          autoComplete="current-password"
          required
        />

        <button
          className="auth-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>

        {submitError ? (
          <p className="mt-2 text-sm font-medium text-red-700" role="alert">
            {submitError}
          </p>
        ) : null}
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <button
          className="auth-switch-button"
          type="button"
          onClick={onSwitchMode}
        >
          Sign up
        </button>
      </p>
    </section>
  );
}

export default LogIn;
