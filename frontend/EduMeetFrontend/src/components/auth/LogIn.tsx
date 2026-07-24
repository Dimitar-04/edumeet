import { useState, type FormEvent } from 'react';
import type { LogInFormProps, LogInFormValues } from '../../types/user/auth';

const inputClassName =
  'w-full rounded-lg border border-slate-300 px-3.5 py-3 text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/20';

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
      className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10"
      aria-labelledby="login-title"
    >
      <h1 id="login-title" className="text-3xl font-bold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 mb-7 text-slate-600">Log in to continue to EduMeet.</p>

      <form className="grid gap-2.5" onSubmit={handleSubmit}>
        <label
          className="mt-1 text-sm font-semibold"
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

        <label className="mt-1 text-sm font-semibold" htmlFor="login-password">
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
          className="mt-4 cursor-pointer rounded-lg bg-indigo-700 px-4 py-3 font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
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

      <p className="mt-6 text-center text-slate-600">
        Don&apos;t have an account?{' '}
        <button
          className="cursor-pointer font-bold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
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
