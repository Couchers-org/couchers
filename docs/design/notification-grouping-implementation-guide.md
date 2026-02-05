# Notification Grouping Implementation Guide

**RFC:** [notification-grouping-rfc.md](./notification-grouping-rfc.md)
**Related Issues:** #6234, #5218, #5872, #7712, #4415
**Last Updated:** 2026-02-05
**Status:** In Progress (Phase 1, 2, 3 complete; Phase 4 partial)

---

## Quick Context for Future Sessions

This implementation addresses notification spam and duplicate notifications in the Couchers platform. The core problems are:

1. **Multiple push notifications** when someone sends several messages quickly
2. **Duplicate notifications** - users get both push AND email for the same message
3. **No context awareness** - notifications fire even when user is viewing the chat

**Solution approach:**
- Phase 1: Platform-level notification grouping (iOS/Android)
- Phase 2: Suppress email when push was delivered
- Phase 3: Track user presence to suppress notifications when viewing chat

**Key files to understand:**
- `couchers/notifications/notify.py` - Creates notifications
- `couchers/notifications/send_raw_push_notification.py` - Sends push notifications
- `couchers/jobs/handlers.py` - Background jobs including `send_message_notifications()`
- `couchers/servicers/conversations.py` - Chat servicer, `generate_message_notifications()`

---

## Overall Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Platform Grouping | Complete | 4/5 tasks (manual testing pending) |
| Phase 2: Duplicate Prevention | Complete | 6/6 tasks |
| Phase 3: Context Awareness | Complete | Backend 5/5, Frontend 3/4 tasks (tests pending) |
| Phase 4: Cleanup & Polish | In Progress | 1/4 tasks (metrics added) |

---

## Phase 1: Platform-Level Notification Grouping

**Goal:** Leverage iOS/Android native notification grouping so multiple messages in the same conversation stack together.

**Impact:** High - reduces notification tray clutter
**Risk:** Low - additive change, no breaking changes
**Estimated Effort:** 1-2 days

### Prerequisites
- [ ] Read and understand `couchers/notifications/send_raw_push_notification.py`
- [ ] Read and understand `couchers/notifications/push.py`
- [ ] Understand Expo push notification format

### Tasks

#### Task 1.1: Audit Existing Collapse Key Implementation
**Status:** ✅ Complete

**Description:** The codebase already has `collapse_key` for Expo. Verify it's working correctly.

**File:** `couchers/notifications/send_raw_push_notification.py`

**Steps:**
1. [ ] Read `_send_expo()` function (around line 150)
2. [ ] Verify `collapse_key` is being set: `f"{payload.topic_action}_{payload.key}"`
3. [ ] Check if `send_expo_push_notification()` actually uses the collapse_key
4. [ ] Document current behavior in this section

**Current Code (for reference):**
```python
collapse_key = None
if payload.topic_action and payload.key:
    collapse_key = f"{payload.topic_action}_{payload.key}"
```

**Findings:**
```
✅ VERIFIED: collapse_key is correctly implemented for Expo (lines 121-124 of send_raw_push_notification.py)
   - Format: f"{payload.topic_action}_{payload.key}"
   - Passed to send_expo_push_notification() which adds it as "collapseKey" in the message

❌ MISSING: iOS thread_id (threadId) is NOT implemented
   - Expo supports threadId parameter for iOS notification grouping
   - expo_api.py does NOT accept or pass threadId

❌ MISSING: Web push grouping is NOT implemented
   - _send_web_push() does not include any grouping identifier
   - service-worker.js does not use the 'tag' option in showNotification()
```

---

#### Task 1.2: Add thread_id for iOS Notification Grouping
**Status:** ✅ Complete

**Description:** iOS uses `thread-id` (via `threadId` in Expo) to group notifications visually.

**File:** `couchers/notifications/send_raw_push_notification.py`

**Steps:**
1. [ ] Locate `_send_expo()` function
2. [ ] Add `thread_id` variable alongside `collapse_key`
3. [ ] Pass `thread_id` to `send_expo_push_notification()` call
4. [ ] Verify `send_expo_push_notification()` accepts and uses `threadId` parameter

