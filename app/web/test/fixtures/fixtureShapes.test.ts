import { PublicTrip } from "proto/public_trips_pb";
import { HostRequest } from "proto/requests_pb";
import hostRequest from "test/fixtures/hostRequest";
import publicTrips from "test/fixtures/publicTrips";

type Bag = Record<string, unknown>;

// tsc lets a fixture omit a proto3 `optional` scalar because the generated type marks it `?`, but
// toObject() always sends one as 0/""/false. hostRequest.json omitting publicTripId is what made
// every host request look like a public-trip offer.
function expectRuntimeShape(label: string, fixture: object, emitted: object) {
  // Unset message-typed fields come back undefined either way, so only scalars matter.
  const required = Object.keys(emitted)
    .filter((k) => (emitted as Bag)[k] !== undefined)
    .sort();
  const present = required.filter((k) => k in (fixture as Bag));
  expect({ [label]: present }).toEqual({ [label]: required });
}

describe("fixtures match the shape the API actually returns", () => {
  it("hostRequest", () => {
    expectRuntimeShape("hostRequest", hostRequest, new HostRequest().toObject());
  });

  it("publicTrips", () => {
    publicTrips.forEach((trip, i) => {
      expectRuntimeShape(`publicTrips[${i}]`, trip, new PublicTrip().toObject());
    });
  });
});
