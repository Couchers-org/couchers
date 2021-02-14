from couchers.config import config


def signup_link(signup_token):
    return f"{config['BASE_URL']}/signup/{signup_token}"


def login_link(login_token):
    return f"{config['BASE_URL']}/login/{login_token}"


def password_reset_link(password_reset_token):
    return f"{config['BASE_URL']}/password-reset/{password_reset_token}"


def host_request_link():
    return f"{config['BASE_URL']}/messages/hosting/"


def messages_link():
    return f"{config['BASE_URL']}/messages/"


def friend_requests_link():
    return f"{config['BASE_URL']}/connections/friends/"


def media_upload_url(path):
    return f"{config['MEDIA_SERVER_BASE_URL']}/{path}"


def change_email_link(confirmation_token):
    return f"{config['BASE_URL']}/confirm-email/{confirmation_token}"
