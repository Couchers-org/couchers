import { Hidden, makeStyles, Paper } from "@material-ui/core";
import { useState } from "react";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import SearchResult from "features/search/SearchResult";
import { useTranslation } from "i18n";
import { SEARCH } from "i18n/namespaces";
import NewSearchBox from "./new-search-box";
import { useEffect } from "react";

const useStyles = makeStyles((theme) => ({
  mapResults: {
    height: "17rem",
    overflowY: "auto",
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.up("md")]: {
      height: "auto",
      width: "30rem",
      padding: theme.spacing(3),
    },
  },
  baseMargin: {
    margin: theme.spacing(2),
  },
  scroller: {
    marginTop: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      marginTop: 0,
    },
  },
  singleResult: {
    maxWidth: "100%",
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(2),
    },
  },
  searchResult: {
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 0 4px rgba(0,0,0,0.25)",
    marginBottom: theme.spacing(3),
    "&:last-child": {
      marginBottom: 0,
    },
    "& .MuiCardContent-root": {
      padding: theme.spacing(3),
    },
    [theme.breakpoints.down("sm")]: {
      padding: 0,
      overflow: "hidden",
      flexShrink: 0,
      width: "85vw",
      maxWidth: "33rem",
      height: "100%",
      margin: theme.spacing(0, 2, 0, 0),
      scrollSnapAlign: "start",
      "&:last-child": {
        marginRight: 0,
      },
      "& .MuiCardActionArea-root": {
        height: "100%",
      },
      "& .MuiCardContent-root": {
        height: "100%",
        padding: theme.spacing(2),
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      },
    },
  },
}));

