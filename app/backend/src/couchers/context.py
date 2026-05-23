from typing import TYPE_CHECKING, NoReturn, cast

import grpc

from couchers import experimentation
from couchers.config import config
from couchers.i18n import LocalizationContext

if TYPE_CHECKING:
    from growthbook import GrowthBook


class NonInteractiveContextException(Exception):
    """If this exception is raised, it is a programming error"""


class NotLoggedInContextException(Exception):
    """If this exception is raised, it is a programming error"""


class NonInteractiveAbortException(grpc.RpcError):
    """This exception is raised in background processes when they call context.abort()"""

    def __init__(self, code: grpc.StatusCode, details: str) -> None:
        super().__init__(details)
        self._code = code
        self._details = details

    def code(self) -> grpc.StatusCode:
        return self._code

    def details(self) -> str:
        return self._details

    def __str__(self) -> str:
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
        localization: LocalizationContext,
        sofa: str | None = None,
    ):
        """Don't ever construct directly, always use the `make_*_context_` functions!"""
        self._grpc_context = grpc_context
        self._user_id = user_id
        self._is_api_key = is_api_key
        self.__token = token
        self.__localization = localization
        self._sofa = sofa
        self.__is_interactive = is_interactive
        self.__logged_in = self._user_id is not None
        self.__cookies: list[str] = []
        self._growthbook: GrowthBook | None = None

        if self.__is_interactive:
            if not self._grpc_context:
                raise ValueError("Tried to construct interactive context without grpc context")
            self.__headers = dict(self._grpc_context.invocation_metadata())

        if self.__logged_in:
            if not self._user_id:
                raise ValueError("Invalid state, logged in but missing user_id")

    def __verify_interactive(self) -> None:
        if not self.__is_interactive:
            raise NonInteractiveContextException("Called an interactive context function in non-interactive context")

    def __verify_logged_in(self) -> None:
        if not self.__logged_in:
            raise NotLoggedInContextException("Called a logged-in function from logged-out context")

    def is_logged_in(self) -> bool:
        return self.__logged_in

    def is_logged_out(self) -> bool:
        return not self.__logged_in

    def abort(self, status_code: grpc.StatusCode, error_message: str) -> NoReturn:
        """
        Raises an error that's returned to the user
        """
        if not self.__is_interactive:
            raise NonInteractiveAbortException(status_code, error_message)
        else:
            context = cast(grpc.ServicerContext, self._grpc_context)
            context.abort(status_code, error_message)

    def abort_with_error_code(
        self, status_code: grpc.StatusCode, error_message_id: str, *, substitutions: dict[str, str | int] | None = None
    ) -> NoReturn:
        """
        Raises an error that's returned to the user, but error_message_id should be an entry from translateable errors
        """
        if not self.__is_interactive:
            raise NonInteractiveAbortException(status_code, error_message_id)
        else:
            context = cast(grpc.ServicerContext, self._grpc_context)
            # Get the translated error message using the user's language preference
            error_message = self.localization.localize_string(f"errors.{error_message_id}", substitutions=substitutions)
            context.abort(status_code, error_message)

    def set_cookies(self, cookies: list[str]) -> None:
        """
        Sets a list of HTTP cookies
        """
        self.__verify_interactive()
        self.__cookies += cookies

    def _send_cookies(self) -> None:
        data = tuple([("set-cookie", cookie) for cookie in self.__cookies])
        self._grpc_context.send_initial_metadata(data)  # type: ignore[union-attr]

    @property
    def headers(self) -> dict[str, str | bytes]:
        """
        Gets a list of HTTP headers for the requests
        """
        self.__verify_interactive()
        return self.__headers

    @property
    def user_id(self) -> int:
        """
        Returns the user ID of the currently logged-in user, if available
        """
        self.__verify_logged_in()
        return cast(int, self._user_id)

    @property
    def is_api_key(self) -> bool:
        """
        Returns whether the API call was done with an API key or not, if available
        """
        self.__verify_logged_in()
        return cast(bool, self._is_api_key)

    @property
    def token(self) -> str:
        """
        Returns the token (session cookie/api key) of the current session, if available
        """
        self.__verify_interactive()
        self.__verify_logged_in()
        return cast(str, self.__token)

    @property
    def localization(self) -> LocalizationContext:
        return self.__localization

    # Feature-flag evaluation methods mirror the OpenFeature evaluation API. The in-code default is
    # honored even for flags not yet set up in GrowthBook, since get_feature_value falls back to it.
    def get_boolean_value(self, flag_key: str, default: bool) -> bool:
        if config["EXPERIMENTATION_PASS_ALL_GATES"]:
            return True
        return self._get_feature_value(flag_key, default)

    def get_string_value(self, flag_key: str, default: str) -> str:
        return self._get_feature_value(flag_key, default)

    def get_integer_value(self, flag_key: str, default: int) -> int:
        return self._get_feature_value(flag_key, default)

    def get_float_value(self, flag_key: str, default: float) -> float:
        return self._get_feature_value(flag_key, default)

    def get_object_value[T](self, flag_key: str, default: T) -> T:
        return self._get_feature_value(flag_key, default)

    def _get_feature_value[T](self, flag_key: str, default: T) -> T:
        if not config["EXPERIMENTATION_ENABLED"]:
            return default
        return self._get_growthbook().get_feature_value(flag_key, default)  # type: ignore[no-any-return]

    def _get_growthbook(self) -> GrowthBook:
        if self._growthbook is None:
            self._growthbook = experimentation.create_evaluator(self.user_id)
        return self._growthbook


def make_interactive_context(
    grpc_context: grpc.ServicerContext,
    user_id: int | None,
    is_api_key: bool,
    token: str | None,
    localization: LocalizationContext,
    sofa: str | None = None,
) -> CouchersContext:
    return CouchersContext(
        is_interactive=True,
        grpc_context=grpc_context,
        user_id=user_id,
        is_api_key=is_api_key,
        token=token,
        localization=localization,
        sofa=sofa,
    )


def make_one_off_interactive_user_context(couchers_context: CouchersContext, user_id: int) -> CouchersContext:
    return CouchersContext(
        is_interactive=True,
        grpc_context=couchers_context._grpc_context,
        user_id=user_id,
        is_api_key=None,
        token=None,
        localization=couchers_context.localization,
    )


def make_media_context(grpc_context: grpc.ServicerContext) -> CouchersContext:
    return CouchersContext(
        is_interactive=True,
        user_id=None,
        is_api_key=False,
        grpc_context=grpc_context,
        token=None,
        localization=LocalizationContext.en_utc(),
    )


def make_background_user_context(user_id: int, localization: LocalizationContext | None = None) -> CouchersContext:
    return CouchersContext(
        is_interactive=False,
        user_id=user_id,
        is_api_key=None,
        grpc_context=None,
        token=None,
        localization=localization or LocalizationContext.en_utc(),
    )


def make_logged_out_context(localization: LocalizationContext) -> CouchersContext:
    return CouchersContext(
        user_id=None,
        is_interactive=False,
        is_api_key=None,
        grpc_context=None,
        token=None,
        localization=localization,
    )
