export type AuthMode = 'login' | 'signup';

export interface LogInFormValues {
  email: string;
  password: string;
}

export interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LogInFormProps {
  onSubmit?: (values: LogInFormValues) => void | Promise<void>;
  onSwitchMode: () => void;
}

export interface SignUpFormProps {
  onSubmit?: (values: SignUpFormValues) => void | Promise<void>;
  onSwitchMode: () => void;
}
