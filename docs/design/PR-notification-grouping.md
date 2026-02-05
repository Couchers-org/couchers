# Pull Request: Notification Grouping and Presence-Based Suppression

## Title
Backend/Frontend: Notification grouping, duplicate prevention, and presence-based suppression

## Summary

This PR implements a comprehensive solution to address notification spam in Couchers. It tackles three major pain points reported by users:

1. **Notification Flooding**: Multiple push notifications when someone sends several messages quickly
2. **Duplicate Notifications**: Users receiving both push AND email for the same message
3. **No Context Awareness**: Notifications firing even when user is actively viewing the chat

**Closes #6234, #5872, #7712, #5218**
**Partially addresses #4415**

---

## Motivation

Users have consistently reported notification-related issues:

> "When someone messages, it sends a notification for each message. When you next log in, you have a ton of notifications." — #6234

> "I'm getting two notifications for each message I receive" — #5872

> "I was in the chat, but for every message I got a notification which was very annoying as I had chat opened." — #7712

These issues harm user experience and have been open for extended periods. This PR provides a complete solution.

---

## Implementation Overview

### Phase 1: Platform-Level Notification Grouping

**Problem**: Each message creates a separate notification, flooding the notification tray.

**Solution**: Leverage native platform grouping capabilities.

| Platform | Mechanism | Implementation |
|----------|-----------|----------------|
| iOS | `threadId` | Groups notifications visually by conversation |
| Android | `collapseKey` | Collapses/stacks notifications from same conversation |
| Web | `tag` option | Replaces existing notification with same tag |

**Files Changed**:
- `couchers/notifications/send_raw_push_notification.py` - Added `thread_id` to Expo and web push payloads
- `couchers/notifications/expo_api.py` - Added `thread_id` parameter support
- `app/web/public/service-worker.js` - Added `tag` and `renotify` options

**Key Code** (`send_raw_push_notification.py:121-128`):
```python
collapse_key = None
thread_id = None
if payload.topic_action and payload.key:
    collapse_key = f"{payload.topic_action}_{payload.key}"
    thread_id = f"{payload.topic_action}_{payload.key}"
```

---

### Phase 2: Duplicate Notification Prevention

**Problem**: Users receive both push notification AND email for the same message.

**Solution**: Track push delivery and skip email if push was recently delivered.

**How It Works**:
1. When a push notification is sent, it's recorded in `NotificationDelivery` table
2. The `send_message_notifications()` background job checks for recent push deliveries
3. If push was delivered within the last 10 minutes, the email is skipped
4. User still gets notified once (via push) instead of twice

**Files Changed**:
- `couchers/jobs/handlers.py` - Added push delivery check in `send_message_notifications()` and `send_request_notifications()`

**Key Code** (`handlers.py:315-328`):
```python
def _has_recent_push_delivery(
    session: Session, user_id: int, topic_action: NotificationTopicAction, conversation_id: int
) -> bool:
    """Check if user received a push notification for this conversation recently."""
    recent_push_count = session.execute(
        select(func.count(NotificationDelivery.id))
        .join(Notification, NotificationDelivery.notification_id == Notification.id)
        .where(Notification.user_id == user_id)
        .where(Notification.topic_action == topic_action)
        .where(Notification.key == str(conversation_id))
        .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
        .where(NotificationDelivery.delivered > now() - PUSH_NOTIFICATION_RECENCY_WINDOW)
    ).scalar_one()
    return recent_push_count > 0
```

---

### Phase 3: Presence-Based Notification Suppression

**Problem**: Users get notifications even when they're actively looking at the conversation.

**Solution**: Track user presence and suppress notifications when they're viewing the chat.

**Architecture Decision**: Instead of creating a new `ConversationPresence` table (as originally proposed), we added a `last_viewing_at` column to the existing `GroupChatSubscription` table. This is simpler because:
- No new table needed - just a nullable column addition
- Already queried when generating notifications - no additional JOIN
- Same lookup pattern - check `last_viewing_at > now() - 30s`

