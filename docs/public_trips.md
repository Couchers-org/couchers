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

### Surfer's Trip Dashboard

New page at `/my-public-trips` showing:

- Active public trips
- Offers received (host requests linked to each trip)
- Ability to close the trip (stops receiving new offers)
- Linked for the surfer at top of "Public Trips" tab and on "Account Settings" page

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