**Code Change:**
```python
# In _send_expo() function
collapse_key = None
thread_id = None  # NEW
if payload.topic_action and payload.key:
    collapse_key = f"{payload.topic_action}_{payload.key}"
    thread_id = f"{payload.topic_action}_{payload.key}"  # NEW

result = send_expo_push_notification(
    token=not_none(sub.token),
    title=payload.title,
    body=payload.body,
    data={...},
    collapse_key=collapse_key,
    thread_id=thread_id,  # NEW - check if this param exists
)
```

**Notes:**
```
[Add implementation notes here]
```

---

#### Task 1.3: Add thread_id to Web Push Payload
**Status:** ✅ Complete

**Description:** Add grouping identifier to web push notifications for browser support.

**File:** `couchers/notifications/send_raw_push_notification.py`

**Steps:**
1. [ ] Locate `_send_web_push()` function
2. [ ] Add `thread_id` to the JSON payload
3. [ ] Update service worker to handle thread_id (if needed)

**Code Change:**
```python
# In _send_web_push() function
data = json.dumps(
    {
        "title": payload.title,
        "body": payload.body,
        "icon": payload.icon,
        "url": payload.url,
        "user_id": payload.user_id,
        "topic_action": payload.topic_action,
        "key": payload.key,
        "thread_id": f"{payload.topic_action}_{payload.key}" if payload.key else None,  # NEW
    }
).encode("utf8")
```

**Service Worker Update (if needed):**
- [ ] Check `app/web/public/service-worker.js` for notification handling
- [ ] Add `tag` parameter to notification options using `thread_id`

---

#### Task 1.4: Write Unit Tests for Notification Grouping
**Status:** ✅ Complete

**Description:** Add tests to verify grouping identifiers are included in payloads.

**File:** `tests/test_notifications.py` (or create new test file)

**Steps:**
1. [ ] Create test for Expo payload including collapse_key and thread_id
2. [ ] Create test for web push payload including thread_id
3. [ ] Test edge case: empty key should not include thread_id
4. [ ] Run tests: `uv run pytest tests/test_notifications.py -v`

**Test Cases:**
```python
def test_expo_push_includes_collapse_key_and_thread_id():
    # Test that chat:message notifications include grouping keys
    pass

def test_web_push_includes_thread_id():
    # Test that web push payload includes thread_id
    pass

def test_empty_key_excludes_thread_id():
    # Test that notifications with key="" don't include thread_id
    pass
```

---

#### Task 1.5: Manual Testing on Devices
**Status:** Not Started

**Description:** Verify grouping works on actual iOS and Android devices.

**Steps:**
1. [ ] Deploy to staging environment
2. [ ] Test iOS: Send multiple messages, verify notifications group
3. [ ] Test Android: Send multiple messages, verify notifications stack/replace
4. [ ] Test web browser: Check notification behavior
5. [ ] Document test results

**Test Results:**
```
iOS:
- [ ] Notifications group by conversation: [Pass/Fail]
- [ ] Tapping grouped notification opens correct chat: [Pass/Fail]

Android:
- [ ] Notifications collapse/stack: [Pass/Fail]
- [ ] Latest message shown: [Pass/Fail]

Web:
- [ ] Browser notifications work: [Pass/Fail]
- [ ] Tag-based grouping works: [Pass/Fail]
```

---

### Phase 1 Completion Checklist
- [ ] All tasks completed
- [ ] Tests passing
- [ ] Code formatted: `make format`
- [ ] Type checking passes: `make mypy`
- [ ] Manual testing completed on devices
- [ ] PR created and reviewed
- [ ] Merged to develop

---

## Phase 2: Duplicate Notification Prevention

**Goal:** Prevent "missed messages" email from firing when user already received a push notification.

**Impact:** High - eliminates most duplicate notifications
**Risk:** Medium - modifies existing job logic
**Estimated Effort:** 2-3 days

### Prerequisites
- [ ] Phase 1 completed
- [ ] Read and understand `couchers/jobs/handlers.py` - `send_message_notifications()`
- [ ] Read and understand `couchers/models/notifications.py` - `NotificationDelivery`
- [ ] Understand the notification delivery tracking system