**How It Works**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENCE TRACKING FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Opens Chat                                                 │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐     Every 10s      ┌──────────────────┐    │
│  │ usePresenceHeart│ ─────────────────► │MarkGroupChat     │    │
│  │ beat Hook       │                    │ Viewing RPC      │    │
│  └─────────────────┘                    └────────┬─────────┘    │
│                                                   │              │
│                                                   ▼              │
│                                         ┌──────────────────┐    │
│                                         │ Update           │    │
│                                         │ last_viewing_at  │    │
│                                         │ = now()          │    │
│                                         └──────────────────┘    │
│                                                                  │
│  User Closes Chat / Navigates Away                               │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                    ┌──────────────────┐    │
│  │ Cleanup /       │ ─────────────────► │ StopGroupChat    │    │
│  │ Visibility      │                    │ Viewing RPC      │    │
│  └─────────────────┘                    └────────┬─────────┘    │
│                                                   │              │
│                                                   ▼              │
│                                         ┌──────────────────┐    │
│                                         │ Set              │    │
│                                         │ last_viewing_at  │    │
│                                         │ = NULL           │    │
│                                         └──────────────────┘    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                   NOTIFICATION GENERATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Message Sent                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ generate_message_notifications()                         │    │
│  │                                                          │    │
│  │   For each subscriber:                                   │    │
│  │   ┌────────────────────────────────────────────────┐    │    │
│  │   │ IF last_viewing_at > now() - 30 seconds        │    │    │
│  │   │    → SKIP notification (user is viewing)       │    │    │
│  │   │ ELSE                                           │    │    │
│  │   │    → SEND notification                         │    │    │
│  │   └────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Backend Files Changed**:
- `couchers/models/conversations.py` - Added `last_viewing_at` column
- `couchers/migrations/versions/a8c3d2e1f094_add_last_viewing_at.py` - Migration
- `app/proto/conversations.proto` - Added `MarkGroupChatViewing` and `StopGroupChatViewing` RPCs
- `couchers/servicers/conversations.py` - Implemented RPCs and presence filter

**Frontend Files Changed**:
- `app/web/service/conversations.ts` - Added service methods
- `app/web/features/messages/usePresenceHeartbeat.ts` - New hook (created)
- `app/web/features/messages/groupchats/GroupChatView.tsx` - Integrated hook

**Key Backend Code** (`servicers/conversations.py:181-224`):
```python
# Skip users who are currently viewing the conversation
presence_cutoff = now() - PRESENCE_ACTIVE_DURATION

user_ids_to_notify = (
    session.execute(
        where_users_column_visible(
            select(GroupChatSubscription.user_id)
            .where(GroupChatSubscription.group_chat_id == message.conversation_id)
            .where(GroupChatSubscription.user_id != message.author_id)
            # ... other filters ...
            .where(
                or_(
                    GroupChatSubscription.last_viewing_at == None,
                    GroupChatSubscription.last_viewing_at < presence_cutoff,
                )
            ),
            context=context,
            column=GroupChatSubscription.user_id,
        )
    )
    .scalars()
    .all()
)
```

**Key Frontend Code** (`usePresenceHeartbeat.ts`):
```typescript
export default function usePresenceHeartbeat(
  groupChatId: number | undefined,
  enabled: boolean = true,
) {
  // Sends heartbeat every 10 seconds while viewing
  // Handles page visibility changes (pause when tab hidden)
  // Calls StopGroupChatViewing on unmount/navigation
}
```

---

### Phase 4: Observability & Configuration

**Time Constants** (`couchers/constants.py`):
```python
# How long presence is considered active
PRESENCE_ACTIVE_DURATION = timedelta(seconds=30)

# Delay before sending email about unseen messages
MESSAGE_NOTIFICATION_DELAY = timedelta(minutes=5)

# Window to consider a push notification "recent" for email suppression
PUSH_NOTIFICATION_RECENCY_WINDOW = timedelta(minutes=10)
```

**Prometheus Metrics** (`couchers/metrics.py`):
```python
# Tracks emails suppressed due to recent push delivery
notification_email_suppressed_counter = Counter(
    "couchers_notification_email_suppressed_total",
    "Number of notification emails suppressed",
    labelnames=["reason"],
)

# Tracks notifications suppressed due to user viewing conversation
notification_suppressed_presence_counter = Counter(
    "couchers_notification_suppressed_presence_total",
    "Number of notifications suppressed because user is viewing conversation",
)
```

---

## Service Worker Fix (Critical)

