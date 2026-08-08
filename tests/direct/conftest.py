import time


def future_expiry(seconds: int = 3600) -> int:
    return int(time.time()) + seconds


def past_expiry(seconds: int = 10) -> int:
    return int(time.time()) - seconds
