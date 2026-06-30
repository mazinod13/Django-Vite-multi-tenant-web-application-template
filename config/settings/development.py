from .base import *

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", ".localhost"]
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "noreply@saas.local"
