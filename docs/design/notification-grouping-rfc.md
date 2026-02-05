# RFC: Notification Grouping and Deduplication

**Author:** Couchers Dev Team
**Date:** 2026-02-05
**Status:** Implemented
**Related Issues:** #6234, #5218, #5872, #7712, #4415
**Implementation:** See [Implementation Guide](notification-grouping-implementation-guide.md)

## Summary

This RFC proposes improvements to the Couchers notification system to address notification spam, duplicate notifications, and lack of context awareness. The goal is to provide users with timely, relevant notifications without overwhelming them.

## Background

### Current System Architecture

The notification system has two parallel paths for chat messages:

```
Message Created
      │
      ├──► Path 1: Immediate (chat:message)
      │    ├── Push notification: IMMEDIATE
      │    └── Digest: queued for batch
      │
      └──► Path 2: Missed Messages (chat:missed_messages)
           └── Email: sent after 5+ minutes if unseen
           └── Runs every 3 minutes as batch job
```

**Key Files:**
- `couchers/notifications/notify.py` - Entry point for creating notifications
- `couchers/notifications/background.py` - Handles notification delivery
- `couchers/jobs/handlers.py` - Background jobs including `send_message_notifications()`
- `couchers/servicers/conversations.py` - Triggers `generate_message_notifications()`
- `couchers/notifications/push.py` - Push notification delivery
- `couchers/notifications/send_raw_push_notification.py` - Platform-specific push payloads

### Current Notification Flow

1. User sends a message
2. `generate_message_notifications()` creates a `chat:message` notification for each recipient
3. `handle_notification()` immediately sends push notification and queues digest
4. Every 3 minutes, `send_message_notifications()` checks for unseen messages older than 5 minutes
5. If found, creates `chat:missed_messages` notification which sends an email

### Existing Infrastructure

The codebase already has partial support for notification grouping:

**Expo collapse_key (from `send_raw_push_notification.py`):**
```python
collapse_key = None
if payload.topic_action and payload.key:
    collapse_key = f"{payload.topic_action}_{payload.key}"

result = send_expo_push_notification(
    token=not_none(sub.token),
    title=payload.title,
    body=payload.body,
    data={...},
    collapse_key=collapse_key,  # Already passed!
)
```

This means Expo notifications already support collapsing, but we need to verify it's working correctly and extend to web push.

## Problem Statement

### Issue #6234: Notification Spam
When a user sends multiple messages in quick succession, recipients receive a separate push notification for each message. This results in:
- Phone buzzing multiple times
- Notification tray filled with redundant notifications
- Poor user experience

### Issues #5218, #5872: Duplicate Notifications
Users receive two notifications for a single message:
1. Immediate push notification (`chat:message`)
2. "You have unread messages" email after 5 minutes (`chat:missed_messages`)

From issue comments:
> "Actually, it's not a notification on every message, it's a notification of the initial message and then a 'you have unread messages' notification after that. But effectively you always get two notifications unless you read your new message(s) right away."

### Issue #7712: No Context Awareness
Users receive notifications even when they're actively viewing the conversation:
> "I was in the chat, but for every message I got a notification which was very annoying as I had chat opened."

### Issue #4415: No Digest Option
Users cannot opt into batched/digest notifications for less urgent notification types. The infrastructure is ~80% complete but not exposed to users.

## Proposed Solution

### Design Principles

1. **Respect user attention** - Minimize interruptions while ensuring important messages are seen
2. **Platform-native behavior** - Leverage iOS/Android notification grouping capabilities
3. **Graceful degradation** - System should work even if some components fail
4. **Backwards compatible** - Existing notification preferences should continue to work
5. **Follow existing patterns** - Use established Couchers coding conventions

### Solution Components

#### Component 1: Platform-Level Notification Grouping

Add platform-specific grouping identifiers to push notifications so the OS can stack related notifications together.

**File: `couchers/notifications/send_raw_push_notification.py`**

Update `_send_web_push()` to include thread grouping:
```python
def _send_web_push(
    sub: PushNotificationSubscription, payload: jobs_pb2.SendRawPushNotificationPayloadV2
) -> PushDeliveryResult:
    data = json.dumps(
        {
            "title": payload.title,
            "body": payload.body,
            "icon": payload.icon,
            "url": payload.url,
            "user_id": payload.user_id,
            "topic_action": payload.topic_action,
            "key": payload.key,
            # NEW: Add thread_id for notification grouping
            "thread_id": f"{payload.topic_action}_{payload.key}" if payload.key else None,
        }
    ).encode("utf8")
    # ... rest of function
```

