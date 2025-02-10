const actionTypes = {
  SET_FILTER: "SET_FILTER",
  RESET_FILTERS: "RESET_FILTERS",
};

const initialState = {
  queryName: "",
  locationResult: undefined,
  searchType: "location",
  lastActiveFilter: 0,
  hostingStatusFilter: [],
  numberOfGuestFilter: undefined,
  completeProfileFilter: false,
};

const mapSearchReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_FILTER:
      return { ...state, [action.payload.key]: action.payload.value };
    case actionTypes.RESET_FILTERS:
      return initialState;
    default:
      return state;
  }
};

export { mapSearchReducer };
