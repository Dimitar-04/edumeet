import { useState, type FormEvent } from 'react';
import {
  AccountType,
  type SignUpFormProps,
  type SignUpFormValues,
} from '../../types/user/auth';

const inputClassName =
  'w-full rounded-lg border border-slate-300 px-3.5 py-3 text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-3 focus:ring-indigo-600/20';
const labelClassName = 'mt-1 text-sm font-semibold';

interface SignUpFormState {
  accountType: AccountType;
  userName: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  name: string;
  website: string;
  logoUrl: string;
  password: string;
  confirmPassword: string;
}

const initialValues: SignUpFormState = {
  accountType: AccountType.Individual,
  userName: '',
  email: '',
  phoneNumber: '',
  firstName: '',
  lastName: '',
  name: '',
  website: '',
  logoUrl: '',
  password: '',
  confirmPassword: '',
};

function SignUp({
  onSubmit,
  onSwitchMode,
  isSubmitting = false,
  submitError,
}: SignUpFormProps) {
  const [values, setValues] = useState<SignUpFormState>(initialValues);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.password !== values.confirmPassword) {
      setPasswordError('Passwords must match.');
      return;
    }

    setPasswordError('');

    const credentials = {
      userName: values.userName,
      email: values.email,
      phoneNumber: values.phoneNumber,
      password: values.password,
      confirmPassword: values.confirmPassword,
    };
    const formValues: SignUpFormValues =
      values.accountType === AccountType.Individual
        ? {
            ...credentials,
            accountType: AccountType.Individual,
            firstName: values.firstName,
            lastName: values.lastName,
          }
        : {
            ...credentials,
            accountType: AccountType.Organization,
            name: values.name,
            website: values.website,
            logoUrl: values.logoUrl,
          };

    void onSubmit(formValues);
  };

  return (
    <section
      className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10"
      aria-labelledby="signup-title"
    >
      <h1 id="signup-title" className="text-3xl font-bold tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 mb-7 text-slate-600">
        Join EduMeet and start learning together.
      </p>

      <form className="grid gap-2.5" onSubmit={handleSubmit}>
        <span className={labelClassName} id="account-type-label">
          Account type
        </span>
        <div
          className="relative isolate grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-inner shadow-slate-300/50"
          role="group"
          aria-labelledby="account-type-label"
        >
          <span
            className={`absolute inset-y-1 left-1 z-0 w-[calc(50%-0.25rem)] rounded-lg bg-slate-900 shadow-md shadow-slate-900/15 ring-1 ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:duration-0 ${
              values.accountType === AccountType.Organization
                ? 'translate-x-full'
                : 'translate-x-0'
            }`}
            aria-hidden="true"
          />

          <button
            className={`relative z-10 cursor-pointer rounded-lg px-3 py-3 text-sm font-semibold tracking-tight transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              values.accountType === AccountType.Individual
                ? 'text-white'
                : 'text-slate-600 hover:text-slate-950'
            }`}
            type="button"
            aria-pressed={values.accountType === AccountType.Individual}
            onClick={() =>
              setValues((current) => ({
                ...current,
                accountType: AccountType.Individual,
              }))
            }
          >
            Individual
          </button>

          <button
            className={`relative z-10 cursor-pointer rounded-lg px-3 py-3 text-sm font-semibold tracking-tight transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              values.accountType === AccountType.Organization
                ? 'text-white'
                : 'text-slate-600 hover:text-slate-950'
            }`}
            type="button"
            aria-pressed={values.accountType === AccountType.Organization}
            onClick={() =>
              setValues((current) => ({
                ...current,
                accountType: AccountType.Organization,
              }))
            }
          >
            Organization
          </button>
        </div>

        <label className={labelClassName} htmlFor="signup-username">
          Username
        </label>
        <input
          className={inputClassName}
          id="signup-username"
          type="text"
          name="userName"
          value={values.userName}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              userName: event.target.value,
            }))
          }
          autoComplete="username"
          required
        />

        <label className={labelClassName} htmlFor="signup-email">
          Email
        </label>
        <input
          className={inputClassName}
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

        <label className={labelClassName} htmlFor="signup-phone">
          Phone number
        </label>
        <input
          className={inputClassName}
          id="signup-phone"
          type="tel"
          name="phoneNumber"
          value={values.phoneNumber}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              phoneNumber: event.target.value,
            }))
          }
          autoComplete="tel"
        />

        {values.accountType === AccountType.Individual ? (
          <>
            <label className={labelClassName} htmlFor="signup-first-name">
              First name
            </label>
            <input
              className={inputClassName}
              id="signup-first-name"
              type="text"
              name="firstName"
              value={values.firstName}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              autoComplete="given-name"
              maxLength={100}
              required
            />

            <label className={labelClassName} htmlFor="signup-last-name">
              Last name
            </label>
            <input
              className={inputClassName}
              id="signup-last-name"
              type="text"
              name="lastName"
              value={values.lastName}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              autoComplete="family-name"
              maxLength={100}
              required
            />
          </>
        ) : (
          <>
            <label
              className={labelClassName}
              htmlFor="signup-organization-name"
            >
              Organization name
            </label>
            <input
              className={inputClassName}
              id="signup-organization-name"
              type="text"
              name="name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              autoComplete="organization"
              maxLength={150}
              required
            />

            <label className={labelClassName} htmlFor="signup-website">
              Website
            </label>
            <input
              className={inputClassName}
              id="signup-website"
              type="url"
              name="website"
              value={values.website}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  website: event.target.value,
                }))
              }
              autoComplete="url"
              maxLength={300}
            />

            <label className={labelClassName} htmlFor="signup-logo-url">
              Logo URL
            </label>
            <input
              className={inputClassName}
              id="signup-logo-url"
              type="url"
              name="logoUrl"
              value={values.logoUrl}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  logoUrl: event.target.value,
                }))
              }
              maxLength={500}
            />
          </>
        )}

        <label className={labelClassName} htmlFor="signup-password">
          Password
        </label>
        <input
          className={inputClassName}
          id="signup-password"
          type="password"
          name="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          autoComplete="new-password"
          required
        />

        <label className={labelClassName} htmlFor="signup-confirm-password">
          Confirm password
        </label>
        <input
          className={inputClassName}
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
          required
        />
        {passwordError && (
          <p
            id="password-error"
            className="m-0 text-sm text-red-700"
            role="alert"
          >
            {passwordError}
          </p>
        )}

        {submitError && (
          <p className="m-0 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        )}

        <button
          className="mt-4 cursor-pointer rounded-lg bg-indigo-700 px-4 py-3 font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-600">
        Already have an account?{' '}
        <button
          className="cursor-pointer font-bold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
          type="button"
          onClick={onSwitchMode}
        >
          Log in
        </button>
      </p>
    </section>
  );
}

export default SignUp;
