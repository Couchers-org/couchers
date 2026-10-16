from datetime import date, datetime, time


def local_date_time(value: datetime) -> tuple[date, time]:
    """Returns the local date and time of a datetime, dropping the timezone."""
    return value.date(), value.time()
