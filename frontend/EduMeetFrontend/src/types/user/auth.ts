export type AuthMode = 'login' | 'signup';

export const AccountType = {
  Individual: 1,
  Organization: 2,
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export interface LogInFormValues {
  emailOrUserName: string;
  password: string;
}

interface SignUpCredentials {
  userName: string;
  email: string;
  phoneNumber: string;
  image: File | null;
  password: string;
  confirmPassword: string;
}

export interface IndividualSignUpFormValues extends SignUpCredentials {
  accountType: (typeof AccountType)['Individual'];
  firstName: string;
  lastName: string;
}

export interface OrganizationSignUpFormValues extends SignUpCredentials {
  accountType: (typeof AccountType)['Organization'];
  name: string;
  website: string;
}

export type SignUpFormValues =
  | IndividualSignUpFormValues
  | OrganizationSignUpFormValues;

export interface LogInFormProps {
  onSubmit: (values: LogInFormValues) => void | Promise<void>;
  onSwitchMode: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => void | Promise<void>;
  onSwitchMode: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}