### Tasks

#### Task 2.1: Understand Current send_message_notifications() Logic
**Status:** ✅ Complete

**Description:** Document the current flow before making changes.

**File:** `couchers/jobs/handlers.py` (lines ~178-287)

**Steps:**
1. [ ] Read `send_message_notifications()` function thoroughly
2. [ ] Document the query that finds users with unseen messages
3. [ ] Document how `user.last_notified_message_id` is used
4. [ ] Identify where to add the push delivery check

**Current Flow:**
```
1. Find users with unseen messages older than 5 minutes
2. For each user:
   a. Query all unseen messages across all group chats
   b. Update user.last_notified_message_id
   c. Create chat:missed_messages notification
   d. Commit
```

**Notes:**
```
[Add detailed notes here after reading the code]
```

---

#### Task 2.2: Design Push Delivery Check Query
**Status:** ✅ Complete (implemented in Task 2.3)

**Description:** Design the query to check if push was recently delivered.

**Steps:**
1. [ ] Identify the tables needed: `Notification`, `NotificationDelivery`
2. [ ] Design query to check for recent push deliveries
3. [ ] Determine time window (recommend 10 minutes)
4. [ ] Consider edge cases

**Query Design:**
```python
# Check if user received push notifications for these conversations recently
recent_push_count = session.execute(
    couchers_select(func.count(NotificationDelivery.id))
    .join(Notification, NotificationDelivery.notification_id == Notification.id)
    .where(Notification.user_id == user.id)
    .where(Notification.topic_action == NotificationTopicAction.chat__message)
    .where(Notification.key.in_(conversation_ids))
    .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
    .where(NotificationDelivery.delivered > now() - timedelta(minutes=10))
).scalar_one()
```

**Edge Cases to Consider:**
- [ ] What if push was attempted but failed?
- [ ] What if user has push disabled?
- [ ] What about multiple conversations with mixed push delivery?

---

#### Task 2.3: Implement Push Delivery Check in send_message_notifications()
**Status:** ✅ Complete

**Description:** Add the check to skip email when push was delivered.

**File:** `couchers/jobs/handlers.py`

**Steps:**
1. [ ] Add import for `NotificationDelivery` if not present
2. [ ] After getting `unseen_messages`, extract conversation_ids
3. [ ] Add the push delivery check query
4. [ ] If push was delivered, log and skip email (but still update last_notified_message_id)
5. [ ] Run `make format`

**Code Location:** After line ~250 (after `if not unseen_messages: continue`)

**Implementation:**
```python
# After: if not unseen_messages: continue

# NEW: Check if user received push notifications recently
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
    logger.info(f"Skipping missed_messages email for user {user.id}: {recent_push_count} recent push deliveries")
    # Still update tracking to prevent re-checking
    user.last_notified_message_id = max(message.id for _, message, _ in unseen_messages)
    session.commit()
    continue

# ... existing notify() call ...
```

---

#### Task 2.4: Apply Same Logic to send_request_notifications()
**Status:** ✅ Complete

**Description:** Apply the same duplicate prevention to host request messages.

**File:** `couchers/jobs/handlers.py` (lines ~289-408)

**Steps:**
1. [ ] Read `send_request_notifications()` function
2. [ ] Identify similar location to add push check
3. [ ] Adapt the query for host_request:message topic_action
4. [ ] Implement and test

**Notes:**
```
[Add implementation notes here]
```

---

#### Task 2.5: Write Unit Tests for Duplicate Prevention
**Status:** ✅ Complete (3 tests added to test_bg_jobs.py)

**Description:** Add tests to verify email is skipped when push was delivered.

**File:** `tests/test_bg_jobs.py` or new test file

**Steps:**
1. [ ] Create test: push delivered → no email sent
2. [ ] Create test: push not delivered → email sent
3. [ ] Create test: push failed → email sent (fallback)
4. [ ] Create test: mixed conversations (some with push, some without)
5. [ ] Run tests

