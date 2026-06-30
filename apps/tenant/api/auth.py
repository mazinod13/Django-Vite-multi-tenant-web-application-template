from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

User = get_user_model()




from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework import generics
from rest_framework.permissions import AllowAny

from .serializers import RegisterSerializer


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView


#---token minter(login)-----
class TenantTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["tenant"] = connection.schema_name
        token["username"] =user.username
        return token
    
class TenantTokenObtainPairView(TokenObtainPairView):
    serializer_class = TenantTokenObtainPairSerializer
    

#----login/logout ----
class LogoutView(APIView):
    def post(self,request):
        try:
            RefreshToken(request.data["refresh"]).blacklist()
        except Exception:
            return Response(
                {"details": "Invalid or missing refresh token"},
                status=status.HTTP_400_BAD_REQUEST,
            )   
        return Response(status=status.HTTP_205_RESET_CONTENT) 
    
class MeView(APIView):
    def get(self,request):
        u = request.user
        return Response({
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "tenant": connection.schema_name,
        })            
        
        
class RegisterView(generics.CreateAPIView):
    """Public endpoint: create a user in the current tenant schema."""
    permission_classes = [AllowAny]      # anonymous users must be able to sign up
    serializer_class = RegisterSerializer


class PasswordResetRequestView(APIView):
    """Step 1: email a reset link for the given address (within this tenant)."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        user = User.objects.filter(email=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f"http://{request.get_host()}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject="Reset your password",
                message=f"Open this link to reset your password:\n{link}",
                from_email=None,
                recipient_list=[email],
            )
        # Always 200 — don't leak whether the email is registered.
        return Response({"detail": "If that email exists, a reset link was sent."})


class PasswordResetConfirmView(APIView):
    """Step 2: verify the token and set the new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        new_password = request.data.get("new_password", "")
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except Exception:
            return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({"new_password": e.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password has been reset."})
        