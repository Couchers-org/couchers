import NewSearchPage from "./new-search-page";
import React from "react";

/**
 * Context which will be queried by the childs components
 */
export const context = React.createContext({
  Results: [],
  BoundingBox: [],
  LocationName: "",
  ExtraTags: "",
  LastActiveFilter: "",
  HostingStatusFilter: "",
  NumberOfGuestsFilter: "",
});
/**
 * Here will contain the context and all the business logic of the search map page, then all the components will use the context from this controller
 * also the functions which call the API will be defined here, among other things, at the end will render the newSearchPage component 
 */
function NewSearchPageController() {



    return <NewSearchPage />;
}

export default NewSearchPageController;