Update `_send_expo()` to include iOS thread-id:
```python
def _send_expo(
    sub: PushNotificationSubscription, payload: jobs_pb2.SendRawPushNotificationPayloadV2
) -> PushDeliveryResult:
    collapse_key = None
    thread_id = None
    if payload.topic_action and payload.key:
        collapse_key = f"{payload.topic_action}_{payload.key}"
        thread_id = f"{payload.topic_action}_{payload.key}"

    result = send_expo_push_notification(
        token=not_none(sub.token),
        title=payload.title,
        body=payload.body,
        data={
            "url": payload.url,
            "topic_action": payload.topic_action,
            "key": payload.key,
        },
        collapse_key=collapse_key,
        # NEW: Add thread_id for iOS notification grouping
        thread_id=thread_id,
    )
```

**Impact:** Users see grouped notifications per conversation instead of individual notifications per message.

#### Component 2: Duplicate Notification Prevention

Prevent `chat:missed_messages` email from firing when the user has already received a push notification.

**File: `couchers/jobs/handlers.py`**

Modify `send_message_notifications()` to check for recent push deliveries:

```python
def send_message_notifications(payload: empty_pb2.Empty) -> None:
    """
    Sends out email notifications for messages that have been unseen for a long enough time.

    Now also checks if push notifications were successfully delivered recently,
    to avoid duplicate notifications (fixes #5218, #5872).
    """
    logger.info("Sending out email notifications for unseen messages")

    with session_scope() as session:
        # ... existing query to find users with unseen messages ...

        for user in users:
            context = make_background_user_context(user_id=user.id)

            # ... existing query to get unseen_messages ...

            if not unseen_messages:
                continue

            # NEW: Check if user received push notifications for these messages recently
            conversation_ids = [str(message.conversation_id) for _, message, _ in unseen_messages]

            recent_push_count = session.execute(
                couchers_select(func.count(NotificationDelivery.id))
                .join(Notification, NotificationDelivery.notification_id == Notification.id)
                .where(Notification.user_id == user.id)
                .where(Notification.topic_action == NotificationTopicAction.chat__message)
                .where(Notification.key.in_(conversation_ids))
                .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
                .where(NotificationDelivery.delivered > now() - timedelta(minutes=10))
            ).scalar_one()

            if recent_push_count > 0:
                # User already received push notification(s), skip email
                logger.info(f"Skipping missed_messages email for user {user.id}: {recent_push_count} recent push deliveries")
                # Still update last_notified_message_id to prevent re-checking
                user.last_notified_message_id = max(message.id for _, message, _ in unseen_messages)
                session.commit()
                continue

            # ... existing notification logic ...
```

**Note:** Uses `couchers_select` as required by coding standards. No try-catch blocks per conventions.

#### Component 3: Context Awareness (User Viewing State)

Track when a user is actively viewing a conversation and suppress notifications for that conversation.

**Approach: Heartbeat-based presence**

##### Proto Definition

**File: `app/proto/conversations.proto`**

Add new RPC and message (following existing patterns):
```protobuf
service Conversations {
  // ... existing RPCs ...

  rpc MarkConversationViewing(MarkConversationViewingReq) returns (google.protobuf.Empty) {
    // Mark that the user is currently viewing a conversation
    // Call periodically (every 10s) while conversation is visible
    // Used to suppress notifications when user is actively reading
    //
    // Raises: NOT_FOUND if the conversation does not exist or user is not a member
  }
}

// Add after existing Req/Res messages (around line 235)
message MarkConversationViewingReq {
  uint64 group_chat_id = 1;
}
```

##### Database Model

**File: `couchers/models/conversations.py`**

Add new model following established patterns:
```python
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.conversations import Conversation
    from couchers.models.users import User


class ConversationPresence(Base, kw_only=True):
    """
    Tracks user presence/activity in conversations.
    Used to suppress notifications when user is actively viewing a conversation.
    Records are ephemeral and should be cleaned up periodically.
    """

    __tablename__ = "conversation_presences"

    # Primary key
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # Foreign keys with automatic indexing
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Timestamps
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # Relationships (at end of model per conventions)
    conversation: Mapped["Conversation"] = relationship(init=False)
    user: Mapped["User"] = relationship(init=False)

    # Table-level constraints and indexes
    __table_args__ = (
        # Enforce one presence record per user per conversation
        Index(
            "ix_conversation_presences_unique_user_conversation",
            conversation_id,
            user_id,
            unique=True,
        ),
        # Fast lookup for recent presence
        Index(
            "ix_conversation_presences_last_seen",
            last_seen,
        ),
    )
```

