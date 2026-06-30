from django.shortcuts import render
from django.views.decorators.cache import never_cache

KNOWN_CATEGORIES = {"school", "restaurant", "library"}


@never_cache
def dashboard(request):
    tenant = request.tenant
    category = getattr(tenant, "category", "school")
    if category not in KNOWN_CATEGORIES:
        category = "school"
    return render(request, "tenant/dashboard.html", {
        "tenant": tenant,
        "category": category,
        "vite_entry": f"src/apps/tenant/{category}/main.tsx",
    })


@never_cache
def reset_password(request):
    return render(request, "tenant/dashboard.html", {
        "tenant": request.tenant,
        "category": getattr(request.tenant, "category", "school"),
        "vite_entry": "src/apps/tenant/reset/main.tsx",
    })
