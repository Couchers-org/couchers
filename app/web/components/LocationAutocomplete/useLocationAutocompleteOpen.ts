import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { GeocodeResult } from "utils/hooks";

import { MIN_SEARCH_LENGTH } from "./constants";

type UseLocationAutocompleteOpenArgs = {
  id: string;
  inputValue: string;
  options: GeocodeResult[] | undefined;
  query: (value: string) => void;
  isSubmitMode: boolean;
  searchSubmit: () => void;
  enableSubmitReopen?: boolean;
  freeTextForSubmit?: string;
  submitCount?: number;
  // Called when a form submit reopens the list (telemetry).
  onSubmitReopen?: () => void;
};

/**
 * Controlled open state for location autocomplete: Enter-after-blur reopen,
 * optional RHF submit reopen, and a short ignore window so MUI's blur/onClose
 * does not immediately undo a forced open (e.g. clicking Submit).
 */
export default function useLocationAutocompleteOpen({
  id,
  inputValue,
  options,
  query,
  isSubmitMode,
  searchSubmit,
  enableSubmitReopen = false,
  freeTextForSubmit = "",
  submitCount = 0,
  onSubmitReopen,
}: UseLocationAutocompleteOpenArgs) {
  const [isOpen, setIsOpen] = useState(false);
  // While true, ignore MUI/blur closes so a controlled reopen is not immediately
  // undone (clicking Submit blurs the input first).
  const ignoreCloseRef = useRef(false);
  const ignoreCloseTimeoutRef = useRef<number | undefined>(undefined);
  const lastHandledSubmitCount = useRef(0);

  const openAndKeepOpen = useCallback(() => {
    ignoreCloseRef.current = true;
    setIsOpen(true);
    // Focus so MUI keeps the controlled popup open after a Submit click blur.
    document.getElementById(id)?.focus();
    window.clearTimeout(ignoreCloseTimeoutRef.current);
    // Keep ignoring closes until after MUI's post-focus blur/close cycle.
    ignoreCloseTimeoutRef.current = window.setTimeout(() => {
      ignoreCloseRef.current = false;
    }, 100);
  }, [id]);

  useEffect(
    () => () => {
      window.clearTimeout(ignoreCloseTimeoutRef.current);
    },
    [],
  );

  const closeIfAllowed = useCallback(() => {
    if (!ignoreCloseRef.current) {
      setIsOpen(false);
    }
  }, []);

  // Submit with free text still in the field: reopen so the user can pick a hit
  // (or see "No results") instead of a silent no-op.
  useEffect(() => {
    if (!enableSubmitReopen) return;
    if (submitCount <= lastHandledSubmitCount.current) return;
    lastHandledSubmitCount.current = submitCount;
    if (!freeTextForSubmit) return;
    openAndKeepOpen();
    onSubmitReopen?.();
  }, [enableSubmitReopen, submitCount, freeTextForSubmit, openAndKeepOpen, onSubmitReopen]);

  const handleEnterKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    // Stop the wrapping <form> from submitting. MUI still gets this event and
    // selects the highlighted option, if the list is open on one.
    e.preventDefault();
    // In submit mode Enter is the search trigger, and we have to run it
    // ourselves: MUI's freeSolo "createOption" path is skipped when the typed
    // text is already mirrored into the value.
    if (isSubmitMode && !isOpen) {
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      searchSubmit();
      setIsOpen(true);
      return;
    }
    // Typeahead mode: list was closed (e.g. after blur) with free text still
    // in the field — reopen (and re-query if the previous hits were dropped)
    // so Enter is not a silent no-op.
    if (!isOpen) {
      const trimmed = inputValue.trim();
      if (trimmed.length >= MIN_SEARCH_LENGTH) {
        setIsOpen(true);
        if (!options?.length) {
          query(trimmed);
        }
      }
    }
  };

  return {
    isOpen,
    setIsOpen,
    openAndKeepOpen,
    closeIfAllowed,
    handleEnterKeyDown,
  };
}
