from django.db import connection
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class TenantJWTAuthentication(JWTAuthentication):
    """Reject a token whose 'tenant' claim != the schema being requested."""

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        if validated.get("tenant") != connection.schema_name:
            raise InvalidToken("Token was not issued for this tenant.")
        return validated
