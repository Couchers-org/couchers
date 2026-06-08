# The source of truth for URLs is
# //docs/urls.md
# Please make sure this file stays in sync with that file as well as
# //app/web/src/routes.ts


from couchers.config import config


def app_link() -> str:
    return f"{config.BASE_URL}/"


def icon_url() -> str:
    return f"{config.BASE_URL}/logo512.png"


def profile_link() -> str:
    return f"{config.BASE_URL}/profile"


def user_link(*, username: str) -> str:
    return f"{config.BASE_URL}/user/{username}"


def edit_profile_link() -> str:
    return f"{config.BASE_URL}/profile/edit"


def signup_link(*, token: str) -> str:
    return f"{config.BASE_URL}/signup?token={token}"


def account_settings_link() -> str:
    return f"{config.BASE_URL}/account-settings"


def notification_settings_link() -> str:
    return f"{config.BASE_URL}/account-settings/notifications"


def feature_preview_link() -> str:
    return f"{config.BASE_URL}/preview"


def password_reset_link(*, password_reset_token: str) -> str:
    return f"{config.BASE_URL}/complete-password-reset?token={password_reset_token}"


def host_request_link_host() -> str:
    return f"{config.BASE_URL}/messages/hosting/"


def host_request_link_guest() -> str:
    return f"{config.BASE_URL}/messages/surfing/"


def host_request(*, host_request_id: str) -> str:
    return f"{config.BASE_URL}/messages/request/{host_request_id}"


def messages_link() -> str:
    return f"{config.BASE_URL}/messages/"


def chat_link(*, chat_id: int) -> str:
    return f"{config.BASE_URL}/messages/chats/{chat_id}"


def event_link(*, occurrence_id: int, slug: str = "e") -> str:
    return f"{config.BASE_URL}/event/{occurrence_id}/{slug}"


def community_link(*, node_id: int, slug: str = "e") -> str:
    return f"{config.BASE_URL}/community/{node_id}/{slug}"


def discussion_link(*, discussion_id: str, slug: str = "e") -> str:
    return f"{config.BASE_URL}/discussion/{discussion_id}/{slug}"


def leave_reference_link(*, reference_type: str, to_user_id: str, host_request_id: str | None = None) -> str:
    assert reference_type in ["friend", "surfed", "hosted"]
    if host_request_id:
        return f"{config.BASE_URL}/leave-reference/{reference_type}/{to_user_id}/{host_request_id}"
    else:
        return f"{config.BASE_URL}/leave-reference/{reference_type}/{to_user_id}"


def profile_references_link() -> str:
    return f"{config.BASE_URL}/profile/references"


def friend_requests_link(*, from_user_id: int | None = None) -> str:
    url = f"{config.BASE_URL}/connections/friends/"
    if from_user_id is not None:
        url += f"?from={from_user_id}"
    return url


def media_upload_url(*, path: str) -> str:
    return f"{config.MEDIA_SERVER_UPLOAD_BASE_URL}/{path}"


def change_email_link(*, confirmation_token: str) -> str:
    return f"{config.BASE_URL}/confirm-email?token={confirmation_token}"


def donation_url() -> str:
    return f"{config.BASE_URL}/donate"


def donation_cancelled_url() -> str:
    return f"{config.BASE_URL}/donate?cancelled=true"


def donation_success_url() -> str:
    return f"{config.BASE_URL}/donate?success=true"


def complete_strong_verification_url(*, verification_attempt_token: str) -> str:
    return f"{config.BASE_URL}/complete-strong-verification?verification_attempt_token={verification_attempt_token}"


def delete_account_link(*, account_deletion_token: str) -> str:
    return f"{config.BASE_URL}/delete-account?token={account_deletion_token}"


def recover_account_link(*, account_undelete_token: str) -> str:
    return f"{config.BASE_URL}/recover-account?token={account_undelete_token}"


def unsubscribe_link(*, payload: str, sig: str) -> str:
    return f"{config.BASE_URL}/quick-link?payload={payload}&sig={sig}"


def quick_link(*, payload: str, sig: str) -> str:
    return f"{config.BASE_URL}/quick-link?payload={payload}&sig={sig}"


def media_url(*, filename: str, size: str) -> str:
    return f"{config.MEDIA_SERVER_BASE_URL}/img/{size}/{filename}"


def console_link(*, page: str) -> str:
    return f"{config.CONSOLE_BASE_URL}/{page}"


def invite_code_link(*, code: str) -> str:
    return f"{config.BASE_URL}/invite?code={code}"


def postal_verification_link(*, code: str) -> str:
    return f"{config.BASE_URL}/verify-postal?c={code}"
