# Public Trips RFC

## Overview

Surfers post public trips in city-level communities. Hosts browse trips and click "Offer to Host" which creates a host request with `public_trip_id` linked. The surfer can accept/decline these offers. References flow triggers normally after the stay.

---

## Data Model

The model already exists in [`public_trips.py`](../backend/src/couchers/models/public_trips.py) in this PR:

```python
class PublicTrip(Base, kw_only=True):
    # ... user_id, node_id, from_date, to_date, description
    status: PublicTripStatus  # searching_for_host, closed
    # Analytics via host_requests relationship
```

The `HostRequest` model already has `public_trip_id` FK added in migration.

**Required addition**: Add `public_trip_id` field to `HostRequest` proto message in `requests.proto` so frontend can show "from public trip" indicator.

---

## API Design

### New Proto Service: `PublicTrips`

Location: `app/proto/public_trips.proto`

**RPCs:**

- `CreatePublicTrip(CreatePublicTripReq) -> PublicTrip` - Create a new public trip
- `GetPublicTrip(GetPublicTripReq) -> PublicTrip` - Get trip details
- `ListPublicTrips(ListPublicTripsReq) -> ListPublicTripsRes` - List trips in a community (for hosts browsing)
- `ListMyPublicTrips(ListMyPublicTripsReq) -> ListMyPublicTripsRes` - Surfer's dashboard
- `UpdatePublicTripStatus(UpdatePublicTripStatusReq) -> Empty` - Close the trip

**Modified RPC in `Requests` service:**

- `CreateHostRequest` - Add optional `public_trip_id` field. When set, creates host request where the **host becomes the surfer** (role reversal) and links to the public trip.

---

## Edge Cases

### 1. Community Level Restriction

**Problem**: Users shouldn't post trips in world/country/region-level communities - too broad.

**Solution**: Use the `NodeType` hierarchy to restrict to locality-level communities and below:

```python
# In CreatePublicTrip
node = session.execute(select(Node).where(Node.id == request.node_id)).scalar_one()

# Only allow locality (city-level) and sublocality (neighborhood-level)
if node.node_type.value < NodeType.locality.value:
    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "community_too_broad")
```

This allows: `locality` (cities) and `sublocality` (neighborhoods). Blocks: `world`, `macroregion`, `region`, and `subregion`.

### 2. Duplicate Active Trips (probably overkill?)

**Problem**: Same user spamming multiple overlapping trips in same community.

**Solution**: Check for existing active trips with overlapping dates in same node:

```python
existing = session.execute(
    select(PublicTrip)
    .where(PublicTrip.user_id == context.user_id)
    .where(PublicTrip.node_id == request.node_id)
    .where(PublicTrip.status == PublicTripStatus.searching_for_host)
    .where(PublicTrip.to_date >= request.from_date)
    .where(PublicTrip.from_date <= request.to_date)
).scalar_one_or_none()
if existing:
    context.abort_with_error_code(grpc.StatusCode.ALREADY_EXISTS, "overlapping_trip_exists")
```

### 3. Visibility Filtering (in GET APIs)

- Filter out trips from invisible users (deleted/banned/blocked) using `users_column_visible()`
- Filter out trips where `to_date < today` (past trips) in `ListPublicTrips`

---

## Notifications

### For New Public Trips (notify hosts)

**Problem**: Big cities would spam thousands of hosts.

**Solution**: Per-user rate limiting with digest-only delivery.

**1. Digest-only delivery by default:**

```python
# In NotificationTopicAction enum
public_trip__create = ("public_trip:create", [dt.digest], True, nd.PublicTripCreate)
```

This means no immediate push/email - notifications batch into the user's periodic digest.

**2. Per-user weekly cap (overkill?):**

When fanning out notifications, skip users who have received too many recently:

```python
MAX_PUBLIC_TRIP_NOTIFICATIONS_PER_WEEK = 5

def should_notify_user_for_public_trip(session: Session, user_id: int) -> bool:
    recent_count = session.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id)
        .where(Notification.topic_action == NotificationTopicAction.public_trip__create)
        .where(Notification.created >= now() - timedelta(days=7))
    ).scalar_one()
    return recent_count < MAX_PUBLIC_TRIP_NOTIFICATIONS_PER_WEEK
```

**3. Only notify actual hosts:**

```python
.where(User.hosting_status != HostingStatus.cant_host)
```

This approach dynamically adjusts: hosts in big cities naturally hit the cap faster and stop getting more, while hosts in smaller communities get all notifications.

**Notification settings** (add to `settings.py`):

```python
(
    "public_trip",
    "Public Trips",
    [
        ("create", "A traveler posts a public trip in your community (max 5/week)"),
        ("offer_received", "A host offers to host your public trip"),
    ],
),
```

### For Offer Received (notify surfer)

High-value notification - use all delivery types:

```python
# In NotificationTopicAction enum
public_trip__offer_received = ("public_trip:offer_received", dt_all, True, nd.PublicTripOfferReceived)
```
```python
notify(
    session,
    user_id=public_trip.user_id,
    topic_action=NotificationTopicAction.public_trip__offer_received,
    key=str(public_trip.id),
    data=notification_data_pb2.PublicTripOfferReceived(
        public_trip=public_trip_to_pb(public_trip),
        host=user_model_to_pb(host_user),
        host_request_id=host_request.conversation_id,
    ),
)
```

