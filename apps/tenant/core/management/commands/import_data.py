import os
import csv
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection, transaction
from apps.public.tenants.models import Tenant
from apps.tenant.library.models import Book
from apps.tenant.inventory.models import Product, Supplier
from django_tenants.utils import schema_context

class Command(BaseCommand):
    help = "Imports CSV and JSON files from frontend/src/data into PostgreSQL raw tables and Django tenant models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tenants-only",
            action="store_true",
            help="Only import data into tenant-specific models (Book, Product), skip raw table creation.",
        )
        parser.add_argument(
            "--raw-only",
            action="store_true",
            help="Only create and populate raw PostgreSQL tables in public schema, skip tenant models.",
        )

    def handle(self, *args, **options):
        # 1. Define paths to the datasets
        data_dir = os.path.join(settings.BASE_DIR, "frontend", "src", "data")
        lib_csv_path = os.path.join(data_dir, "library_dataset_random.csv")
        nepse_company_csv_path = os.path.join(data_dir, "nepse_company_list_20260708_103315.csv")
        nepse_trade_json_path = os.path.join(data_dir, "nepse_live_trade_20260708_102809.json")

        # Check for file existence
        for path in [lib_csv_path, nepse_company_csv_path, nepse_trade_json_path]:
            if not os.path.exists(path):
                self.stderr.write(self.style.ERROR(f"File not found: {path}"))
                return

        tenants_only = options["tenants_only"]
        raw_only = options["raw_only"]

        # Run raw imports if requested
        if not tenants_only:
            self.stdout.write(self.style.WARNING("Starting raw PostgreSQL table imports..."))
            self.import_raw_tables(lib_csv_path, nepse_company_csv_path, nepse_trade_json_path)

        # Run tenant-specific ORM imports if requested
        if not raw_only:
            self.stdout.write(self.style.WARNING("Starting Django multi-tenant model imports..."))
            self.import_tenant_models(lib_csv_path, nepse_company_csv_path, nepse_trade_json_path)

        self.stdout.write(self.style.SUCCESS("All import processes finished successfully!"))

    def import_raw_tables(self, lib_csv_path, nepse_company_csv_path, nepse_trade_json_path):
        """Creates raw tables in public schema and imports CSV/JSON datasets."""
        with connection.cursor() as cursor:
            # Create Tables
            self.stdout.write("Creating raw tables in the public schema if they do not exist...")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS public.nepse_company (
                    id INT PRIMARY KEY,
                    company_name VARCHAR(255) NOT NULL,
                    symbol VARCHAR(50) UNIQUE NOT NULL,
                    security_name VARCHAR(255) NOT NULL,
                    status VARCHAR(10),
                    company_email VARCHAR(255),
                    website VARCHAR(255),
                    sector_name VARCHAR(100),
                    regulatory_body VARCHAR(255),
                    instrument_type VARCHAR(100)
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS public.nepse_live_trade (
                    security_id VARCHAR(50) PRIMARY KEY,
                    security_name VARCHAR(255) NOT NULL,
                    symbol VARCHAR(50) NOT NULL,
                    index_id INT,
                    total_trade_quantity INT,
                    last_traded_price NUMERIC(12, 2),
                    percentage_change NUMERIC(12, 6),
                    previous_close NUMERIC(12, 2),
                    close_price NUMERIC(12, 2)
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS public.library_dataset (
                    book_id VARCHAR(50) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    author VARCHAR(255) NOT NULL,
                    category VARCHAR(100),
                    cabinet INT,
                    rack INT,
                    row INT,
                    signal_strength INT,
                    timestamp TIMESTAMP,
                    status VARCHAR(50)
                );
            """)

            # Clear existing data to ensure idempotent runs
            self.stdout.write("Clearing existing data in raw tables...")
            cursor.execute("TRUNCATE TABLE public.nepse_company CASCADE;")
            cursor.execute("TRUNCATE TABLE public.nepse_live_trade CASCADE;")
            cursor.execute("TRUNCATE TABLE public.library_dataset CASCADE;")

            # 1. Populate raw NEPSE Company List
            self.stdout.write(f"Importing raw NEPSE companies from {os.path.basename(nepse_company_csv_path)}...")
            with open(nepse_company_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                companies_data = []
                for row in reader:
                    companies_data.append((
                        int(row["id"]),
                        row["companyName"],
                        row["symbol"],
                        row["securityName"],
                        row["status"],
                        row["companyEmail"],
                        row["website"],
                        row["sectorName"],
                        row["regulatoryBody"],
                        row["instrumentType"]
                    ))
                
                cursor.executemany("""
                    INSERT INTO public.nepse_company (
                        id, company_name, symbol, security_name, status,
                        company_email, website, sector_name, regulatory_body, instrument_type
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, companies_data)
            self.stdout.write(self.style.SUCCESS(f"Successfully loaded {len(companies_data)} companies into public.nepse_company."))

            # 2. Populate raw NEPSE Live Trades
            self.stdout.write(f"Importing raw NEPSE live trades from {os.path.basename(nepse_trade_json_path)}...")
            with open(nepse_trade_json_path, mode="r", encoding="utf-8") as f:
                trades_list = json.load(f)
                trades_data = []
                for t in trades_list:
                    trades_data.append((
                        t["securityId"],
                        t["securityName"],
                        t["symbol"],
                        t["indexId"],
                        t["totalTradeQuantity"],
                        t["lastTradedPrice"],
                        t["percentageChange"],
                        t["previousClose"],
                        t["closePrice"]
                    ))
                
                cursor.executemany("""
                    INSERT INTO public.nepse_live_trade (
                        security_id, security_name, symbol, index_id,
                        total_trade_quantity, last_traded_price, percentage_change, previous_close, close_price
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, trades_data)
            self.stdout.write(self.style.SUCCESS(f"Successfully loaded {len(trades_data)} trades into public.nepse_live_trade."))

            # 3. Populate raw Library dataset
            self.stdout.write(f"Importing raw Library records from {os.path.basename(lib_csv_path)}...")
            with open(lib_csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                books_data = []
                for row in reader:
                    # Clean up timestamps e.g. 2024-12-11 10:01:00
                    ts = datetime.strptime(row["Timestamp"], "%Y-%m-%d %H:%M:%S")
                    books_data.append((
                        row["Book_ID"],
                        row["Title"],
                        row["Author"],
                        row["Category"],
                        int(row["Cabinet"]) if row["Cabinet"] else None,
                        int(row["Rack"]) if row["Rack"] else None,
                        int(row["Row"]) if row["Row"] else None,
                        int(row["Signal_Strength"]) if row["Signal_Strength"] else None,
                        ts,
                        row["Status"]
                    ))
                
                cursor.executemany("""
                    INSERT INTO public.library_dataset (
                        book_id, title, author, category, cabinet,
                        rack, row, signal_strength, timestamp, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, books_data)
            self.stdout.write(self.style.SUCCESS(f"Successfully loaded {len(books_data)} records into public.library_dataset."))

    def import_tenant_models(self, lib_csv_path, nepse_company_csv_path, nepse_trade_json_path):
        """Iterates through all active tenants and populates their specific Django models."""
        tenants = Tenant.objects.exclude(schema_name="public")
        if not tenants.exists():
            self.stdout.write("No active tenant schemas found to populate.")
            return

        # Parse data beforehand to avoid reading files repeatedly
        library_books = []
        with open(lib_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                library_books.append({
                    "isbn": row["Book_ID"],
                    "title": row["Title"],
                    "author": row["Author"],
                    "total_copies": 1,
                    "available_copies": 1 if row["Status"] == "Present" else 0
                })

        # NEPSE mappings
        nepse_trades = {}
        with open(nepse_trade_json_path, mode="r", encoding="utf-8") as f:
            trades_list = json.load(f)
            for t in trades_list:
                nepse_trades[t["symbol"].upper()] = t

        nepse_companies = []
        with open(nepse_company_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                symbol = row["symbol"].upper()
                trade = nepse_trades.get(symbol, {})
                nepse_companies.append({
                    "name": row["companyName"],
                    "sku": symbol,
                    "description": f"{row['securityName']} - Web: {row['website'] or 'N/A'}",
                    "category": row["sectorName"] or "General",
                    "unit_price": trade.get("lastTradedPrice", 0.00),
                    "quantity_on_hand": trade.get("totalTradeQuantity", 0),
                    "reorder_level": 5
                })

        # Loop through each tenant and load the database models
        for tenant in tenants:
            category = tenant.category.lower()
            self.stdout.write(self.style.MIGRATE_LABEL(f"Processing tenant '{tenant.name}' (schema: {tenant.schema_name}, category: {category})..."))
            
            with schema_context(tenant.schema_name):
                if category == "library":
                    self.stdout.write(f"  Populating library Book models for tenant '{tenant.name}'...")
                    count = 0
                    with transaction.atomic():
                        for b in library_books:
                            # Update existing book or create a new one
                            Book.objects.update_or_create(
                                isbn=b["isbn"],
                                defaults={
                                    "title": b["title"],
                                    "author": b["author"],
                                    "total_copies": b["total_copies"],
                                    "available_copies": b["available_copies"]
                                }
                            )
                            count += 1
                    self.stdout.write(self.style.SUCCESS(f"  Successfully imported/updated {count} books in schema '{tenant.schema_name}'."))

                elif category == "inventory":
                    self.stdout.write(f"  Populating inventory Product models for tenant '{tenant.name}'...")
                    count = 0
                    # Create a dummy NEPSE supplier if not exists
                    nepse_supplier, _ = Supplier.objects.get_or_create(
                        name="NEPSE Broker",
                        defaults={"contact_name": "NEPSE Office", "email": "info@nepse.com.np"}
                    )
                    
                    with transaction.atomic():
                        for p in nepse_companies:
                            Product.objects.update_or_create(
                                sku=p["sku"],
                                defaults={
                                    "name": p["name"],
                                    "description": p["description"],
                                    "category": p["category"],
                                    "unit_price": p["unit_price"],
                                    "quantity_on_hand": p["quantity_on_hand"],
                                    "reorder_level": p["reorder_level"],
                                    "supplier": nepse_supplier
                                }
                            )
                            count += 1
                    self.stdout.write(self.style.SUCCESS(f"  Successfully imported/updated {count} products in schema '{tenant.schema_name}'."))
                
                else:
                    self.stdout.write(f"  Schema '{tenant.schema_name}' has category '{category}' (no automatic ORM import configured).")
