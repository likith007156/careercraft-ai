from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Define rate limiter with default limits (60 requests per minute per IP)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri="memory://",
    headers_enabled=True
)
