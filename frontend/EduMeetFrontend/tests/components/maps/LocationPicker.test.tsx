import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SelectedLocation } from '../../../src/types/location';
import LocationPicker from '../../../src/components/maps/LocationPicker';

const mapsMocks = vi.hoisted(() => ({
  importLibrary: vi.fn(),
  setOptions: vi.fn(),
  mapConstructor: vi.fn(),
  markerConstructor: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  fitBounds: vi.fn(),
  autocompleteElement: null as HTMLElement | null,
}));

vi.mock('@googlemaps/js-api-loader', () => ({
  importLibrary: mapsMocks.importLibrary,
  setOptions: mapsMocks.setOptions,
}));

function configureSuccessfulMapsMock() {
  class FakeMap {
    setCenter = mapsMocks.setCenter;
    setZoom = mapsMocks.setZoom;
    fitBounds = mapsMocks.fitBounds;

    constructor(container: HTMLElement, options: unknown) {
      mapsMocks.mapConstructor(container, options);
    }
  }

  class FakeMarker {
    map: unknown;
    position: unknown;
    title: string | undefined;

    constructor(options: {
      map: unknown;
      position: unknown;
      title?: string;
    }) {
      this.map = options.map;
      this.position = options.position;
      this.title = options.title;
      mapsMocks.markerConstructor(options);
    }
  }

  function FakeAutocomplete() {
    const element = document.createElement('div');
    mapsMocks.autocompleteElement = element;
    return element;
  }

  mapsMocks.importLibrary.mockImplementation(async (library: string) => {
    if (library === 'maps') return { Map: FakeMap };
    if (library === 'places') {
      return { PlaceAutocompleteElement: FakeAutocomplete };
    }
    if (library === 'marker') return { AdvancedMarkerElement: FakeMarker };
    throw new Error(`Unexpected Google Maps library: ${library}`);
  });
}

describe('LocationPicker', () => {
  beforeEach(() => {
    mapsMocks.importLibrary.mockReset();
    mapsMocks.setOptions.mockClear();
    mapsMocks.mapConstructor.mockClear();
    mapsMocks.markerConstructor.mockClear();
    mapsMocks.setCenter.mockClear();
    mapsMocks.setZoom.mockClear();
    mapsMocks.fitBounds.mockClear();
    mapsMocks.autocompleteElement = null;
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-maps-key');
    configureSuccessfulMapsMock();
  });

  it('initializes the map and marker from the selected coordinates', async () => {
    const selected: SelectedLocation = {
      googlePlaceId: 'place-1',
      locationName: 'FINKI',
      address: 'Rugjer Boshkovikj 16, Skopje',
      latitude: 42.004,
      longitude: 21.409,
    };
    render(<LocationPicker value={selected} onChange={vi.fn()} />);

    await waitFor(() => expect(mapsMocks.mapConstructor).toHaveBeenCalled());
    expect(mapsMocks.mapConstructor.mock.calls[0][1]).toMatchObject({
      center: { lat: 42.004, lng: 21.409 },
      zoom: 16,
    });
    expect(mapsMocks.markerConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { lat: 42.004, lng: 21.409 },
        title: 'FINKI',
      }),
    );
    expect(screen.getByText('FINKI')).toBeInTheDocument();
    expect(
      document.querySelector<HTMLInputElement>('input[name="latitude"]')
        ?.value,
    ).toBe('42.004');
  });

  it('turns a Google place selection into EduMeet location data', async () => {
    const onChange = vi.fn();
    const fetchFields = vi.fn().mockResolvedValue(undefined);
    const place = {
      id: 'google-place-42',
      displayName: 'National Library',
      formattedAddress: 'Boulevard Goce Delchev, Skopje',
      location: {
        lat: () => 42.0008,
        lng: () => 21.4144,
      },
      viewport: null,
      fetchFields,
    };
    render(<LocationPicker value={null} onChange={onChange} />);
    await waitFor(() =>
      expect(mapsMocks.autocompleteElement).not.toBeNull(),
    );

    const event = new Event('gmp-select') as Event & {
      placePrediction: { toPlace: () => typeof place };
    };
    event.placePrediction = { toPlace: () => place };
    fireEvent(mapsMocks.autocompleteElement!, event);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        googlePlaceId: 'google-place-42',
        locationName: 'National Library',
        address: 'Boulevard Goce Delchev, Skopje',
        latitude: 42.0008,
        longitude: 21.4144,
      }),
    );
    expect(fetchFields).toHaveBeenCalledWith({
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'viewport'],
    });
    expect(mapsMocks.setCenter).toHaveBeenCalledWith(place.location);
    expect(mapsMocks.setZoom).toHaveBeenCalledWith(16);
  });

  it('shows a safe error when Google Maps initialization fails', async () => {
    mapsMocks.importLibrary.mockRejectedValue(new Error('Google unavailable'));
    render(<LocationPicker value={null} onChange={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Google Maps could not load.',
    );
  });
});
