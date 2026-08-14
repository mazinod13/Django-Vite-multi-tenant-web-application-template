from django.shortcuts import render
from django.views.decorators.cache import never_cache

# Every tenant is a restaurant, so there is exactly one dashboard bundle.
DASHBOARD_ENTRY = "src/apps/tenant/restaurant/main.tsx"
RESET_ENTRY = "src/apps/tenant/reset/main.tsx"


@never_cache
def dashboard(request):
    return render(request, "tenant/dashboard.html", {
        "tenant": request.tenant,
        "vite_entry": DASHBOARD_ENTRY,
    })


@never_cache
def reset_password(request):
    return render(request, "tenant/dashboard.html", {
        "tenant": request.tenant,
        "vite_entry": RESET_ENTRY,
    })
