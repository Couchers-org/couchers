import { Box } from "@material-ui/core";
import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import PageTitle from "components/PageTitle";
import TextBody from "components/TextBody";
import { SearchQuery } from "features/search/constants";
import SearchResult from "features/search/SearchResult";
import { User } from "pb/api_pb";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { service } from "service/index";

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([] as User.AsObject[]);

  const { query } = useParams<SearchQuery>();
  useEffect(() => {
    if (!query) return;
    (async () => {
      setLoading(true);
      try {
        setResults(await service.search.search(query));
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [query]);

  return (
    <>
      <PageTitle>
        {query ? `Search for '${query}'` : "Please enter a search query."}
      </PageTitle>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : results.length ? (
        <Box display="flex" flexWrap="wrap" justifyContent="space-between">
          {results.map((user) => (
            <SearchResult key={user.userId} user={user} />
          ))}
        </Box>
      ) : (
        <TextBody>No users found.</TextBody>
      )}
    </>
  );
}
