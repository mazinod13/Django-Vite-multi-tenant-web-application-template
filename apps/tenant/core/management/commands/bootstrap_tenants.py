"""Backfill seed data into tenant schemas created before bootstrap existed.

New tenants are seeded automatically on creation (see TenantSerializer.create).
This command is for existing schemas, and is safe to re-run -- every step is
get_or_create.

    python manage.py bootstrap_tenants
    python manage.py bootstrap_tenants --schema yums
"""

from django.core.management.base import BaseCommand, CommandError
from django_tenants.utils import schema_context

from apps.public.tenants.models import Tenant
from apps.tenant.core.bootstrap import MAIN_BRANCH_NAME, bootstrap_tenant
from apps.tenant.core.models import Branch, TaxRate, TenantSettings
from apps.tenant.users.models import Role, TenantUser


class Command(BaseCommand):
    help = "Seed Main branch, roles, settings and tax rates into tenant schemas."

    def add_arguments(self, parser):
        parser.add_argument("--schema", help="Only this schema (default: all tenants).")
        parser.add_argument(
            "--promote-superusers", action="store_true",
            help="Give roleless superusers the owner role and the Main branch.",
        )
        parser.add_argument(
            "--owner",
            help="Username to make owner of --schema (also grants admin access).",
        )

    def handle(self, *args, **options):
        if options["owner"] and not options["schema"]:
            raise CommandError("--owner requires --schema (an owner is per-restaurant).")

        tenants = Tenant.objects.exclude(schema_name="public")
        if options["schema"]:
            tenants = tenants.filter(schema_name=options["schema"])
        if not tenants:
            self.stderr.write("No matching tenants.")
            return

        for tenant in tenants:
            with schema_context(tenant.schema_name):
                bootstrap_tenant(tenant)
                promoted = 0
                if options["promote_superusers"]:
                    promoted = TenantUser.objects.filter(
                        is_superuser=True, role__isnull=True,
                    ).update(
                        role=Role.objects.get(slug=Role.OWNER),
                        branch=Branch.objects.get(name=MAIN_BRANCH_NAME),
                    )
                if options["owner"]:
                    user = TenantUser.objects.filter(username=options["owner"]).first()
                    if user is None:
                        raise CommandError(
                            f"No user '{options['owner']}' in schema '{tenant.schema_name}'."
                        )
                    user.role = Role.objects.get(slug=Role.OWNER)
                    user.branch = Branch.objects.get(name=MAIN_BRANCH_NAME)
                    user.is_staff = True       # can reach /admin/
                    user.is_superuser = True   # full rights inside this tenant only
                    user.save(update_fields=["role", "branch", "is_staff", "is_superuser"])
                    self.stdout.write(self.style.SUCCESS(
                        f"{tenant.schema_name}: {user.username} is now owner."
                    ))

                self.stdout.write(self.style.SUCCESS(
                    f"{tenant.schema_name}: branches={Branch.objects.count()} "
                    f"roles={Role.objects.count()} taxes={TaxRate.objects.count()} "
                    f"settings={TenantSettings.objects.count()} promoted={promoted}"
                ))