**Test Cases:**
```python
def test_skip_email_when_push_delivered():
    """Email should be skipped if push notification was delivered recently."""
    pass

def test_send_email_when_no_push_delivered():
    """Email should be sent if no push notification was delivered."""
    pass

def test_send_email_when_push_failed():
    """Email should be sent as fallback when push delivery failed."""
    pass

def test_mixed_conversations_partial_push():
    """Handle case where some conversations had push, others didn't."""
    pass
```

---

#### Task 2.6: Add Prometheus Metrics
**Status:** ✅ Complete

**Description:** Add metrics to track email suppression.

**File:** `couchers/metrics.py`, `couchers/jobs/handlers.py`

**Implementation:**
```python
# In metrics.py
notification_email_suppressed_counter: Counter = Counter(
    "couchers_notification_email_suppressed_total",
    "Number of notification emails suppressed",
    labelnames=["reason"],
)

# In handlers.py (3 locations where email is skipped)
notification_email_suppressed_counter.labels(reason="push_delivered").inc()
```

---

### Phase 2 Completion Checklist
- [ ] All tasks completed
- [ ] Tests passing
- [ ] Code formatted: `make format`
- [ ] Type checking passes: `make mypy`
- [ ] Metrics added and verified
- [ ] Manual testing completed
- [ ] PR created and reviewed
- [ ] Merged to develop

---

## Phase 3: Context Awareness (User Viewing State)

**Goal:** Suppress notifications when user is actively viewing the conversation.

**Impact:** Medium - eliminates "notification while chatting" annoyance
**Risk:** Low - single column addition, new API endpoint, frontend changes
**Estimated Effort:** 2-3 days

### Implementation Approach (Simplified)

**Original RFC proposed:** A separate `ConversationPresence` table to track user presence.

**Simplified approach implemented:** Instead of a new table, we added a `last_viewing_at` column to the existing `GroupChatSubscription` table. This is simpler because:
1. **No new table needed** - just a single nullable column addition
2. **Already queried** - `GroupChatSubscription` is already joined when generating notifications
3. **Same lookup pattern** - check `last_viewing_at > now() - 30s` in the existing query

### Prerequisites
- [x] Phase 2 completed
- [x] Read and understand `couchers/servicers/conversations.py`
- [x] Read and understand `app/proto/conversations.proto`
- [ ] Read and understand `app/web/features/messages/` hooks (for frontend)

### Backend Tasks (Complete)

#### Task 3.1: Add last_viewing_at Column to GroupChatSubscription
**Status:** ✅ Complete

**Description:** Add `last_viewing_at` column to track when user last actively viewed a conversation.

**File:** `couchers/models/conversations.py`

**Implementation:**
```python
# In GroupChatSubscription class (line 94)
# when the user last actively viewed this conversation (for presence-based notification suppression)
last_viewing_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
```

---

#### Task 3.2: Create Database Migration
**Status:** ✅ Complete

**Description:** Migration to add `last_viewing_at` column.

**File:** `couchers/migrations/versions/a8c3d2e1f094_add_last_viewing_at.py`

**Implementation:**
```python
def upgrade() -> None:
    op.add_column(
        "group_chat_subscriptions",
        sa.Column("last_viewing_at", sa.DateTime(timezone=True), nullable=True),
    )

def downgrade() -> None:
    op.drop_column("group_chat_subscriptions", "last_viewing_at")
```

---

#### Task 3.3: Add Proto Definition
**Status:** ✅ Complete

**Description:** Add RPC and message to conversations.proto.

**File:** `app/proto/conversations.proto`

**Steps:**
1. [ ] Add RPC to Conversations service (after MarkLastSeenGroupChat)
2. [ ] Add MarkConversationViewingReq message (after MarkLastSeenGroupChatReq)
3. [ ] Regenerate protos: `cd app/backend && make protos`
4. [ ] Verify generated Python code