export default function NewSearchList({ }) {
  const { t } = useTranslation(SEARCH);
  const [isSearching, setIsSearching] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([] as any);
  const classes = useStyles();
  const hasAtLeastOnePageResults = true;
  const selectedResult = undefined;

  /*
  const {
    data: results,
    error,
    isLoading,
    fetchNextPage,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery<UserSearchRes.AsObject, Error>(
    searchQueryKey(query || ""),
    ({ pageParam }) => {
      return service.search.userSearch(
        {
          lat,
          lng,
          radius,
          query,
          lastActive,
          hostingStatusOptions,
          numGuests,
        },
        pageParam
      );
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
      onSuccess(results) {
        map.current?.stop();

        const resultUsers = results.pages
          .flatMap((page) => page.resultsList)
          .map((result) => {
            return result.user;
          })
          //only return defined users
          .filter((user): user is User.AsObject => !!user);

        const setFilter = () => {
          map.current &&
            filterUsers(
              map.current,
              Object.keys(searchFilters.active).length > 0
                ? resultUsers.map((user) => user.userId)
                : null,
              handleMapUserClick
            );

          if (bbox && bbox.join() !== "0,0,0,0") {
            map.current?.fitBounds(bbox, {
              maxZoom: selectedUserZoom,
            });
          }
        };

        if (map.current?.loaded()) {
          setFilter();
        } else {
          map.current?.once("load", setFilter);
        }
      },
    }
  );
  */

  const error = {
    message: ""
  };

  useEffect(() => {
    setTimeout(() => {
      setIsSearching(false);
      setIsLoading(false);
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
          "joined": "{nanos: 0, seconds: 1660737600}",
          "lastActive": "{nanos: 0, seconds: 1717682400}",
          "hostingStatus": 3,
          "meetupStatus": 3,
          "occupation": "Software developer",
          "education": "",
          "aboutMe": "Daviiiid 0000!!!",
          "myTravels": "",
          "thingsILike": "",
          "aboutPlace": "",
          "regionsVisitedList": "[\"BEL\", \"FRA\", \"DEU\", \"ITA\", \"MEX\", \"PRT\", \"SGP\", \"…]",
          "regionsLivedList": "[\"DEU\", \"ESP\"]",
          "additionalInformation": "",
          "friends": 3,
          "lastMinute": "{value: false}",
          "hasPets": "{value: false}",
          "acceptsPets": "{value: false}",
          "petDetails": "{value: \"\"}",
          "hasKids": "{value: false}",
          "acceptsKids": "{value: false}",
          "kidDetails": "{value: \"\"}",
          "hasHousemates": "{value: false}",
          "housemateDetails": "{value: \"\"}",
          "wheelchairAccessible": "{value: false}",
          "smokingAllowed": 1,
          "smokesAtHome": "{value: false}",
          "drinkingAllowed": "{value: false}",
          "drinksAtHome": "{value: false}",
          "otherHostInfo": "{value: \"![Bildschirmfoto 2023-10-01 um 20.39.53.pn…}",
          "sleepingArrangement": 1,
          "sleepingDetails": "{value: \"\"}",
          "area": "{value: \"\"}",
          "houseRules": "{value: \"\"}",
          "parking": "{value: false}",
          "parkingDetails": 1,
          "campingOk": "{value: false}",
          "avatarUrl": "https://user-media.couchershq.org/media/img/full/af49ba999bfb8bcc94db4a18e0d251a67883452fd63476604b12dd5a35fee404.jpg",
          "languageAbilitiesList": "[{code:\"deu\", fluency:3}]",
          "badgesList": "[\"volunteer\"]",
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
          "joined": "{nanos: 0, seconds: 1660737600}",
          "lastActive": "{nanos: 0, seconds: 1717682400}",
          "hostingStatus": 3,
          "meetupStatus": 3,
          "occupation": "Software developer",
          "education": "",
          "aboutMe": "Daviiiid 1111!!!",
          "myTravels": "",
          "thingsILike": "",
          "aboutPlace": "",
          "regionsVisitedList": "[\"BEL\", \"FRA\", \"DEU\", \"ITA\", \"MEX\", \"PRT\", \"SGP\", \"…]",
          "regionsLivedList": "[\"DEU\", \"ESP\"]",
          "additionalInformation": "",
          "friends": 3,
          "lastMinute": "{value: false}",
          "hasPets": "{value: false}",
          "acceptsPets": "{value: false}",
          "petDetails": "{value: \"\"}",
          "hasKids": "{value: false}",
          "acceptsKids": "{value: false}",
          "kidDetails": "{value: \"\"}",
          "hasHousemates": "{value: false}",
          "housemateDetails": "{value: \"\"}",
          "wheelchairAccessible": "{value: false}",
          "smokingAllowed": 1,
          "smokesAtHome": "{value: false}",
          "drinkingAllowed": "{value: false}",
          "drinksAtHome": "{value: false}",
          "otherHostInfo": "{value: \"![Bildschirmfoto 2023-10-01 um 20.39.53.pn…}",
          "sleepingArrangement": 1,
          "sleepingDetails": "{value: \"\"}",
          "area": "{value: \"\"}",
          "houseRules": "{value: \"\"}",
          "parking": "{value: false}",
          "parkingDetails": 1,
          "campingOk": "{value: false}",
          "avatarUrl": "https://user-media.couchershq.org/media/img/full/af49ba999bfb8bcc94db4a18e0d251a67883452fd63476604b12dd5a35fee404.jpg",
          "languageAbilitiesList": "[{code:\"deu\", fluency:3}]",
          "badgesList": "[\"volunteer\"]",
          "hasStrongVerification": false,
          "birthdateVerificationStatus": 1,
          "genderVerificationStatus": 1
        }
      ]
      );
    }, 10000)
  }, []);

  return (
    <Paper className={classes.mapResults}>
      {error && <Alert severity="error">{error.message}</Alert>}
      <Hidden smDown>
        <NewSearchBox />
      </Hidden>
      <>
        {isLoading && <CircularProgress className={classes.baseMargin} />}

        {!isLoading && !hasAtLeastOnePageResults &&
          <TextBody className={classes.baseMargin}>
            {t("search_result.no_user_result_message")}
          </TextBody>
        }

        {!isLoading && hasAtLeastOnePageResults &&
          <HorizontalScroller
            breakpoint="sm"
            className={classes.scroller}
            isFetching={isLoading}
            fetchNext={() => { }}
            hasMore={false}
          >
            {results.length && results.map((result: any) =>
              result.user ? (
                <SearchResult
                  id={`search-result-${result.user.userId}`}
                  className={classes.searchResult}
                  key={result.user.userId}
                  user={result.user}
                  onSelect={() => { alert("selected :)") }}
                  highlight={result.user.userId === selectedResult}
                />
              ) : null
            )}
          </HorizontalScroller>
        }
      </>
    </Paper>
  );
}
