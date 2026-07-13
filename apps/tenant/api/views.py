from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import connection
from django.db.models import Count
from rest_framework.decorators import action

from apps.tenant.users.models import Role, TenantUser
from apps.tenant.school.models import ClassRoom, Student, Attendance
from apps.tenant.library.models import Book, BorrowRecord
from apps.tenant.inventory.models import Supplier, Product, StockTransaction
from .serializers import (
    RoleSerializer, TenantUserSerializer,
    ClassRoomSerializer, StudentSerializer, AttendanceSerializer,
    BookSerializer, BorrowRecordSerializer,
    SupplierSerializer, ProductSerializer, StockTransactionSerializer
)


class TenantBaseViewSet(ModelViewSet):
    """Inherit this in every tenant API ViewSet.
    django-tenants already scopes queries to the current schema."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # hides soft-deleted rows when the model supports it
        qs = super().get_queryset()
        if hasattr(qs.model, "is_deleted"):
            return qs.filter(is_deleted=False)
        return qs


class RoleViewSet(TenantBaseViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class TenantUserViewSet(TenantBaseViewSet):
    queryset = TenantUser.objects.all()
    serializer_class = TenantUserSerializer


class ClassRoomViewSet(TenantBaseViewSet):
    queryset = ClassRoom.objects.all()
    serializer_class = ClassRoomSerializer


class StudentViewSet(TenantBaseViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class AttendanceViewSet(TenantBaseViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer


class BookViewSet(TenantBaseViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    @action(detail=False, methods=["get"], url_path="recommendations")
    def recommendations(self, request):
        user = request.user
        
        # 1. Books already borrowed by the current user
        borrowed_book_ids = list(
            BorrowRecord.objects.filter(user=user).values_list("book_id", flat=True)
        )
        
        # 2. Collaborative filtering: "Users who borrowed the same books you borrowed also borrowed..."
        collaborative_recs = []
        if borrowed_book_ids:
            other_users = list(
                BorrowRecord.objects.filter(book_id__in=borrowed_book_ids)
                .exclude(user=user)
                .values_list("user_id", flat=True)
                .distinct()
            )
            if other_users:
                co_books = Book.objects.filter(
                    borrows__user_id__in=other_users
                ).exclude(id__in=borrowed_book_ids).annotate(
                    borrow_count=Count("borrows")
                ).order_by("-borrow_count").distinct()[:5]
                for book in co_books:
                    collaborative_recs.append({
                        "book": BookSerializer(book).data,
                        "reason": "Users who borrowed books you read also borrowed this book"
                    })
        
        # 3. Content-based filtering: "Books by the same author as books you read"
        content_recs = []
        if borrowed_book_ids:
            # Find the authors of books borrowed by the user
            borrowed_authors = list(
                Book.objects.filter(id__in=borrowed_book_ids)
                .values_list("author", flat=True)
                .distinct()
            )
            # Find books by those authors not read by the user
            author_books = Book.objects.filter(
                author__in=borrowed_authors
            ).exclude(id__in=borrowed_book_ids).distinct()[:5]
            for book in author_books:
                content_recs.append({
                    "book": BookSerializer(book).data,
                    "reason": f"Because you read books by {book.author}"
                })
        
        # 4. Popular recommendations: "Popular books in the library"
        popular_recs = []
        # Exclude books already read by the user
        popular_books = Book.objects.exclude(id__in=borrowed_book_ids).annotate(
            borrow_count=Count("borrows")
        ).order_by("-borrow_count").distinct()[:5]
        for book in popular_books:
            popular_recs.append({
                "book": BookSerializer(book).data,
                "reason": "Most popular book in the library"
            })
            
        # 5. New release recommendations: "Recently added books"
        new_books = Book.objects.exclude(id__in=borrowed_book_ids).order_by("-created_at").distinct()[:5]
        new_recs = []
        for book in new_books:
            new_recs.append({
                "book": BookSerializer(book).data,
                "reason": "Recently added to the catalog"
            })
            
        # Combine all recommendations
        all_recs = []
        seen_book_ids = set()
        
        # Priority 1: Collaborative filtering
        for rec in collaborative_recs:
            if rec["book"]["id"] not in seen_book_ids:
                seen_book_ids.add(rec["book"]["id"])
                all_recs.append(rec)
                
        # Priority 2: Content-based (Same author)
        for rec in content_recs:
            if rec["book"]["id"] not in seen_book_ids:
                seen_book_ids.add(rec["book"]["id"])
                all_recs.append(rec)
                
        # Priority 3: Popular
        for rec in popular_recs:
            if rec["book"]["id"] not in seen_book_ids:
                seen_book_ids.add(rec["book"]["id"])
                all_recs.append(rec)
                
        # Priority 4: New releases
        for rec in new_recs:
            if rec["book"]["id"] not in seen_book_ids:
                seen_book_ids.add(rec["book"]["id"])
                all_recs.append(rec)
                
        # If no books are found or recommended, just return some books as fallback
        if not all_recs:
            fallback_books = Book.objects.all()[:5]
            for book in fallback_books:
                all_recs.append({
                    "book": BookSerializer(book).data,
                    "reason": "Featured in library catalog"
                })
                
        return Response(all_recs)


class BorrowRecordViewSet(TenantBaseViewSet):
    queryset = BorrowRecord.objects.all()
    serializer_class = BorrowRecordSerializer


class SupplierViewSet(TenantBaseViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class ProductViewSet(TenantBaseViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class StockTransactionViewSet(TenantBaseViewSet):
    queryset = StockTransaction.objects.all()
    serializer_class = StockTransactionSerializer


class NepseCompaniesView(APIView):
    permission_classes = []

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, company_name, symbol, security_name, status, 
                       company_email, website, sector_name, regulatory_body, instrument_type 
                FROM public.nepse_company
                ORDER BY symbol ASC;
            """)
            rows = cursor.fetchall()
            results = []
            for row in rows:
                results.append({
                    "id": str(row[0]),
                    "companyName": row[1],
                    "symbol": row[2],
                    "securityName": row[3],
                    "status": row[4],
                    "companyEmail": row[5],
                    "website": row[6],
                    "sectorName": row[7],
                    "regulatoryBody": row[8],
                    "instrumentType": row[9]
                })
            return Response(results)


class NepseLiveTradesView(APIView):
    permission_classes = []

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT security_id, security_name, symbol, index_id, total_trade_quantity, 
                       last_traded_price, percentage_change, previous_close, close_price 
                FROM public.nepse_live_trade
                ORDER BY percentage_change DESC;
            """)
            rows = cursor.fetchall()
            results = []
            for row in rows:
                results.append({
                    "securityId": row[0],
                    "securityName": row[1],
                    "symbol": row[2],
                    "indexId": row[3],
                    "totalTradeQuantity": row[4],
                    "lastTradedPrice": float(row[5]) if row[5] is not None else 0.0,
                    "percentageChange": float(row[6]) if row[6] is not None else 0.0,
                    "previousClose": float(row[7]) if row[7] is not None else 0.0,
                    "closePrice": float(row[8]) if row[8] is not None else 0.0
                })
            return Response(results)