##### Servicer Implementation

**File: `couchers/servicers/conversations.py`**

Add method following existing patterns:
```python
def MarkConversationViewing(
    self, request: conversations_pb2.MarkConversationViewingReq, context: CouchersContext, session: Session
) -> empty_pb2.Empty:
    # Get user's subscription with visibility filtering
    subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

    if not subscription:
        context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

    # Upsert presence record
    presence = session.execute(
        couchers_select(ConversationPresence)
        .where(ConversationPresence.conversation_id == request.group_chat_id)
        .where(ConversationPresence.user_id == context.user_id)
    ).scalar_one_or_none()

    if presence:
        presence.last_seen = func.now()
    else:
        session.add(ConversationPresence(
            conversation_id=request.group_chat_id,
            user_id=context.user_id,
        ))

    return empty_pb2.Empty()
```

##### Notification Check

**File: `couchers/servicers/conversations.py`**

Modify `generate_message_notifications()` to check presence:
```python
def generate_message_notifications(payload: jobs_pb2.GenerateMessageNotificationsPayload) -> None:
    logger.info(f"Generating message notifications for message {payload.message_id}")

    with session_scope() as session:
        # ... existing message and subscription queries ...

        for sub in subscriptions:
            # NEW: Check if user is currently viewing this conversation
            recent_presence = session.execute(
                couchers_select(ConversationPresence)
                .where(ConversationPresence.conversation_id == message.conversation_id)
                .where(ConversationPresence.user_id == sub.user_id)
                .where(ConversationPresence.last_seen > now() - timedelta(seconds=30))
            ).scalar_one_or_none()

            if recent_presence:
                logger.debug(f"Skipping notification for user {sub.user_id}: currently viewing conversation")
                continue

            # ... existing notify() call ...
```

##### Frontend Integration

**File: `app/web/features/messages/usePresenceHeartbeat.ts`**

New hook following established patterns:
```typescript
import { useMutation } from "@tanstack/react-query";
import { useAuthContext } from "features/auth/AuthProvider";
import { RpcError } from "grpc-web";
import { useEffect, useRef } from "react";
import { service } from "service";

const PRESENCE_HEARTBEAT_INTERVAL = 10000; // 10 seconds

interface UsePresenceHeartbeatProps {
  groupChatId: number | undefined;
  enabled?: boolean;
}

export default function usePresenceHeartbeat({
  groupChatId,
  enabled = true,
}: UsePresenceHeartbeatProps) {
  const { authState } = useAuthContext();
  const { authenticated, jailed } = authState;
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: sendHeartbeat } = useMutation<void, RpcError, number>({
    mutationFn: (chatId) => service.conversations.markConversationViewing(chatId),
  });

  useEffect(() => {
    const shouldRun = groupChatId && authenticated && !jailed && enabled;

    if (!shouldRun) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat
    sendHeartbeat(groupChatId);

    // Set up interval for periodic heartbeats
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat(groupChatId);
    }, PRESENCE_HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [groupChatId, authenticated, jailed, enabled, sendHeartbeat]);

  return { sendHeartbeat };
}
```

**File: `app/web/service/conversations.ts`**

Add service method:
```typescript
export async function markConversationViewing(groupChatId: number): Promise<void> {
  const req = new MarkConversationViewingReq();
  req.setGroupChatId(groupChatId);
  await client.conversations.markConversationViewing(req);
}
```

#### Component 4: Time-Window Batching (Optional Enhancement)

**Deferred to future work.** The combination of platform grouping + duplicate prevention + context awareness should address the core issues. Time-window batching adds latency and complexity.

## Implementation Plan

### Phase 1: Platform Grouping (Low Risk, High Impact)

**Scope:** Verify and enhance `thread_id`/`collapse_key` in push notifications

**Files to modify:**
- `couchers/notifications/send_raw_push_notification.py` - Add thread_id to web push, verify Expo

**Effort:** Small (1-2 days)

**Testing:**
- Verify iOS notifications group by conversation
- Verify Android notifications replace previous in same conversation
- Add unit tests for payload construction

### Phase 2: Duplicate Prevention (Medium Risk, High Impact)

**Scope:** Prevent `missed_messages` email when push was delivered

