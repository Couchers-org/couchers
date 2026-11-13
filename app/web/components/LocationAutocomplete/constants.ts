// Debounced typeahead: wait this long after the last keystroke before querying,
// and require at least this many characters before firing a request.
export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;

// When the geocoder returns [], inject a fake option that looks like “No results”,
// mark it disabled, and ignore selecting it. Reason: MUI's autocompletes in
// `freeSolo` mode never render `noOptionsText`.
export const NO_RESULTS_ID = "__no_results__";
