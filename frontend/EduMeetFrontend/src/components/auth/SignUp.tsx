import { useState, type FormEvent } from 'react';
import {
  AccountType,
  type SignUpFormProps,
  type SignUpFormValues,
} from '../../types/user/auth';

const inputClassName = 'auth-input';
const labelClassName = 'auth-label';

interface SignUpFormState {
  accountType: AccountType;
  userName: string;
  email: string;
  phoneNumber: string;
  image: File | null;
  firstName: string;
  lastName: string;
  name: string;
  website: string;
  password: string;
  confirmPassword: string;
}

const initialValues: SignUpFormState = {
  accountType: AccountType.Individual,
  userName: '',
  email: '',
  phoneNumber: '',
  image: null,
  firstName: '',
  lastName: '',
  name: '',
  website: '',
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
  const [imageError, setImageError] = useState('');

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
      image: values.image,
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
          };

    void onSubmit(formValues);
  };

  return (
    <section
      className="auth-card auth-card-signup"
      aria-labelledby="signup-title"
    >
      <p className="auth-kicker">Join the community</p>
      <h1 id="signup-title" className="auth-title">
        Create your account
      </h1>
      <p className="auth-subtitle">
        Join EduMeet and start learning together.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <span className={labelClassName} id="account-type-label">
          Account type
        </span>
        <div
          className="auth-account-toggle"
          role="group"
          aria-labelledby="account-type-label"
        >
          <span
            className={`auth-account-pill ${
              values.accountType === AccountType.Organization
                ? 'translate-x-full'
                : 'translate-x-0'
            }`}
            aria-hidden="true"
          />

          <button
            className={`auth-account-option ${
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
            className={`auth-account-option ${
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
          Phone number{' '}
          <span className="font-normal text-slate-500">(optional)</span>
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

        <label className={labelClassName} htmlFor="signup-image">
          Profile picture{' '}
          <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <div className="auth-file-field">
          <input
            className="auth-file-input"
            id="signup-image"
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              if (file && file.size > 5 * 1024 * 1024) {
                setImageError('The profile picture cannot exceed 5 MB.');
                setValues((current) => ({ ...current, image: null }));
                event.target.value = '';
                return;
              }

              setImageError('');
              setValues((current) => ({ ...current, image: file }));
            }}
            aria-describedby={imageError ? 'image-error' : 'image-help'}
            aria-invalid={Boolean(imageError)}
          />
          <p className="mt-2 text-xs text-slate-500" id="image-help">
            JPEG, PNG or WebP, up to 5 MB.
          </p>
          {values.image && (
            <p className="mt-2 truncate text-sm font-medium text-slate-700">
              Selected: {values.image.name}
            </p>
          )}
          {imageError && (
            <p
              id="image-error"
              className="mt-2 text-sm text-red-700"
              role="alert"
            >
              {imageError}
            </p>
          )}
        </div>

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
              Website{' '}
              <span className="font-normal text-slate-500">(optional)</span>
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
          className="auth-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button
          className="auth-switch-button"
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