**Files to modify:**
- `couchers/jobs/handlers.py` - Add push delivery check in `send_message_notifications()`

**Effort:** Small-Medium (2-3 days)

**Testing:**
- Receive message, verify only push notification (no email after 5 min)
- Disable push, receive message, verify email arrives
- Push delivery fails, verify email arrives as fallback
- Add unit tests with `push_collector` fixture

### Phase 3: Context Awareness (Medium Risk, Medium Impact)

**Scope:** Suppress notifications when user is viewing conversation

**Files to modify:**
- `couchers/models/conversations.py` - Add `ConversationPresence` model
- `couchers/migrations/versions/` - Add migration
- `couchers/servicers/conversations.py` - Add `MarkConversationViewing` RPC
- `couchers/servicers/conversations.py` - Check presence in `generate_message_notifications()`
- `app/proto/conversations.proto` - Add new RPC and message
- `app/web/features/messages/usePresenceHeartbeat.ts` - New hook
- `app/web/service/conversations.ts` - Add service method
- `app/web/features/messages/groupchats/GroupChatView.tsx` - Use hook

**Effort:** Medium (3-5 days)

**Testing:**
- Open conversation, receive message, verify no notification
- Close conversation, receive message, verify notification arrives
- Multiple devices: one viewing, one not - verify correct behavior
- Test with `session_scope()` in unit tests

### Phase 4: Enhanced Digests (Lower Priority)

**Deferred.** Focus on Phases 1-3 first.

## Database Changes

### Phase 2: No schema changes required
Uses existing `NotificationDelivery` table.

### Phase 3: New presence tracking

**Migration file: `couchers/migrations/versions/xxxx_add_conversation_presences.py`**

```python
"""Add conversation presences

Revision ID: <generated>
Revises: <previous>
Create Date: <timestamp>
"""

import sqlalchemy as sa
from alembic import op

revision = "<generated>"
down_revision = "<previous>"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "conversation_presences",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("conversation_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            name=op.f("fk_conversation_presences_conversation_id_conversations"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_conversation_presences_user_id_users"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_conversation_presences")),
    )
    op.create_index(
        op.f("ix_conversation_presences_conversation_id"),
        "conversation_presences",
        ["conversation_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_conversation_presences_user_id"),
        "conversation_presences",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_conversation_presences_unique_user_conversation",
        "conversation_presences",
        ["conversation_id", "user_id"],
        unique=True,
    )
    op.create_index(
        "ix_conversation_presences_last_seen",
        "conversation_presences",
        ["last_seen"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_conversation_presences_last_seen", table_name="conversation_presences")
    op.drop_index("ix_conversation_presences_unique_user_conversation", table_name="conversation_presences")
    op.drop_index(op.f("ix_conversation_presences_user_id"), table_name="conversation_presences")
    op.drop_index(op.f("ix_conversation_presences_conversation_id"), table_name="conversation_presences")
    op.drop_table("conversation_presences")
```

## API Changes

### New RPC (Phase 3)

```protobuf
service Conversations {
  // ... existing RPCs ...

  rpc MarkConversationViewing(MarkConversationViewingReq) returns (google.protobuf.Empty) {
    // Mark that the user is currently viewing a conversation
    // Call periodically (every 10s) while conversation is visible
    //
    // Raises: NOT_FOUND if the conversation does not exist or user is not a member
  }
}

message MarkConversationViewingReq {
  uint64 group_chat_id = 1;
}
```

## Backward Compatibility

- **Phase 1:** Fully backward compatible. Old clients still work, just don't get grouping benefits.
- **Phase 2:** Fully backward compatible. Reduces notifications, doesn't add new requirements.
- **Phase 3:** Gracefully degrades. Old clients that don't send heartbeats will continue to receive all notifications (current behavior).

## Rollout Plan

1. **Phase 1:** Deploy to staging, verify with iOS/Android devices, then production
2. **Phase 2:** Deploy to staging, monitor for 1 week, then production
3. **Phase 3:** Deploy to staging, test with multiple devices, then production

## Metrics and Monitoring

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Push notifications per message | 1.0 | 1.0 (but grouped) |
| Emails per message (when push succeeds) | ~2.0 | ~0.1 |
| User complaints about notification spam | High | Low |
| Notification preference changes (disabling) | X% | <X% |

### Monitoring

- Track `NotificationDelivery` success rates by type (existing Prometheus metrics)
- Monitor `send_message_notifications` job - should create fewer notifications
- Add `push_notification_counter.labels(...)` for new grouping behavior

