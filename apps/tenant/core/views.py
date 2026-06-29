from django.shortcuts import render

KNOWN_CATEGORIES = {"school", "restaurant", "library"}


def dashboard(request):
    tenant = request.tenant                       # django-tenants sets this per request
    category = getattr(tenant, "category", "school")
    if category not in KNOWN_CATEGORIES:
        category = "school"

    return render(request, "tenant/dashboard.html", {
        "tenant": tenant,
        "category": category,
        "vite_entry": f"src/apps/tenant/{category}/main.js",
    })
