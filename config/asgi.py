"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

# Same as wsgi.py: default to production so a deploy can never boot with DEBUG on.
# Local ASGI work (Channels/WebSockets) should export DJANGO_SETTINGS_MODULE
# explicitly, or just use manage.py, which defaults to development.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
