import React, { createContext, useEffect, useState } from "react";
import NewSearchPage from "./new-search-page";

/**
 * Context which will be queried by the childs components
 */
export const mapContext = createContext({} as any);

/**
 * Here will contain the context and all the business logic of the search map page, then all the components will use the context from this controller
 * also the functions which call the API will be defined here, among other things, at the end will render the newSearchPage component 
 */
function NewSearchPageController() {

  const [results, setResults] = useState([] as any[]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCoords, setInitialCoords] = useState({lng:125, lat:125}); // TODO: this should came from the API
  const [boundingBox, setBoundingBox] = useState([0, 0, 0, 0]);
  const [locationName, setLocationName] = useState("");
  const [extraTags, setExtraTags] = useState("");
  const [lastActiveFilter, setLastActiveFilter] = useState(true);
  const [hostingStatusFilter, setHostingStatusFilter] = useState("");
  const [numberOfGuestsFilter, setNumberOfGuestFilter] = useState("");

  // Fake initial load
  useEffect(() => {
    setTimeout(() => {
      setResults([
        {
          "userId": 18436,
          "username": "David 00",
          "name": "david baqueiro 00",
          "city": "Vigo, Galicia, España",
          "hometown": "Vigo",
          "timezone": "Europe/Madrid",
          "lat": 42.237430861395445,
          "lng": -8.725194502595514,
          "radius": 250,
          "verification": 0,
          "communityStanding": 0,
          "numReferences": 0,
          "gender": "Man",
          "pronouns": "",
          "age": 27,
          "joined": { nanos: 0, seconds: 1660737600 },
          "lastActive": { nanos: 0, seconds: 1717682400 },
          "hostingStatus": 3,
          "meetupStatus": 3,
          "occupation": "Software developer",
          "education": "",
          "aboutMe": "Daviiiid 0000!!!",
          "myTravels": "",
          "thingsILike": "",
          "aboutPlace": "",
          "regionsVisitedList": ["BEL", "FRA", "DEU", "ITA", "MEX", "PRT", "SGP"],
          "regionsLivedList": ["DEU", "ESP"],
          "additionalInformation": "",
          "friends": 3,
          "lastMinute": { value: false },
          "hasPets": { value: false },
          "acceptsPets": { value: false },
          "petDetails": { value: "" },
          "hasKids": { value: false },
          "acceptsKids": { value: false },
          "kidDetails": { value: "" },
          "hasHousemates": { value: false },
          "housemateDetails": { value: "" },
          "wheelchairAccessible": { value: false },
          "smokingAllowed": 1,
          "smokesAtHome": { value: false },
          "drinkingAllowed": { value: false },
          "drinksAtHome": { value: false },
          "otherHostInfo": { value: "![Bildschirmfoto 2023-10-01 um 20.39.53.png" },
          "sleepingArrangement": 1,
          "sleepingDetails": { value: "" },
          "area": { value: "" },
          "houseRules": { value: "" },
          "parking": { value: false },
          "parkingDetails": 1,
          "campingOk": { value: false },
          "avatarUrl": "https://user-media.couchershq.org/media/img/full/af49ba999bfb8bcc94db4a18e0d251a67883452fd63476604b12dd5a35fee404.jpg",
          "languageAbilitiesList": [{ code: "deu", fluency: 3 }],
          "badgesList": ["volunteer"],
          "hasStrongVerification": false,
          "birthdateVerificationStatus": 1,
          "genderVerificationStatus": 1
        },
        {
          "userId": 18436,
          "username": "David 11",
          "name": "david baqueiro",
          "city": "Vigo, Galicia, España",
          "hometown": "Vigo",
          "timezone": "Europe/Madrid",
          "lat": 42.237430861395445,
          "lng": -8.725194502595514,
          "radius": 250,
          "verification": 0,
          "communityStanding": 0,
          "numReferences": 0,
          "gender": "Man",
          "pronouns": "",
          "age": 27,
          "joined": { nanos: 0, seconds: 1660737600 },
          "lastActive": { nanos: 0, seconds: 1717682400 },
          "hostingStatus": 3,
          "meetupStatus": 3,
          "occupation": "Software developer",
          "education": "",
          "aboutMe": "Daviiiid 0000!!!",
          "myTravels": "",
          "thingsILike": "",
          "aboutPlace": "",
          "regionsVisitedList": ["BEL", "FRA", "DEU", "ITA", "MEX", "PRT", "SGP"],
          "regionsLivedList": ["DEU", "ESP"],
          "additionalInformation": "",
          "friends": 3,
          "lastMinute": { value: false },
          "hasPets": { value: false },
          "acceptsPets": { value: false },
          "petDetails": { value: "" },
          "hasKids": { value: false },
          "acceptsKids": { value: false },
          "kidDetails": { value: "" },
          "hasHousemates": { value: false },
          "housemateDetails": { value: "" },
          "wheelchairAccessible": { value: false },
          "smokingAllowed": 1,
          "smokesAtHome": { value: false },
          "drinkingAllowed": { value: false },
          "drinksAtHome": { value: false },
          "otherHostInfo": { value: "![Bildschirmfoto 2023-10-01 um 20.39.53.png" },
          "sleepingArrangement": 1,
          "sleepingDetails": { value: "" },
          "area": { value: "" },
          "houseRules": { value: "" },
          "parking": { value: false },
          "parkingDetails": 1,
          "campingOk": { value: false },
          "avatarUrl": "https://user-media.couchershq.org/media/img/full/af49ba999bfb8bcc94db4a18e0d251a67883452fd63476604b12dd5a35fee404.jpg",
          "languageAbilitiesList": [{ code: "deu", fluency: 3 }],
          "badgesList": ["volunteer"],
          "hasStrongVerification": false,
          "birthdateVerificationStatus": 1,
          "genderVerificationStatus": 1
        }
      ]
      );
      setIsLoading(false);
    }, 3000)
  }, [])

  return (
    <mapContext.Provider value={{results, setResults, isLoading, setIsLoading, initialCoords, setInitialCoords, boundingBox, setBoundingBox, locationName, setLocationName, extraTags, setExtraTags, lastActiveFilter, setLastActiveFilter, hostingStatusFilter, setHostingStatusFilter, numberOfGuestsFilter, setNumberOfGuestFilter}}>
      <NewSearchPage />
    </mapContext.Provider>
  )
}

export default NewSearchPageController;