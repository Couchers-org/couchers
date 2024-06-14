import React, { createContext, useEffect, useState } from "react";
import NewSearchPage from "./new-search-page";

/**
 * Here will contain the context and all the business logic of the search map page, then all the components will use the context from this controller
 * also the functions which call the API will be defined here, among other things, at the end will render the newSearchPage component 
 */
function NewSearchPageController() {

  return <NewSearchPage />
}

export default NewSearchPageController;