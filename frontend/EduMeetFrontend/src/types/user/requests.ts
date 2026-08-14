import {
  AccountType,
  type SignUpFormValues,
} from './auth';

export interface LoginRequest {
  login: string;
  password: string;
}

interface RegisterCredentials {
  userName: string;
  email: string;
  phoneNumber: string | null;
  image: File | null;
  password: string;
  confirmPassword: string;
}

export interface IndividualRegisterRequest extends RegisterCredentials {
  accountType: (typeof AccountType)['Individual'];
  individual: {
    firstName: string;
    lastName: string;
  };
  organization: null;
}

export interface OrganizationRegisterRequest extends RegisterCredentials {
  accountType: (typeof AccountType)['Organization'];
  individual: null;
  organization: {
    name: string;
    website: string | null;
  };
}

export type RegisterRequest =
  | IndividualRegisterRequest
  | OrganizationRegisterRequest;

export interface UpdateProfileImageRequest {
  image: File;
}

export function toRegisterRequest(
  values: SignUpFormValues,
): RegisterRequest {
  const credentials = {
    userName: values.userName.trim(),
    email: values.email.trim(),
    phoneNumber: values.phoneNumber.trim() || null,
    image: values.image,
    password: values.password,
    confirmPassword: values.confirmPassword,
  };

  if (values.accountType === AccountType.Individual) {
    return {
      ...credentials,
      accountType: AccountType.Individual,
      individual: {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      },
      organization: null,
    };
  }

  return {
    ...credentials,
    accountType: AccountType.Organization,
    individual: null,
    organization: {
      name: values.name.trim(),
      website: values.website.trim() || null,
    },
  };
}