**Code to Add:**
```protobuf
// In service Conversations (around line 42)
rpc MarkConversationViewing(MarkConversationViewingReq) returns (google.protobuf.Empty) {
  // Mark that the user is currently viewing a conversation
  // Call periodically (every 10s) while conversation is visible
  //
  // Raises: NOT_FOUND if the conversation does not exist or user is not a member
}

// After MarkLastSeenGroupChatReq
message MarkConversationViewingReq {
  uint64 group_chat_id = 1;
}
```

---

#### Task 3.4: Implement Servicer Method
**Status:** ✅ Complete

**Description:** Add MarkConversationViewing method to Conversations servicer.

**File:** `couchers/servicers/conversations.py`

**Implementation (simplified - just updates the subscription column):**
```python
def MarkConversationViewing(
    self, request: conversations_pb2.MarkConversationViewingReq, context: CouchersContext, session: Session
) -> empty_pb2.Empty:
    subscription = _get_visible_message_subscription(session, context, request.group_chat_id)

    if not subscription:
        context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "chat_not_found")

    subscription.last_viewing_at = func.now()

    return empty_pb2.Empty()
```

---

#### Task 3.5: Add Presence Check to generate_message_notifications()
**Status:** ✅ Complete

**Description:** Skip notification if user is currently viewing the conversation (within last 30 seconds).

**File:** `couchers/servicers/conversations.py` (in `generate_message_notifications`)

