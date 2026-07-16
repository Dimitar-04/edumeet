import {
  AccountType,
  type SignUpFormValues,
} from './auth';

interface RegisterCredentials {
  userName: string;
  email: string;
  phoneNumber: string | null;
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
    logoUrl: string | null;
  };
}

export type RegisterRequest =
  | IndividualRegisterRequest
  | OrganizationRegisterRequest;

export interface RegisteredUserResponse {
  id: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  accountType: AccountType;
  individual: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  organization: {
    id: string;
    name: string;
    website: string | null;
    logoUrl: string | null;
  } | null;
}

export function toRegisterRequest(
  values: SignUpFormValues,
): RegisterRequest {
  const credentials = {
    userName: values.userName.trim(),
    email: values.email.trim(),
    phoneNumber: values.phoneNumber.trim() || null,
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
      logoUrl: values.logoUrl.trim() || null,
    },
  };
}