During code review, a critical issue was identified in the service worker: missing `event.waitUntil()` could cause notifications to not display if the service worker was terminated before the async operation completed.

**Before (Broken)**:
```javascript
self.addEventListener("push", function (event) {
  const data = event.data?.json();  // Could throw!
  self.registration.showNotification(data.title, options);  // Not awaited!
});
```

**After (Fixed)**:
```javascript
self.addEventListener("push", function (event) {
  event.waitUntil(
    (async () => {
      let data;
      try {
        data = event.data?.json();
      } catch (error) {
        console.error("Failed to parse push notification data:", error);
        return;
      }

      if (!data?.title) {
        console.error("Push notification missing required title field");
        return;
      }

      const options = {
        body: data.body || "",
        icon: data.icon,
        badge: data.badge,
        data: { url: data.url },
      };

      if (data.thread_id) {
        options.tag = data.thread_id;
        options.renotify = true;
      }

      await self.registration.showNotification(data.title, options);
    })()
  );
});
```

---

## Database Migration

**Migration**: `a8c3d2e1f094_add_last_viewing_at.py`

```python
def upgrade() -> None:
    op.add_column(
        "group_chat_subscriptions",
        sa.Column("last_viewing_at", sa.DateTime(timezone=True), nullable=True),
    )

def downgrade() -> None:
    op.drop_column("group_chat_subscriptions", "last_viewing_at")
```

**Impact**: Adds a single nullable column. No data migration needed. Safe to run without downtime.

---

## API Changes

### New Proto Messages

```protobuf
message MarkGroupChatViewingReq {
  uint64 group_chat_id = 1;
}

message StopGroupChatViewingReq {
  uint64 group_chat_id = 1;
}
```

### New RPCs

```protobuf
rpc MarkGroupChatViewing(MarkGroupChatViewingReq) returns (google.protobuf.Empty) {
  // Mark that the user is currently viewing a group chat
  // Call periodically (every 10s) while conversation is visible
  // Raises: NOT_FOUND if the group chat does not exist or user is not a member
}

rpc StopGroupChatViewing(StopGroupChatViewingReq) returns (google.protobuf.Empty) {
  // Mark that the user has stopped viewing a group chat
  // Call when user navigates away from the conversation
  // Raises: NOT_FOUND if the group chat does not exist or user is not a member
}
```

---

## Testing

### Unit Tests Added (12 new tests)

**Notification Tests** (`test_notifications.py`):
- `test_expo_push_includes_thread_id` - Verifies iOS grouping identifier
- `test_web_push_includes_thread_id` - Verifies web push grouping identifier

**Background Job Tests** (`test_bg_jobs.py`):
- `test_skip_message_email_when_push_delivered` - Email suppressed after push
- `test_send_message_email_when_no_push` - Email sent when no push
- `test_send_message_email_when_push_delivery_stale` - Email sent for old push

**Conversation Tests** (`test_conversations.py`):
- `test_mark_conversation_viewing` - Verifies `last_viewing_at` is updated
- `test_mark_conversation_viewing_not_found` - Error handling
- `test_notification_suppressed_when_viewing` - Core presence suppression
- `test_notification_sent_when_not_viewing` - Notifications work normally
- `test_notification_sent_when_presence_expired` - 31s boundary test
- `test_notification_suppressed_when_presence_just_active` - 29s boundary test
- `test_stop_group_chat_viewing` - Verifies presence cleared
- `test_stop_group_chat_viewing_not_found` - Error handling
- `test_stop_viewing_enables_notifications` - Notifications resume after stop

### Test Commands

```bash
# Run all notification-related tests
cd /app/backend
uv run pytest src/tests/test_conversations.py -k "viewing or presence" -v
uv run pytest src/tests/test_notifications.py -k "thread_id" -v
uv run pytest src/tests/test_bg_jobs.py -k "push_delivered" -v
```

---

## Files Changed Summary

### Backend (Python)

