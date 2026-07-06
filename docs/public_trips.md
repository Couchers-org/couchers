# Public Trips

## Overview

Surfers post public trips in communities. Hosts browse trips and click "Offer to Host" which creates a host request with `public_trip_id` linked. The surfer can accept/decline these offers. References flow triggers normally after the stay.

---

## Data Model

[`public_trips.py`](../backend/src/couchers/models/public_trips.py)

```python
class PublicTrip(Base):
    user_id, node_id
    from_date, to_date
    description: str
    status: PublicTripStatus  # searching_for_host | closed
    same_gender_only: bool    # if true, only same-gender users can see/offer on this trip
```

`HostRequest` has a `public_trip_id` FK linking offers back to their trip.

---

## API

### `PublicTrips` service (`public_trips.proto`)

| RPC | Description |
|-----|-------------|
| `CreatePublicTrip` | Create a trip in a community |
| `GetPublicTrip` | Get trip details |
| `ListPublicTrips` | List active trips in a community (for hosts browsing) |
| `ListPublicTripsByUser` | All trips for a user — own dashboard shows all; other user's profile shows active/upcoming only |
| `UpdatePublicTrip` | Edit dates, description, `same_gender_only`, or status. Owner-only. |

### `CreateHostRequest` changes (`requests.proto`)

`CreateHostRequestReq` accepts an optional `public_trip_id`. When set:
- Dates must fall within the trip's window (host can shorten, not extend)
- The trip must still be `searching_for_host`
- The request recipient must match the trip's traveler
- If the trip is `same_gender_only`, the host's gender must match the traveler's (community moderators bypass)
- Duplicate offers from the same host on the same trip are rejected

---

## Edge Cases

### Community restriction

Trips are restricted to communities where `small_community_features_enabled = true` on the official cluster. No node type restriction — locality, region, etc. are all valid if the flag is on.

### Duplicate active trips

A user cannot create overlapping active trips (same node, overlapping dates, both `searching_for_host`). Closed trips don't count.

### Same gender only

- Trips with `same_gender_only = true` are hidden from users of a different gender in all list/get endpoints.
- Community moderators bypass the filter (for moderation purposes).
- The same restriction is enforced at write time: `CreateHostRequest` rejects offers from mismatched genders.
- Users of the same gender see a "same gender only" indicator on the card.

### Visibility filtering

- Trips from deleted/banned/blocked users are hidden using `where_users_column_visible`.
- `ListPublicTrips` only shows `searching_for_host` trips with `to_date >= today`.
- `ListPublicTripsByUser` for another user's profile applies the same active/upcoming/gender filters; own trips bypass all filters.

---

## Notifications (future work)

### New trip posted → notify nearby hosts

- Digest-only delivery to avoid spam in large cities.
- Only notify users with `hosting_status != cant_host`.
- Consider a per-user weekly cap.

### Offer received → notify surfer

- High-value notification — all delivery types (push, email, in-app).
- If offered dates differ from trip dates, highlight the adjustment in the notification and thread.

---

## Frontend (future work)

### Offer to Host flow

1. Host clicks "Offer to Host" on a trip card.
2. Reuse/extract the existing `NewHostRequest.tsx` form — pre-fill trip dates and traveler. Host can adjust dates.
3. Required message (same 250-char minimum as normal host requests).
4. Submit calls `CreateHostRequest` with `public_trip_id` set.
5. Redirect to the host request thread on success.

**"Already offered" indicator**: derive from the user's sent host requests (which already carry `public_trip_id`) — no new backend field needed. Disable the button and show a label if a matching sent request exists.

### Trip dashboard (`/public-trips`)

Single page for the surfer to manage all their trips across communities: view active trips, see offers received, edit/close trips.

Entry points:
- Community public trips tab: once the user has a trip in that community, swap "Create" button for "Edit my public trips".
- Dashboard: prominent link (separate PR).

### Host request display

In the host request thread/card, check `public_trip_id` and show an indicator for offers originating from public trips. If dates differ from the original trip, show a clear adjustment callout.

### Accept flow

1. Surfer calls `RespondHostRequest` with `status = accepted`.
2. Optionally call `UpdatePublicTrip` to set `status = closed` (stops further offers).

---

## Reference flow

No changes needed. References trigger based on `HostRequest` status and dates as normal — `public_trip_id` is just metadata.
