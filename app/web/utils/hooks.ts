import { Coordinates } from "features/search/utils/constants";
import { LngLat } from "maplibre-gl";
import { useRouter } from "next/router";
import Sentry from "platform/sentry";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  filterDuplicatePlaces,
  NominatimPlace,
  simplifyPlaceDisplayName,
} from "utils/nominatim";

// Locations having one of these keys are considered non-regions.
// https://nominatim.org/release-docs/latest/api/Output/#addressdetails
const nonRegionKeys = [
  "municipality",
  "city",
  "town",
  "village",
  "city_district",
  "district",
  "borough",
  "suburb",
  "subdivision",
];

// Bounding box overrides for specific countries
// Some countries return an administrative level bounding box instead of a country level bounding box
// For example, France returns a bounding box for the French territories instead of the country level bounding box
const countryBboxOverrides: Record<string, Coordinates> = {
  // Metropolitan France
  fr: [-5.142, 41.333, 9.559, 51.092],
  // Contiguous United States (excludes Alaska/Hawaii/territories)
  us: [-125.0, 24.396308, -66.93457, 49.384358],
  // Mainland Spain (excludes Canary Islands)
  es: [-9.392883, 35.94685, 3.039484, 43.792366],
  // Mainland Portugal (excludes Azores/Madeira)
  pt: [-9.52657, 36.83827, -6.18916, 42.15431],
  // Mainland Ecuador (excludes Galápagos)
  ec: [-81.0, -5.0, -75.19, 1.66],
  // Mainland Chile (excludes Easter Island)
  cl: [-75.0, -55.95, -66.0, -17.5],
  // New Zealand main islands
  nz: [165.0, -47.5, 179.1, -34.0],
  // Mainland Colombia (excludes San Andrés/Providencia)
  co: [-79.1, -4.3, -66.85, 12.5],
  // Mainland Norway (excludes Svalbard/Jan Mayen)
  no: [4.5, 57.9, 31.7, 71.4],
  // Denmark (excludes Greenland/Faroe)
  dk: [7.9, 54.56, 15.19, 57.75],
  // Netherlands (excludes Caribbean Netherlands)
  nl: [3.36, 50.75, 7.22, 53.7],
};

function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

function useSafeState<State>(
  isMounted: MutableRefObject<boolean>,
  initialState: State | (() => State),
): [State, Dispatch<SetStateAction<State>>] {
  const [state, setState] = useState(initialState);

  const safeSetState = useCallback(
    (newState: SetStateAction<State>) => {
      if (isMounted.current) {
        setState(newState);
      }
    },
    [isMounted],
  );

  return [state, safeSetState];
}

export interface GeocodeResult {
  name: string;
  simplifiedName: string;
  location: LngLat;
  bbox: Coordinates;
  isRegion?: boolean;
}

const NOMINATIM_URL = process.env.NEXT_PUBLIC_NOMINATIM_URL;

const useGeocodeQuery = () => {
  const isMounted = useIsMounted();
  const [isLoading, setIsLoading] = useSafeState(isMounted, false);
  const [error, setError] = useSafeState<string | undefined>(
    isMounted,
    undefined,
  );
  const [results, setResults] = useSafeState<GeocodeResult[] | undefined>(
    isMounted,
    undefined,
  );

  const query = useCallback(
    async (value: string) => {
      if (!value) {
        return;
      }
      setIsLoading(true);
      setError(undefined);
      setResults(undefined);
      const url = `${NOMINATIM_URL!}search?format=jsonv2&q=${encodeURIComponent(
        value,
      )}&addressdetails=1`;
      const fetchOptions = {
        headers: {
          Accept: "application/json",
        },
        method: "GET",
      };
      try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) throw Error(await response.text());

        const nominatimResults: NominatimPlace[] = await response.json();

        if (nominatimResults.length === 0) {
          setResults([]);
        } else {
          const filteredResults = filterDuplicatePlaces(nominatimResults);
          const formattedResults = filteredResults.map((result) => {
            const firstElem = result["boundingbox"].shift() as number;
            const lastElem = result["boundingbox"].pop() as number;
            result["boundingbox"].push(firstElem);
            result["boundingbox"].unshift(lastElem);

            // Apply country-level bbox overrides when available
            const isCountryLevel =
              result.type === "country" || (result.place_rank ?? 99) <= 4;
            const cc = (result.address?.country_code || "").toLowerCase();
            let bbox = result["boundingbox"] as Coordinates;
            if (isCountryLevel && cc && countryBboxOverrides[cc]) {
              bbox = countryBboxOverrides[cc];
            }

            return {
              location: new LngLat(
                Number(result["lon"]),
                Number(result["lat"]),
              ),
              name: result["display_name"],
              simplifiedName: simplifyPlaceDisplayName(result),
              isRegion: !nonRegionKeys.some((k) => k in result.address),
              bbox,
            };
          });

          setResults(formattedResults);
        }
      } catch (e) {
        Sentry.captureException(e, {
          tags: {
            hook: "useGeocodeQuery",
          },
        });
        setError(e instanceof Error ? e.message : "");
      }
      setIsLoading(false);
    },
    [setError, setIsLoading, setResults],
  );

  return { isLoading, error, results, query };
};

function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

function useUnsavedChangesWarning({
  isDirty,
  isSubmitted,
  warningMessage,
}: {
  isDirty: boolean;
  isSubmitted: boolean;
  warningMessage: string;
}) {
  const router = useRouter();
  // https://github.com/vercel/next.js/issues/2694#issuecomment-732990201
  useEffect(() => {
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = warningMessage;
      return;
    };
    const handleBrowseAway = () => {
      if (!isDirty || isSubmitted) return;
      if (window.confirm(warningMessage)) return;
      router.events.emit("routeChangeError");
      throw Error("Cancelled due to unsaved changes");
    };
    window.addEventListener("beforeunload", handleWindowClose);
    router.events.on("routeChangeStart", handleBrowseAway);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, [isDirty, router.events, isSubmitted, warningMessage]);
}

export {
  useGeocodeQuery,
  useIsMounted,
  usePrevious,
  useSafeState,
  useUnsavedChangesWarning,
};
