from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from apps.tenant.users.models import Role, TenantUser
from apps.tenant.school.models import ClassRoom, Student, Attendance
from apps.tenant.library.models import Book, BorrowRecord
from apps.tenant.inventory.models import Supplier, Product, StockTransaction


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "created_at", "updated_at"]


class TenantUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantUser
        fields = ["id", "username", "email", "phone", "role", "is_active"]
        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = TenantUser
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = TenantUser(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
        )
        user.set_password(validated_data["password"])   # hashes it (never store raw)
        user.save()
        return user


class ClassRoomSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.username", read_only=True)

    class Meta:
        model = ClassRoom
        fields = ["id", "name", "teacher", "teacher_name", "capacity", "created_at", "updated_at"]


class StudentSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)

    class Meta:
        model = Student
        fields = ["id", "full_name", "classroom", "classroom_name", "roll_no", "dob", "created_at", "updated_at"]


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = Attendance
        fields = ["id", "student", "student_name", "date", "present", "created_at", "updated_at"]


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "title", "author", "isbn", "total_copies", "available_copies", "created_at", "updated_at"]


class BorrowRecordSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = BorrowRecord
        fields = ["id", "book", "book_title", "user", "username", "borrowed_at", "due_date", "returned_at", "status", "created_at", "updated_at"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_name", "email", "phone", "address", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "sku", "description", "category", 
            "unit_price", "quantity_on_hand", "reorder_level", 
            "supplier", "supplier_name", "created_at", "updated_at"
        ]


class StockTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    username = serializers.CharField(source="performed_by.username", read_only=True)

    class Meta:
        model = StockTransaction
        fields = [
            "id", "product", "product_name", "product_sku", "transaction_type",
            "quantity", "transaction_date", "performed_by", "username",
            "reference", "created_at", "updated_at"
        ]



        