# The source of truth for URLs is
# //docs/urls.md
# Please make sure this file stays in sync with that file as well as
# //app/frontend/src/routes.ts

from couchers.config import config


def app_link():
    return f"{config['BASE_URL']}/"


def profile_link():
    return f"{config['BASE_URL']}/profile"


def user_link(username):
    return f"{config['BASE_URL']}/user/{username}"


def edit_profile_link():
    return f"{config['BASE_URL']}/profile/edit"


def signup_link(token):
    return f"{config['BASE_URL']}/signup/{token}"


def login_link(login_token):
    return f"{config['BASE_URL']}/login/{login_token}"


def password_reset_link(password_reset_token):
    return f"{config['BASE_URL']}/password-reset/{password_reset_token}"


def host_request_link_host():
    return f"{config['BASE_URL']}/messages/hosting/"


def host_request_link_guest():
    return f"{config['BASE_URL']}/messages/surfing/"


def messages_link():
    return f"{config['BASE_URL']}/messages/"


def leave_reference_link(reference_type, to_user_id, host_request_id=None):
    assert reference_type in ["friend", "surfed", "hosted"]
    if host_request_id:
        return f"{config['BASE_URL']}/leave-reference/{reference_type}/{to_user_id}/{host_request_id}"
    else:
        return f"{config['BASE_URL']}/leave-reference/{reference_type}/{to_user_id}"


def friend_requests_link():
    return f"{config['BASE_URL']}/connections/friends/"


def media_upload_url(path):
    return f"{config['MEDIA_SERVER_BASE_URL']}/{path}"


def change_email_link(confirmation_token):
    return f"{config['BASE_URL']}/confirm-email/{confirmation_token}"


def donation_cancelled_url():
    return f"{config['BASE_URL']}/donate?cancelled=true"


def donation_success_url():
    return f"{config['BASE_URL']}/donate?success=true"