---

## Frontend Integration

### Host Request Display

In [`MessagesHeader.tsx`](../web/features/messages/MessagesHeader.tsx) and related components, the existing tabs work as-is because public trip offers flow through the normal `HostRequest` system.

**Modification needed**: In the host request card/list view, check `host_request.public_trip_id` and show an indicator (e.g., badge or icon) for requests originating from public trips.

### Surfer's Trip Dashboard ("Edit my public trips")

A single `/my-public-trips` page (rather than per-community editing) since users may have trips across multiple communities - easier to manage everything in one place.

The page shows:

- Active public trips
- Offers received (host requests linked to each trip)
- Ability to edit/close trips (close stops receiving new offers)

**Entry points:**

- **Community Public Trips tab**: once a user has created a trip in that community, replace the "Create public trip" button with an "Edit my public trips" button linking to `/my-public-trips`. This way hosts browsing their own community immediately see they've already posted. (Being implemented now.)
- **Dashboard**: add a prominent "My public trips" button/link so users can reach the page from the main landing screen. (Separate follow-up PR.)

Profile tab was considered but rejected as not intuitive - users don't think of public trips as "profile content" the way hosting preferences are.

### Offer to Host Flow

We should **reuse the existing host request form pattern** ([`NewHostRequest.tsx`](../app/web/features/profile/view/NewHostRequest.tsx)) rather than introducing a dialog. That form is already an inline panel with date pickers, a required message (250 char min), and Cancel/Send buttons — the same shape we need here. Keeping the flow consistent avoids a second mental model for what is fundamentally "compose a host request."

**Flow:**

1. Host clicks "Offer to host" on a public trip card.
2. The card expands (or the user is taken to a dedicated compose view - TBD based on how it fits visually) showing the same host request form, **pre-filled** with the trip's `from_date` and `to_date` and the traveler pre-selected.
3. The host can **adjust the dates** (e.g. they can only host for part of the trip) - the final `from_date`/`to_date` on the `HostRequest` may differ from the `PublicTrip`.
4. The host is **required** to enter a message (same 250-char minimum as a normal host request). Send is disabled until valid.
5. Submit calls `CreateHostRequest` with `public_trip_id` set, plus the (possibly adjusted) dates and message.

**Implementation note:** `NewHostRequest.tsx` currently pulls the host from `useProfileUser()` context. For the public trips flow we'll need to either accept optional props (trip + traveler user) or extract the form into a shared component. The latter is cleaner given both callers now want to pre-fill different things.

**Highlighting date adjustments:** If the host's chosen dates differ from the original public trip's dates, this **must** be highlighted in the notification and message the surfer receives so there's no confusion (hosts may forget to mention the shortened window in their message).

- In the `HostRequestOfferReceived` (or equivalent) notification, compare the `HostRequest.from_date`/`to_date` with the linked `PublicTrip.from_date`/`to_date`.
- If they differ, render a clear "Dates adjusted: {original_from} - {original_to} → {offered_from} - {offered_to}" callout at the top of the notification and in-app message view.
- The frontend should show the same callout in the host request thread whenever `public_trip_id` is set and dates don't match.

### Accept Flow

When surfer accepts an offer:

1. Call existing `RespondHostRequest` with `status=accepted`
2. Optionally call `UpdatePublicTripStatus` to mark trip as `closed` (stops further offers)

---

## Reference Flow

**No changes needed**. References trigger based on `HostRequest` status and dates, which works automatically since:

- Public trip offers create normal `HostRequest` records
- The `public_trip_id` FK is just metadata
- Existing reference reminder jobs query `HostRequest.end_time_to_write_reference`

---

## Status Flow

**Status values:**
- `searching_for_host` - Trip is active and can receive offers
- `closed` - Trip is done (user closed it for any reason)

**Filtering:**
- `ListPublicTrips` (hosts browsing): Filter to `status == searching_for_host` AND `to_date >= today`
- `ListMyPublicTrips` (surfer's dashboard): Show all trips including closed ones

**Analytics:**
Use the `host_requests` relationship to determine outcomes:
- Has accepted host request with `public_trip_id` → found host via public trip
- Has no host requests → no responses
- Everything else → closed without details

This approach avoids requiring users to manually update outcomes and derives analytics from actual system data

---

## Files to Create/Modify

**Create:**

- `app/proto/public_trips.proto` - Proto definitions
- `app/backend/src/couchers/servicers/public_trips.py` - gRPC servicer
- `app/backend/proto/internal/jobs.proto` - Add job payload for notification fan-out

**Modify:**

- `app/proto/requests.proto` - Add `public_trip_id` to `HostRequest` and `CreateHostRequestReq` messages
- `app/backend/src/couchers/servicers/requests.py` - Handle `public_trip_id` in CreateHostRequest
- `app/backend/src/couchers/notifications/settings.py` - Add public_trip notification types
- `app/backend/src/couchers/models/notifications.py` - Add NotificationTopicAction entries
- `app/backend/src/couchers/jobs/handlers.py` - Add notification fan-out handler
- `app/backend/src/couchers/jobs/definitions.py` - Register notification fan-out job
