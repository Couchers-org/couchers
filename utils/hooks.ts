import * as Sentry from "@sentry/nextjs";
import { LngLat } from "maplibre-gl";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { NominatimPlace, simplifyPlaceDisplayName } from "utils/nominatim";

function useIsMounted() {
  const isMounted = useRef(false);

  useLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

function useSafeState<State>(
  isMounted: MutableRefObject<boolean>,
  initialState: State | (() => State)
): [State, Dispatch<SetStateAction<State>>] {
  const [state, setState] = useState(initialState);

  const safeSetState = useCallback(
    (newState: SetStateAction<State>) => {
      if (isMounted.current) {
        setState(newState);
      }
    },
    [isMounted]
  );

  return [state, safeSetState];
}

export interface GeocodeResult {
  name: string;
  simplifiedName: string;
  location: LngLat;
  isRegion?: boolean;
}

const NOMINATIM_URL = process.env.NEXT_PUBLIC_NOMINATIM_URL;

const useGeocodeQuery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [results, setResults] = useState<GeocodeResult[] | undefined>(
    undefined
  );

  const query = useCallback(async (value: string) => {
    if (!value) {
      return;
    }
    setIsLoading(true);
    setError(undefined);
    setResults(undefined);
    const url = `${NOMINATIM_URL!}search?format=jsonv2&q=${encodeURIComponent(
      value
    )}&addressdetails=1`;
    const fetchOptions = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
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
        setResults(
          nominatimResults.map((result) => {
            return {
              location: new LngLat(
                Number(result["lon"]),
                Number(result["lat"])
              ),
              name: result["display_name"],
              simplifiedName: simplifyPlaceDisplayName(result),
              isRegion: !("city" in result.address),
            };
          })
        );
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
  }, []);

  return { isLoading, error, results, query };
};

function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export { useGeocodeQuery, useIsMounted, usePrevious, useSafeState };
