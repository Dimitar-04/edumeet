import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountType } from '../../../src/types/user/auth';
import SignUp from '../../../src/components/auth/SignUp';

const renderForm = (onSubmit = vi.fn()) => {
  render(<SignUp onSubmit={onSubmit} onSwitchMode={vi.fn()} />);
  return onSubmit;
};

async function fillCommonFields() {
  await userEvent.type(screen.getByLabelText('Username'), 'finki-team');
  await userEvent.type(screen.getByLabelText('Email'), 'team@finki.ukim.mk');
  await userEvent.type(screen.getByLabelText('Password'), 'Password123!');
  await userEvent.type(
    screen.getByLabelText('Confirm password'),
    'Password123!',
  );
}

describe('SignUp', () => {
  it('submits valid organization values and the selected image', async () => {
    const onSubmit = renderForm();
    const image = new File(['image bytes'], 'team.png', {
      type: 'image/png',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Organization' }),
    );
    await fillCommonFields();
    await userEvent.type(
      screen.getByLabelText('Organization name'),
      'FINKI Testing Team',
    );
    await userEvent.type(
      screen.getByLabelText(/Website/),
      'https://example.com',
    );
    await userEvent.upload(screen.getByLabelText(/Profile picture/), image);
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(onSubmit).toHaveBeenCalledWith({
      accountType: AccountType.Organization,
      userName: 'finki-team',
      email: 'team@finki.ukim.mk',
      phoneNumber: '',
      image,
      name: 'FINKI Testing Team',
      website: 'https://example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
  });

  it('shows a validation error and does not submit mismatched passwords', async () => {
    const onSubmit = renderForm();

    await userEvent.type(screen.getByLabelText('Username'), 'student');
    await userEvent.type(screen.getByLabelText('Email'), 'student@example.com');
    await userEvent.type(screen.getByLabelText('First name'), 'Test');
    await userEvent.type(screen.getByLabelText('Last name'), 'Student');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123!');
    await userEvent.type(
      screen.getByLabelText('Confirm password'),
      'Different123!',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Passwords must match.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects an image larger than five megabytes', async () => {
    renderForm();
    const oversizedImage = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'large.png',
      { type: 'image/png' },
    );

    await userEvent.upload(
      screen.getByLabelText(/Profile picture/),
      oversizedImage,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The profile picture cannot exceed 5 MB.',
    );
    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
  });

  it('renders a backend submission error accessibly', () => {
    render(
      <SignUp
        onSubmit={vi.fn()}
        onSwitchMode={vi.fn()}
        submitError="The username is already taken."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The username is already taken.',
    );
  });
});
