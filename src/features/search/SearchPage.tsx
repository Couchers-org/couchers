import { Box } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import PageTitle from "../../components/PageTitle";
import TextBody from "../../components/TextBody";
import { search } from "../../service/search";
import { User } from "../../pb/api_pb";
import { SearchQuery } from "./constants";
import SearchResult from "./SearchResult";

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
        setResults(await search(query));
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
