from django.db import models

from apps.tenant.core.models import BaseModel
from apps.tenant.users.models import TenantUser


class ClassRoom(BaseModel):
    name = models.CharField(max_length=50)  # e.g. "Grade 5A"
    teacher = models.ForeignKey(
        TenantUser, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="classrooms",
    )
    capacity = models.PositiveIntegerField(default=30)

    def __str__(self):
        return self.name


class Student(BaseModel):
    full_name = models.CharField(max_length=100)
    classroom = models.ForeignKey(
        ClassRoom, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="students",
    )
    roll_no = models.CharField(max_length=20)
    dob = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.full_name


class Attendance(BaseModel):
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="attendance",
    )
    date = models.DateField()
    present = models.BooleanField(default=False)

    class Meta:
        unique_together = ("student", "date")  # one record per student per day

    def __str__(self):
        status = "present" if self.present else "absent"
        return f"{self.student} - {self.date} ({status})"