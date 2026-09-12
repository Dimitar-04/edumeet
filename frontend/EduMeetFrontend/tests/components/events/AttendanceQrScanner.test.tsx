import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AttendanceQrScanner from '../../../src/components/events/AttendanceQrScanner';

const qrMocks = vi.hoisted(() => ({
  decodeFromConstraints: vi.fn(),
}));

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints = qrMocks.decodeFromConstraints;
  },
}));

interface ScanResult {
  getText: () => string;
}

interface ScannerControls {
  stop: ReturnType<typeof vi.fn>;
}

type ScanCallback = (
  result: ScanResult | undefined,
  error: unknown,
  controls: ScannerControls,
) => void;

describe('AttendanceQrScanner', () => {
  beforeEach(() => {
    qrMocks.decodeFromConstraints.mockReset();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
  });

  it('submits a trimmed scan once and ignores repeated scanner callbacks', async () => {
    const controls: ScannerControls = { stop: vi.fn() };
    let scanCallback: ScanCallback | undefined;
    qrMocks.decodeFromConstraints.mockImplementation(
      async (_constraints, _video, callback: ScanCallback) => {
        scanCallback = callback;
        return controls;
      },
    );
    const onCodeDetected = vi.fn().mockResolvedValue(undefined);
    render(<AttendanceQrScanner onCodeDetected={onCodeDetected} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open camera' }));
    await screen.findByText('Camera live');
    await waitFor(() => expect(scanCallback).toBeDefined());

    act(() => {
      scanCallback?.(
        { getText: () => '  ABCD-EFGH-IJKL  ' },
        undefined,
        controls,
      );
      scanCallback?.(
        { getText: () => 'SECOND-CODE' },
        undefined,
        controls,
      );
    });

    expect(onCodeDetected).toHaveBeenCalledOnce();
    expect(onCodeDetected).toHaveBeenCalledWith('ABCD-EFGH-IJKL');
    expect(controls.stop).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Scan next attendee' }),
    ).toBeInTheDocument();
  });

  it('shows a useful message when camera permission is denied', async () => {
    qrMocks.decodeFromConstraints.mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError'),
    );
    render(<AttendanceQrScanner onCodeDetected={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open camera' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Camera permission was denied.',
    );
    expect(screen.getByText('Camera off')).toBeInTheDocument();
  });
});
