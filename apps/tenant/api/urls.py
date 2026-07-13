from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView,TokenVerifyView


from .views import (
    RoleViewSet, TenantUserViewSet, ClassRoomViewSet, StudentViewSet,
    AttendanceViewSet, BookViewSet, BorrowRecordViewSet,
    SupplierViewSet, ProductViewSet, StockTransactionViewSet,
    NepseCompaniesView, NepseLiveTradesView
)
from .auth import (
    TenantTokenObtainPairView, LogoutView, MeView, RegisterView,
    PasswordResetRequestView, PasswordResetConfirmView,
)

router = DefaultRouter()
router.register("roles", RoleViewSet)
router.register("users", TenantUserViewSet)
router.register("classrooms", ClassRoomViewSet)
router.register("students", StudentViewSet)
router.register("attendance", AttendanceViewSet)
router.register("books", BookViewSet)
router.register("borrows", BorrowRecordViewSet)
router.register("suppliers", SupplierViewSet)
router.register("products", ProductViewSet)
router.register("transactions", StockTransactionViewSet)

urlpatterns = [
    path("token/", TenantTokenObtainPairView.as_view(),name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(),name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(),name="token_verify"),
    path("logout/",LogoutView.as_view(),name="logout"),
    path("register/", RegisterView.as_view(), name="register"),
    path("me/",MeView.as_view(),name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("nepse/companies/", NepseCompaniesView.as_view(), name="nepse_companies"),
    path("nepse/trades/", NepseLiveTradesView.as_view(), name="nepse_trades"),

    
    *router.urls,
    ]

