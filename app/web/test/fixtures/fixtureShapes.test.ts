import { User } from "proto/api_pb";
import { Message } from "proto/messages_pb";
import { PublicTrip } from "proto/public_trips_pb";
import { HostRequest } from "proto/requests_pb";
import hostRequest from "test/fixtures/hostRequest";
import publicTrips from "test/fixtures/publicTrips";

type Bag = Record<string, unknown>;

// jspb's toObject() emits every field, filling unset scalars with their default (0, "", false). The
// generated AsObject types mark proto3 `optional` fields as `?`, so tsc accepts a fixture that omits
// one even though the API always sends it. That mismatch is invisible to typecheck and has already
// caused a bug: hostRequest.json omitted publicTripId, so `publicTripId !== undefined` was false in
// tests and true in production, marking every host request a public-trip offer.
//
// Only fields with a concrete default matter. An unset message-typed field comes back as undefined,
// so omitting it is indistinguishable; an unset scalar comes back as 0/""/false, so omitting *that*
// makes the fixture a shape the API can never return.
function expectRuntimeShape(label: string, fixture: object, emitted: object) {
  const required = Object.keys(emitted)
    .filter((k) => (emitted as Bag)[k] !== undefined)
    .sort();
  const present = required.filter((k) => k in (fixture as Bag));
  expect({ [label]: present }).toEqual({ [label]: required });
}

describe("fixtures match the shape the API actually returns", () => {
  it("hostRequest", () => {
    expectRuntimeShape("hostRequest", hostRequest, new HostRequest().toObject());
    expectRuntimeShape("hostRequest.latestMessage", hostRequest.latestMessage!, new Message().toObject());
  });

  it("publicTrips", () => {
    publicTrips.forEach((trip, i) => {
      expectRuntimeShape(`publicTrips[${i}]`, trip, new PublicTrip().toObject());
      expectRuntimeShape(`publicTrips[${i}].user`, trip.user!, new User().toObject());
    });
  });
});
