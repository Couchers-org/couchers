import {
  getOrCreateSearchSessionId,
  makeResultId,
  makeSearchQueryId,
  readSearchReferrer,
  referrerToProperties,
  setSearchReferrer,
} from "./searchAttribution";

const SESSION_TTL_MS = 30 * 60 * 1000;

describe("makeSearchQueryId", () => {
  it("returns a fresh unique id on each call", () => {
    const a = makeSearchQueryId();
    const b = makeSearchQueryId();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toEqual(b);
  });
});

describe("getOrCreateSearchSessionId", () => {
  it("reuses the same id within the idle window", () => {
    const first = getOrCreateSearchSessionId();
    const second = getOrCreateSearchSessionId();
    expect(second).toEqual(first);
  });

  it("rolls over after the idle window elapses", () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(0);
    const first = getOrCreateSearchSessionId();

    nowSpy.mockReturnValue(SESSION_TTL_MS + 1);
    const second = getOrCreateSearchSessionId();

    expect(second).not.toEqual(first);
  });
});

describe("makeResultId", () => {
  it("encodes the query, user and position", () => {
    expect(makeResultId("query-1", 42, 3)).toEqual("query-1:42:3");
  });
});

describe("search referrer", () => {
  it("round-trips for the matching user", () => {
    setSearchReferrer({
      searchSessionId: "sess",
      searchQueryId: "query",
      bfcSearchId: "search_b1",
      resultId: "query:7:0",
      userId: 7,
    });
    const referrer = readSearchReferrer(7);
    expect(referrer).toMatchObject({
      searchSessionId: "sess",
      searchQueryId: "query",
      bfcSearchId: "search_b1",
      resultId: "query:7:0",
      userId: 7,
    });
  });

  it("returns null for a different user", () => {
    setSearchReferrer({
      searchSessionId: "sess",
      searchQueryId: "query",
      bfcSearchId: "search_b1",
      resultId: "query:7:0",
      userId: 7,
    });
    expect(readSearchReferrer(8)).toBeNull();
  });

  it("carries the search id into event properties", () => {
    setSearchReferrer({
      searchSessionId: "sess",
      searchQueryId: "query",
      bfcSearchId: "search_b1",
      resultId: "query:7:0",
      userId: 7,
    });
    expect(referrerToProperties(readSearchReferrer(7))).toEqual({
      referrer_search_session_id: "sess",
      referrer_search_query_id: "query",
      referrer_bfc_search_id: "search_b1",
      referrer_result_id: "query:7:0",
    });
  });

  it("returns null once the referrer has expired", () => {
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(0);
    setSearchReferrer({
      searchSessionId: "sess",
      searchQueryId: "query",
      bfcSearchId: "search_b1",
      resultId: "query:7:0",
      userId: 7,
    });

    nowSpy.mockReturnValue(SESSION_TTL_MS + 1);
    expect(readSearchReferrer(7)).toBeNull();
  });
});