## Coding Standards Compliance

This RFC follows Couchers coding standards:

### Backend (Python)
- Uses `couchers_select` instead of raw `select()` per CLAUDE.md
- No try-catch blocks that silently swallow exceptions
- Uses `session_scope()` for database access in jobs
- Uses `mapped_column` style for SQLAlchemy 2.0 models
- Puts relationships at end of model definitions
- Uses `DateTime(timezone=True)` for all timestamps
- Uses `BigInteger` for primary keys
- Uses keyword-only parameters in functions where appropriate

### Proto
- Uses `uint64` for IDs (not `int64`)
- Uses `Req` suffix for request messages
- Includes documentation comments with error conditions
- Follows existing field numbering patterns

### Frontend (TypeScript)
- Uses React Query patterns with proper generics
- Uses `useRef` for interval tracking (not state)
- Cleans up intervals on unmount
- Uses `RpcError` as error type
- Follows existing hook patterns from `useMarkLastSeen.ts`

## Alternatives Considered

### 1. Client-side notification deduplication
**Rejected:** Doesn't solve push spam - phone still buzzes multiple times.

### 2. Aggressive rate limiting (Discord-style max 3 notifications)
**Deferred:** May be added later, but platform grouping solves most of the problem without arbitrary limits.

### 3. WebSocket-based presence
**Rejected:** More complex infrastructure. Heartbeat approach is simpler and sufficient.

### 4. Redis for presence tracking
**Deferred:** Database table is simpler for now. Can migrate to Redis later if needed for performance.

### 5. Single notification type for all chat messages
**Rejected:** Would lose the ability to have different delivery preferences for immediate vs. digest notifications.

## Open Questions

1. **Host request messages:** Should the same logic apply to host request messages? Recommend yes - same pattern, different topic_action.

2. **Mobile app behavior:** React Native Expo uses same service layer. Hook can be adapted for mobile. Need to verify `AppState` handling for background/foreground.

3. **Presence cleanup job:** Should we add a scheduled job to clean up old presence records? Recommend yes - add `cleanup_old_presences` job running hourly to delete records older than 1 hour.

4. **Metrics:** What Prometheus metrics should we add? Recommend:
   - `notification_suppressed_viewing_total` - notifications suppressed due to presence
   - `notification_suppressed_push_delivered_total` - emails suppressed due to push delivery

## References

- [iOS Notification Grouping](https://developer.apple.com/documentation/usernotifications/grouping_notifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Discord Notification Behavior](https://support.discord.com/hc/en-us/community/posts/360043503392)
- [Slack Notification Settings](https://slack.com/help/articles/360025446073)
- [Couchers Notification System Docs](/docs/notifications.md)

## Appendix A: Issue Details

### #6234 - Group message notifications within a certain time
> When someone messages, it sends a notification for each message. When you next log in, you have a ton of notifications. Perhaps there's a way to group them within a certain time? Or only send a notification for the first message, unless the last one is marked `is_seen`?

### #5218 - Duplicate email notifications
> First email arrived at 6:15am, other email arrived at 6:21am on the same day... This is annoying and users have complained about this in the past.

### #5872 - Duplicate notifications
> I'm getting two notifications for each message I receive.

### #7712 - Notifications when chat is open
> I was in the chat, but for every message I got a notification which was very annoying as I had chat opened.

### #4415 - Notification digests
> About 80% of the infrastructure for this exists in the backend. My idea is as follows: When a user receives a notification that is not important enough to send its own email for, the user can choose instead digest delivery.

## Appendix B: Codebase Patterns Reference

### notify() Function Signature
```python
def notify(
    session: Session,
    *,
    user_id: int,
    topic_action: NotificationTopicAction,
    key: str,
    data: Message | None = None,
    moderation_state_id: int | None = None,
) -> None:
```

### Background Job Handler Pattern
```python
def my_job_handler(payload: jobs_pb2.MyPayload) -> None:
    """
    Documentation about what the job does.
    """
    logger.info("Starting job description")

    with session_scope() as session:
        # Query and modify database
        # commit() after each logical unit of work
        session.commit()
```

### Model Definition Pattern
```python
class MyModel(Base, kw_only=True):
    """Docstring explaining the table purpose"""
    __tablename__ = "my_table"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    foreign_id: Mapped[int] = mapped_column(ForeignKey("other_table.id"), index=True)

    # Relationships at end
    other: Mapped["OtherModel"] = relationship(init=False)
```