**Implementation (filter added to existing query):**
```python
# Skip users who are currently viewing the conversation (last_viewing_at within 30 seconds)
presence_cutoff = now() - timedelta(seconds=30)
user_ids_to_notify = (
    session.execute(
        where_users_column_visible(
            select(GroupChatSubscription.user_id)
            .where(GroupChatSubscription.group_chat_id == message.conversation_id)
            .where(GroupChatSubscription.user_id != message.author_id)
            .where(GroupChatSubscription.joined <= message.time)
            .where(or_(GroupChatSubscription.left == None, GroupChatSubscription.left >= message.time))
            .where(not_(GroupChatSubscription.is_muted))
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

---

### Frontend Tasks (Complete)

#### Task 3.6: Add Frontend Service Method
**Status:** ✅ Complete

**Description:** Add TypeScript service method to call the new RPC.

**File:** `app/web/service/conversations.ts`

**Steps:**
1. [ ] Import `MarkConversationViewingReq` from generated protos
2. [ ] Add `markConversationViewing` async function
3. [ ] Export from service namespace
4. [ ] Run `yarn format`

**Code:**
```typescript
export async function markConversationViewing(groupChatId: number): Promise<void> {
  const req = new MarkConversationViewingReq();
  req.setGroupChatId(groupChatId);
  await client.conversations.markConversationViewing(req);
}
```

---

#### Task 3.7: Create usePresenceHeartbeat Hook
**Status:** ✅ Complete

**Description:** Create React hook to send periodic heartbeats.

**File:** `app/web/features/messages/usePresenceHeartbeat.ts` (new file)

**Steps:**
1. [ ] Create new file with hook implementation
2. [ ] Use `useMutation` for the API call
3. [ ] Use `useRef` for interval tracking
4. [ ] Add cleanup on unmount
5. [ ] Export as default
6. [ ] Run `yarn format` and `yarn lint`

**Code:** (See RFC for full implementation)

---

#### Task 3.8: Integrate Hook into GroupChatView
**Status:** ✅ Complete

**Description:** Use the presence hook in the group chat view component.

**File:** `app/web/features/messages/groupchats/GroupChatView.tsx`

**Steps:**
1. [ ] Import `usePresenceHeartbeat` hook
2. [ ] Call hook with current `groupChatId`
3. [ ] Verify heartbeats are sent when viewing chat
4. [ ] Verify heartbeats stop when leaving chat

**Code:**
```typescript
// In GroupChatView component
usePresenceHeartbeat({
  groupChatId: chatId,
  enabled: !!chatId,
});
```

---

#### Task 3.9: Write Backend Unit Tests
**Status:** ✅ Complete

**Description:** Tests for presence tracking functionality.

**File:** `tests/test_conversations.py`

**Tests Added:**
1. `test_mark_conversation_viewing` - verifies `last_viewing_at` is updated
2. `test_mark_conversation_viewing_not_found` - verifies NOT_FOUND for non-member/non-existent chat
3. `test_notification_suppressed_when_viewing` - verifies no notification when user is viewing
4. `test_notification_sent_when_not_viewing` - verifies notification is sent when user is NOT viewing

---

### Phase 3 Backend Completion Checklist
- [x] `last_viewing_at` column added to `GroupChatSubscription` model
- [x] Migration created: `a8c3d2e1f094_add_last_viewing_at.py`
- [x] Proto definition added: `MarkConversationViewing` RPC
- [x] Servicer method implemented
- [x] Presence check added to `generate_message_notifications()`
- [x] All backend tests passing (4 new tests)
- [x] Code formatted: `make format`
- [ ] Migration applied to staging/production
- [ ] Frontend tasks (below)

---

#### Task 3.10 (renamed from 3.9): Write Frontend Unit Tests
**Status:** Not Started

**Description:** Test the presence tracking and notification suppression.

**File:** `tests/test_conversations.py` or new test file

**Test Cases:**
1. [ ] Test MarkConversationViewing creates presence record
2. [ ] Test MarkConversationViewing updates existing record
3. [ ] Test notification skipped when presence is recent
4. [ ] Test notification sent when presence is stale (>30s)
5. [ ] Test NOT_FOUND error for invalid conversation

---

#### Task 3.10: Write Frontend Tests
**Status:** Not Started

**Description:** Test the presence heartbeat hook.

**File:** `app/web/features/messages/__tests__/usePresenceHeartbeat.test.ts`

**Test Cases:**
1. [ ] Test heartbeat sent on mount
2. [ ] Test heartbeat sent periodically
3. [ ] Test cleanup on unmount
4. [ ] Test disabled when not authenticated

---

#### Task 3.11: Add Cleanup Job for Old Presence Records
**Status:** ✅ Not Needed (Simplified Design)

**Description:** Originally planned to add a scheduled job to clean up stale presence records.

**Why Not Needed:**
With the simplified approach using a `last_viewing_at` column on `GroupChatSubscription` instead of a separate `ConversationPresence` table:
- There are no separate presence records to accumulate
- The `last_viewing_at` timestamp is simply updated in place
- Old timestamps naturally become stale and are ignored (>30 seconds)
- No cleanup job is required

---

#### Task 3.12: Manual End-to-End Testing
**Status:** Not Started

**Description:** Test the full flow on staging.

**Test Scenarios:**
1. [ ] Open chat on device A, send message from device B → no notification on A
2. [ ] Close chat on device A, send message from device B → notification on A
3. [ ] Open chat on both devices, send message → neither gets notification
4. [ ] Background app on device A, send message from device B → notification on A
5. [ ] Test web and mobile apps

**Results:**
```
[Document test results here]
```

---

### Phase 3 Completion Checklist
- [ ] All tasks completed
- [ ] Backend tests passing
- [ ] Frontend tests passing
- [ ] Code formatted (backend and frontend)
- [ ] Type checking passes
- [ ] Manual E2E testing completed
- [ ] PR created and reviewed
- [ ] Merged to develop

---

## Phase 4: Cleanup & Polish

**Goal:** Final polish, documentation, and monitoring.

**Impact:** Low - maintenance and observability
**Risk:** Low
**Estimated Effort:** 1 day

### Tasks

#### Task 4.1: Add Prometheus Metrics
**Status:** ✅ Complete (core metrics added)

**Description:** Add metrics for monitoring notification behavior.

**Metrics Added:**
- [x] `couchers_notification_email_suppressed_total` - emails suppressed (with reason label)
- [x] `couchers_notification_suppressed_presence_total` - suppressed due to user viewing conversation

**Files:**
- `couchers/metrics.py` - Counter definitions
- `couchers/jobs/handlers.py` - Email suppression counter usage
- `couchers/servicers/conversations.py` - Presence suppression counter usage

**Metrics Not Needed (simplified approach):**
- `presence_heartbeat_total` - Can use existing servicer metrics
- `presence_cleanup_total` - Not needed since we use column instead of separate table

---

#### Task 4.2: Update Documentation
**Status:** Not Started

**Description:** Update system documentation.

**Files to Update:**
- [ ] `/docs/notifications.md` - Add section on grouping and presence
- [ ] Update RFC status to "Implemented"
- [ ] Add inline code comments where helpful

---

#### Task 4.3: Create Grafana Dashboard (Optional)
**Status:** Not Started

**Description:** Create dashboard for notification metrics.

**Panels:**
- [ ] Notifications sent by type
- [ ] Notifications suppressed by reason
- [ ] Presence heartbeat rate
- [ ] Presence records over time

---

#### Task 4.4: Final Review and Close Issues
**Status:** Not Started

**Description:** Close related GitHub issues.

**Issues to Close:**
- [ ] #6234 - Group message notifications
- [ ] #5218 - Duplicate email notifications
- [ ] #5872 - Duplicate notifications
- [ ] #7712 - Notifications when chat is open

**Close with comment linking to PRs.**

---

### Phase 4 Completion Checklist
- [ ] Metrics added and working
- [ ] Documentation updated
- [ ] Issues closed with links to PRs
- [ ] All tests passing
- [ ] Deployed to production
- [ ] Monitoring verified

---

## Session Handoff Notes

**For future Claude sessions working on this implementation:**

1. **Check this file first** for current progress
2. **Read the RFC** at `docs/design/notification-grouping-rfc.md` for full context
3. **Key coding standards:**
   - Use `couchers_select` not raw `select()`
   - Use `session_scope()` in jobs
   - No try-catch that silently swallows errors
   - Run `make format` after backend changes
   - Use `uint64` in protos, not `int64`
4. **Testing:**
   - Backend: `uv run pytest tests/test_specific.py -v`
   - Frontend: `yarn test`
5. **Before committing:**
   - `make format` (backend)
   - `make mypy` (backend)
   - `yarn format` (frontend)
   - `yarn lint` (frontend)

---

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-05 | Initial | Created implementation guide |
| 2026-02-05 | Claude | Completed Phase 1 tasks 1.1-1.4: Audited collapse_key, added threadId for iOS grouping, added thread_id to web push payload and service worker, wrote unit tests |
| 2026-02-05 | Claude | Completed Phase 2 tasks 2.1-2.5: Implemented push delivery check in send_message_notifications() and send_request_notifications(), added _has_recent_push_delivery helper, wrote 3 unit tests |
| 2026-02-05 | Claude | Completed Phase 3 backend tasks 3.1-3.5, 3.9: Simplified to last_viewing_at column on GroupChatSubscription, added MarkConversationViewing RPC and servicer, added presence filter to generate_message_notifications(), wrote 4 tests |
| 2026-02-05 | Claude | Completed Tasks 2.6 & 4.1: Added Prometheus metrics for notification suppression (email_suppressed, presence_suppressed counters) |
| 2026-02-05 | Claude | Fixed critical issues: Service worker event.waitUntil(), added boundary tests for 30s threshold |
| 2026-02-05 | Claude | Renamed API: MarkConversationViewing → MarkGroupChatViewing for consistency; Added StopGroupChatViewing RPC |
| 2026-02-05 | Claude | Added time constants: PRESENCE_ACTIVE_DURATION, MESSAGE_NOTIFICATION_DELAY, PUSH_NOTIFICATION_RECENCY_WINDOW |
| 2026-02-05 | Claude | Completed frontend tasks 3.6-3.8: Added service methods, created usePresenceHeartbeat hook with visibility handling, integrated into GroupChatView |

---

## Quick Commands Reference

```bash
# Backend
cd /Users/admin/couchers/app/backend
make format          # Format code
make mypy            # Type check
make protos          # Regenerate protos
uv run pytest tests/ # Run tests

# Frontend
cd /Users/admin/couchers/app/web
yarn format          # Format code
yarn lint            # Lint code
yarn test            # Run tests

# Full stack (Docker)
cd /Users/admin/couchers/app
docker compose up    # Start all services

# Git
git checkout -b backend/feature/notification-grouping
git add -p           # Stage changes interactively
```
