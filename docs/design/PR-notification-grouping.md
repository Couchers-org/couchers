# Pull Request: Notification Grouping and Presence-Based Suppression

Backend/Frontend: Notification grouping, duplicate prevention, and presence-based suppression

## Summary

This PR implements a solution to address notification spam in Couchers:

1. **Notification Grouping**: Groups push notifications by conversation using platform-specific mechanisms (iOS `threadId`, Android `collapseKey`, Web `tag`)
2. **Duplicate Prevention**: Skips email notifications if push was delivered within the last 10 minutes
3. **Presence-Based Suppression**: Suppresses notifications when user is actively viewing the chat

**Closes #6234, #5872, #7712, #5218**

## Implementation

### Backend Changes

**Files Changed:**
- `couchers/constants.py` - Added `PRESENCE_ACTIVE_DURATION`, `MESSAGE_NOTIFICATION_DELAY`, `PUSH_NOTIFICATION_RECENCY_WINDOW`
- `couchers/metrics.py` - Added email and presence suppression counters
- `couchers/models/conversations.py` - Added `last_viewing_at` column to `GroupChatSubscription`
- `couchers/servicers/conversations.py` - Added `MarkGroupChatViewing` and `StopGroupChatViewing` RPCs, presence filtering in notification generation
- `couchers/jobs/handlers.py` - Added push delivery check before sending emails
- `couchers/notifications/send_raw_push_notification.py` - Added `thread_id` to payloads for grouping

### Frontend Changes

**Files Changed:**
- `app/web/service/conversations.ts` - Added `markGroupChatViewing` and `stopGroupChatViewing`
- `app/web/features/messages/usePresenceHeartbeat.ts` - New hook for presence tracking
- `app/web/features/messages/groupchats/GroupChatView.tsx` - Integrated presence hook
- `app/web/public/service-worker.js` - Fixed service worker lifecycle, added notification grouping

### API Changes

New RPCs in `app/proto/conversations.proto`:
- `MarkGroupChatViewing` - Call every 10s while viewing
- `StopGroupChatViewing` - Call when navigating away

### Database Migration

`a8c3d2e1f094_add_last_viewing_at.py` - Adds nullable `last_viewing_at` column to `group_chat_subscriptions`

## Testing

12 new tests added:
- `test_notifications.py` - `test_expo_push_includes_thread_id`, `test_web_push_includes_thread_id`
- `test_bg_jobs.py` - `test_skip_email_when_push_delivered`, `test_send_email_when_no_push`, `test_send_email_stale_push`
- `test_conversations.py` - Presence tracking and notification suppression tests

## Checklist

- [x] Backend tests passing (12 new tests)
- [x] Code formatted (`make format`)
- [x] Type checking passes (`make mypy`)
- [x] Proto files regenerated
- [x] Migration created
- [x] Metrics added
