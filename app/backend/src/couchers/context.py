import grpc


class NonInteractiveContextException(Exception):
    """If this exception is raised it is a programming error"""


class NotLoggedInContextException(Exception):
    """If this exception is raised it is a programming error"""


class NonInteractiveAbortException(grpc.RpcError):
    """This exception is raised in background processes when they call context.abort()"""

    def __init__(self, code, details):
        super().__init__(details)
        self._code = code
        self._details = details

    def code(self):
        return self._code

    def details(self):
        return self._details

    def __str__(self):
        return f"RPC aborted in non-interactive context, code: {self._code}, details: {self._details}"


class CouchersContext:
    """
    The CouchersContext is passed to backend APIs and contains context about what context the function is running in,
    such as information about the user the action is being taken for, etc.

    This class contains a bunch of stuff, and there are different ways of invoking functionality, so there are different
    types of contexts:

    *Interactive, authenticated, authorized*: this is the main one, a user is logged in and calling the APIs manually.

    *Interactive, authenticated, single-authorized*: this is a bit of an edge cases, sometimes users invoke functions
    while not properly logged in, but they are still authorized to invoke some APIs. E.g. a "quick link" on an email
    that contain signed URLs.

    *Interactive, unauthenticated*: a public API is being called by a user that is not logged in.

    *Non-interactive, authenticated*: we are calling an API or taking some action on behalf of a user in a background
    task.

    This context will complain a lot to make things work as intended.

    Do not call the constructor directly, use the `make_*_context_` functions below.

    You can safely call public methods, don't call methods whose names start with underscores unless you know what
    you're doing!
    """

    def __init__(
        self,
        *,
        is_interactive: bool,
        grpc_context: grpc.ServicerContext | None,
        user_id: int | None,
        is_api_key: bool | None,
        token: str | None,
        ui_language_preference: str | None,
    ):
        """Don't ever construct directly, always use the `make_*_context_` functions!"""
        self.__grpc_context = grpc_context
        self.__user_id = user_id
        self.__is_api_key = is_api_key
        self.__token = token
        self.__ui_language_preference = ui_language_preference
        self.__is_interactive = is_interactive
        self.__logged_in = self.__user_id is not None
        self.__cookies = []

        if self.__is_interactive:
            if not self.__grpc_context:
                raise ValueError("Tried to construct interactive context without grpc context")
            if self.__is_api_key is None:
                raise ValueError("Tried to construct interactive context but missing is_api_key")
            self.__headers = dict(self.__grpc_context.invocation_metadata())

        if self.__logged_in:
            if not self.__user_id:
                raise ValueError("Invalid state, logged in but missing user_id")

    def __verify_interactive(self):
        if not self.__is_interactive:
            raise NonInteractiveContextException("Called an interactive context function in non-interactive context")

    def __verify_logged_in(self):
        if not self.__logged_in:
            raise NotLoggedInContextException("Called a logged-in function from logged-out context")

    def is_logged_in(self):
        return self.__logged_in

    def abort(self, status_code: grpc.StatusCode, error_message: str) -> None:
        """
        Raises an error that's returned to the user
        """
        if not self.__is_interactive:
            raise NonInteractiveAbortException(status_code, error_message)
        else:
            self.__grpc_context.abort(status_code, error_message)

    def set_cookies(self, cookies: list[str]) -> None:
        """
        Sets a list of HTTP cookies
        """
        self.__verify_interactive()
        self.__cookies += cookies

    def _send_cookies(self) -> None:
        self.__grpc_context.send_initial_metadata([("set-cookie", cookie) for cookie in self.__cookies])

    @property
    def headers(self):
        """
        Gets a list of HTTP headers for the requests
        """
        self.__verify_interactive()
        return self.__headers

    @property
    def user_id(self) -> int:
        """
        Returns the user ID of the currently logged in user, if available
        """
        self.__verify_logged_in()
        return self.__user_id

    @property
    def is_api_key(self) -> bool:
        """
        Returns whether the API call was done with API key or not, if available
        """
        self.__verify_logged_in()
        return self.__is_api_key

    @property
    def token(self) -> str:
        """
        Returns the token (session cookie/api key) of the current session, if available
        """
        self.__verify_interactive()
        self.__verify_logged_in()
        return self.__token

    @property
    def ui_language_preference(self) -> str | None:
        return self.__ui_language_preference


def make_interactive_user_context(grpc_context, user_id, is_api_key, token, ui_language_preference):
    return CouchersContext(
        is_interactive=True,
        grpc_context=grpc_context,
        user_id=user_id,
        is_api_key=is_api_key,
        token=token,
        ui_language_preference=ui_language_preference,
    )


def make_media_context(grpc_context):
    return CouchersContext(
        is_interactive=True,
        grpc_context=grpc_context,
    )


def make_background_user_context(user_id):
    return CouchersContext(
        is_interactive=False,
        user_id=user_id,
        is_api_key=None,
        grpc_context=None,
        token=None,
        ui_language_preference=None,
    )
