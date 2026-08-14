from .base import *  # noqa: F401,F403

DEBUG = False

# ALLOWED_HOSTS comes from .env. Tenants live on subdomains, so this is
# normally a leading-dot wildcard, e.g. ALLOWED_HOSTS=.yourdomain.com
if not ALLOWED_HOSTS:  # noqa: F405
    raise RuntimeError("ALLOWED_HOSTS must be set in production.")

if not PLATFORM_ADMIN_TOKEN:  # noqa: F405
    raise RuntimeError(
        "PLATFORM_ADMIN_TOKEN must be set in production, or the tenant "
        "management API is unreachable."
    )

# --- HTTPS / transport security ---------------------------------
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365      # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True         # tenants are subdomains
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# --- Static files -------------------------------------------------
# WhiteNoise serves the collected Vite bundles without a separate web server.
MIDDLEWARE.insert(  # noqa: F405
    MIDDLEWARE.index("django.middleware.security.SecurityMiddleware") + 1,  # noqa: F405
    "whitenoise.middleware.WhiteNoiseMiddleware",
)
STORAGES["staticfiles"] = {  # noqa: F405
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}

# --- Logging ------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {name} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}
