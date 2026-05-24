# The source of truth for URLs is
# //docs/urls.md
# Please make sure this file stays in sync with that file as well as
# //app/web/src/routes.ts


from typing import TYPE_CHECKING

from couchers.config import config

if TYPE_CHECKING:
    from couchers.context import CouchersContext


def app_link(context: CouchersContext) -> str:
    return f"{context.base_url}/"


def icon_url(context: CouchersContext) -> str:
    return f"{context.base_url}/logo512.png"


def profile_link(context: CouchersContext) -> str:
    return f"{context.base_url}/profile"


def user_link(context: CouchersContext, *, username: str) -> str:
    return f"{context.base_url}/user/{username}"


def edit_profile_link(context: CouchersContext) -> str:
    return f"{context.base_url}/profile/edit"


def signup_link(context: CouchersContext, *, token: str) -> str:
    return f"{context.base_url}/signup?token={token}"


def account_settings_link(context: CouchersContext) -> str:
    return f"{context.base_url}/account-settings"


def notification_settings_link(context: CouchersContext) -> str:
    return f"{context.base_url}/account-settings/notifications"


def feature_preview_link(context: CouchersContext) -> str:
    return f"{context.base_url}/preview"


def password_reset_link(context: CouchersContext, *, password_reset_token: str) -> str:
    return f"{context.base_url}/complete-password-reset?token={password_reset_token}"


def host_request_link_host(context: CouchersContext) -> str:
    return f"{context.base_url}/messages/hosting/"


def host_request_link_guest(context: CouchersContext) -> str:
    return f"{context.base_url}/messages/surfing/"


def host_request(context: CouchersContext, *, host_request_id: str) -> str:
    return f"{context.base_url}/messages/request/{host_request_id}"


def messages_link(context: CouchersContext) -> str:
    return f"{context.base_url}/messages/"


def chat_link(context: CouchersContext, *, chat_id: int) -> str:
    return f"{context.base_url}/messages/chats/{chat_id}"


def event_link(context: CouchersContext, *, occurrence_id: int, slug: str = "e") -> str:
    return f"{context.base_url}/event/{occurrence_id}/{slug}"


def community_link(context: CouchersContext, *, node_id: int, slug: str = "e") -> str:
    return f"{context.base_url}/community/{node_id}/{slug}"


def discussion_link(context: CouchersContext, *, discussion_id: str, slug: str = "e") -> str:
    return f"{context.base_url}/discussion/{discussion_id}/{slug}"


def leave_reference_link(
    context: CouchersContext, *, reference_type: str, to_user_id: str, host_request_id: str | None = None
) -> str:
    assert reference_type in ["friend", "surfed", "hosted"]
    if host_request_id:
        return f"{context.base_url}/leave-reference/{reference_type}/{to_user_id}/{host_request_id}"
    else:
        return f"{context.base_url}/leave-reference/{reference_type}/{to_user_id}"


def profile_references_link(context: CouchersContext) -> str:
    return f"{context.base_url}/profile/references"


def friend_requests_link(context: CouchersContext) -> str:
    return f"{context.base_url}/connections/friends/"


def media_upload_url(*, path: str) -> str:
    return f"{config['MEDIA_SERVER_UPLOAD_BASE_URL']}/{path}"


def change_email_link(context: CouchersContext, *, confirmation_token: str) -> str:
    return f"{context.base_url}/confirm-email?token={confirmation_token}"


def donation_url(context: CouchersContext) -> str:
    return f"{context.base_url}/donate"


def donation_cancelled_url(context: CouchersContext) -> str:
    return f"{context.base_url}/donate?cancelled=true"


def donation_success_url(context: CouchersContext) -> str:
    return f"{context.base_url}/donate?success=true"


def complete_strong_verification_url(context: CouchersContext, *, verification_attempt_token: str) -> str:
    return f"{context.base_url}/complete-strong-verification?verification_attempt_token={verification_attempt_token}"


def delete_account_link(context: CouchersContext, *, account_deletion_token: str) -> str:
    return f"{context.base_url}/delete-account?token={account_deletion_token}"


def recover_account_link(context: CouchersContext, *, account_undelete_token: str) -> str:
    return f"{context.base_url}/recover-account?token={account_undelete_token}"


def unsubscribe_link(context: CouchersContext, *, payload: str, sig: str) -> str:
    return f"{context.base_url}/quick-link?payload={payload}&sig={sig}"


def quick_link(context: CouchersContext, *, payload: str, sig: str) -> str:
    return f"{context.base_url}/quick-link?payload={payload}&sig={sig}"


def media_url(*, filename: str, size: str) -> str:
    return f"{config['MEDIA_SERVER_BASE_URL']}/img/{size}/{filename}"


def console_link(*, page: str) -> str:
    return f"{config['CONSOLE_BASE_URL']}/{page}"


def invite_code_link(context: CouchersContext, *, code: str) -> str:
    return f"{context.base_url}/invite?code={code}"


def postal_verification_link(context: CouchersContext, *, code: str) -> str:
    return f"{context.base_url}/verify-postal?c={code}"
