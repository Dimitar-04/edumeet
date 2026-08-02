import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import type { SelectedLocation } from "../../types/location";

interface LocationPickerProps {
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
  error?: string;
}

const defaultCenter = {
  lat: 41.9981,
  lng: 21.4254,
};

let configuredApiKey: string | null = null;

function configureMaps(apiKey: string) {
  if (configuredApiKey) return;

  setOptions({
    key: apiKey,
    v: "weekly",
    language: "en",
    region: "MK",
  });

  configuredApiKey = apiKey;
}

function LocationPicker({ value, onChange, error }: LocationPickerProps) {
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const mapId =
    import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || "DEMO_MAP_ID";

  useEffect(() => {
    const autocompleteContainer = autocompleteContainerRef.current;
    const mapContainer = mapContainerRef.current;

    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    if (!autocompleteContainer || !mapContainer) return;

    let isCancelled = false;
    let marker: google.maps.marker.AdvancedMarkerElement | null = null;

    const initialize = async () => {
      try {
        configureMaps(apiKey);

        const [
          { Map },
          { PlaceAutocompleteElement },
          { AdvancedMarkerElement },
        ] = await Promise.all([
          importLibrary("maps"),
          importLibrary("places"),
          importLibrary("marker"),
        ]);

        if (isCancelled) return;

        const map = new Map(mapContainer, {
          center: value
            ? { lat: value.latitude, lng: value.longitude }
            : defaultCenter,
          zoom: value ? 16 : 12,
          mapId,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });

        marker = new AdvancedMarkerElement({
          map,
          position: value
            ? { lat: value.latitude, lng: value.longitude }
            : null,
          title: value?.locationName,
        });

        const autocomplete = new PlaceAutocompleteElement({
          includedRegionCodes: ["mk"],
        });

        autocomplete.className = "google-place-autocomplete";
        autocomplete.placeholder = "Search for a venue or address";
        autocompleteContainer.replaceChildren(autocomplete);

        // Listener for location change
        autocomplete.addEventListener(
          "gmp-select",
          async (event: google.maps.places.PlacePredictionSelectEvent) => {
            const place = event.placePrediction.toPlace();

            await place.fetchFields({
              fields: [
                "id",
                "displayName",
                "formattedAddress",
                "location",
                "viewport",
              ],
            });

            if (!place.location) {
              setLoadError("Google could not find coordinates for this place.");
              return;
            }

            const selectedLocation: SelectedLocation = {
              googlePlaceId: place.id,
              locationName: place.displayName ?? "Selected location",
              address: place.formattedAddress ?? "",
              latitude: place.location.lat(),
              longitude: place.location.lng(),
            };

            marker!.position = place.location;
            marker!.title = selectedLocation.locationName;

            if (place.viewport) {
              map.fitBounds(place.viewport);
            } else {
              map.setCenter(place.location);
              map.setZoom(16);
            }

            setLoadError(null);
            onChange(selectedLocation);
          },
        );

        setIsLoading(false);
      } catch {
        if (!isCancelled) {
          setLoadError(
            "Google Maps could not load. Check the API key and enabled APIs.",
          );
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isCancelled = true;

      if (marker) marker.map = null;
      autocompleteContainer.replaceChildren();
    };
  }, [apiKey, mapId]);

  if (!apiKey) {
    return (
      <div className="location-picker-unconfigured" role="note">
        <strong>Google Maps needs an API key</strong>
        <p>
          Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your local environment to
          enable venue search.
        </p>
      </div>
    );
  }

  return (
    <div className="location-picker">
      <div className="location-search-shell">
        {isLoading ? (
          <span className="location-search-loading">
            Loading location search&hellip;
          </span>
        ) : null}
        <div className="location-search" ref={autocompleteContainerRef} />
      </div>

      <div
        className="location-map"
        ref={mapContainerRef}
        aria-label="Map showing the selected event location"
      />

      {value ? (
        <div className="selected-location" aria-live="polite">
          <strong>{value.locationName}</strong>
          <span>{value.address}</span>
        </div>
      ) : (
        <p className="location-help">
          Start typing above, then choose one of Google&apos;s suggestions.
        </p>
      )}

      {loadError || error ? (
        <p className="location-error" role="alert">
          {loadError ?? error}
        </p>
      ) : null}

      <input
        type="hidden"
        name="locationName"
        value={value?.locationName ?? ""}
      />
      <input type="hidden" name="address" value={value?.address ?? ""} />
      <input type="hidden" name="latitude" value={value?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={value?.longitude ?? ""} />
      <input
        type="hidden"
        name="googlePlaceId"
        value={value?.googlePlaceId ?? ""}
      />
    </div>
  );
}

export default LocationPicker;
