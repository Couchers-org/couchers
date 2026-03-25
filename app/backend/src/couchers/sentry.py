import sentry_sdk


def report_error(exception: Exception) -> None:
    """Report an exception to Sentry."""
    sentry_sdk.capture_exception(exception)


def report_message(message: str) -> None:
    """Report an informational message to Sentry."""
    sentry_sdk.capture_message(message)
