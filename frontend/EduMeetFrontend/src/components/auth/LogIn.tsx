import { useState, type FormEvent } from 'react';
import type { LogInFormProps, LogInFormValues } from '../../types/user/auth';
import './auth.css';

const initialValues: LogInFormValues = {
  email: '',
  password: '',
};

function LogIn({ onSubmit, onSwitchMode }: LogInFormProps) {
  const [values, setValues] = useState<LogInFormValues>(initialValues);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit?.(values);
  };

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <h1 id="login-title">Welcome back</h1>
      <p className="auth-card__intro">Log in to continue to EduMeet.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          name="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          name="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
          autoComplete="current-password"
          required
        />

        <button className="auth-form__submit" type="submit">
          Log in
        </button>
      </form>

      <p className="auth-card__switch">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchMode}>
          Sign up
        </button>
      </p>
    </section>
  );
}

export default LogIn;
