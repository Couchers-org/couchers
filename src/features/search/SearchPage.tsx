import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import PageTitle from "../../components/PageTitle";
import TextBody from "../../components/TextBody";
import { search } from "../../libs/search";
import { User } from "../../pb/api_pb";
import SearchResult from "./SearchResult";

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([] as User.AsObject[]);

  const { query } = useParams<{ query: string }>();
  //the below pattern (async, loading, try catch, etc) will come up a lot, can it be streamlined?
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
        //I'm wondering the best way to do this with minimal re-renders. Or maybe it's fine
        results.map((user) => <SearchResult key={user.userId} user={user} />)
      ) : (
        <TextBody>No users found.</TextBody>
      )}
    </>
  );
}