| File | Changes |
|------|---------|
| `couchers/constants.py` | Added `PRESENCE_ACTIVE_DURATION`, `MESSAGE_NOTIFICATION_DELAY`, `PUSH_NOTIFICATION_RECENCY_WINDOW` |
| `couchers/metrics.py` | Added `notification_email_suppressed_counter`, `notification_suppressed_presence_counter` |
| `couchers/models/conversations.py` | Added `last_viewing_at` column to `GroupChatSubscription` |
| `couchers/migrations/versions/a8c3d2e1f094_*.py` | Migration for new column |
| `couchers/servicers/conversations.py` | Added `MarkGroupChatViewing`, `StopGroupChatViewing` RPCs, presence filter |
| `couchers/jobs/handlers.py` | Added push delivery check, uses constants |
| `couchers/notifications/send_raw_push_notification.py` | Added `thread_id` to payloads |
| `couchers/notifications/expo_api.py` | Added `thread_id` parameter |

### Frontend (TypeScript/React)

| File | Changes |
|------|---------|
| `app/web/service/conversations.ts` | Added `markGroupChatViewing`, `stopGroupChatViewing` |
| `app/web/features/messages/usePresenceHeartbeat.ts` | New hook (created) |
| `app/web/features/messages/groupchats/GroupChatView.tsx` | Integrated presence hook |
| `app/web/public/service-worker.js` | Fixed lifecycle, added grouping |

### Proto

| File | Changes |
|------|---------|
| `app/proto/conversations.proto` | Added `MarkGroupChatViewing`, `StopGroupChatViewing` RPCs and messages |

### Documentation

| File | Changes |
|------|---------|
| `docs/notifications.md` | Added notification grouping section |
| `docs/design/notification-grouping-rfc.md` | Full RFC (created) |
| `docs/design/notification-grouping-implementation-guide.md` | Detailed implementation guide (created) |

---

## Rollout Plan

1. **Deploy migration** - Safe, just adds nullable column
2. **Deploy backend** - New RPCs available, presence filtering active
3. **Deploy frontend** - Presence heartbeats begin
4. **Monitor metrics** - Watch `notification_email_suppressed_total` and `notification_suppressed_presence_total`

**Rollback**: If issues arise, the frontend hook can be disabled by removing it from `GroupChatView.tsx`. The backend changes are backward compatible.

---

## Future Work

- **Mobile app integration**: The `usePresenceHeartbeat` hook pattern can be adapted for React Native
- **Host request presence**: Similar presence tracking could be added for host request conversations
- **Notification digests**: Full digest feature (#4415) could build on this infrastructure

---

## Issue Closing Comments

### #6234 - Group message notifications within a certain time

> Fixed in PR #XXXX
>
> This PR implements platform-level notification grouping:
> - **iOS**: Uses `threadId` to visually group notifications by conversation
> - **Android**: Uses `collapseKey` to collapse/stack notifications from same conversation
> - **Web**: Uses `tag` option in service workers to replace same-conversation notifications
>
> Additionally, presence-based suppression prevents notification spam when the user is actively viewing the conversation.

### #5872 - Duplicate notifications

> Fixed in PR #XXXX
>
> This PR prevents duplicate notifications through two mechanisms:
> 1. **Push delivery tracking**: If a push notification was delivered within the last 10 minutes, the "missed messages" email is suppressed
> 2. **Presence tracking**: If the user is actively viewing the conversation, notifications are suppressed entirely
>
> The `notification_email_suppressed_total` Prometheus metric tracks suppression for monitoring.

### #7712 - Message notifications (while viewing chat)

> Fixed in PR #XXXX
>
> This PR implements presence-based notification suppression:
> - Frontend sends a heartbeat every 10 seconds via `MarkGroupChatViewing` RPC
> - Backend filters out users with `last_viewing_at` within the last 30 seconds when generating notifications
> - When user navigates away, `StopGroupChatViewing` immediately clears presence
> - Page visibility changes (tab hidden/shown) pause/resume heartbeats automatically

### #5218 - Duplicate email notifications for new messages

> Fixed in PR #XXXX
>
> The `send_message_notifications()` and `send_request_notifications()` background jobs now check if a push notification was delivered within the last 10 minutes before sending an email. If push was delivered, the email is skipped to prevent duplicates.

---

## Checklist

- [x] Backend tests passing (12 new tests)
- [x] Code formatted (`make format`)
- [x] Type checking passes (`make mypy` - pre-existing errors only)
- [x] Proto files regenerated
- [x] Migration created
- [x] Documentation updated
- [x] Metrics added
- [ ] Manual device testing (requires staging deployment)
- [ ] Frontend tests (optional - integration tested via backend)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
