from django.db import models
from django.utils import timezone


class BaseLevel(models.Model):
    name = models.CharField(max_length=50)
    coefficient = models.FloatField(default=1.0)
    note = models.TextField(blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.name} - {self.coefficient}"

class DifficultyLevel(BaseLevel):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "coefficient"],
                name="unique_difficulty_level"
            )
        ]


class PriorityLevel(BaseLevel):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "coefficient"],
                name="unique_priority_level"
            )
        ]


class BaseMission(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.ForeignKey(PriorityLevel, on_delete=models.PROTECT)
    difficulty = models.ForeignKey(DifficultyLevel, on_delete=models.PROTECT)

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("canceled", "Canceled")
    ]

    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default="pending")

    due_date = models.DateField(null=True, blank=True)
    terminated_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def base_points(self):
        if not self.due_date:
            return 1

        base_date = self.terminated_date or timezone.now().date()

        delta_days = (self.due_date - base_date).days

        return delta_days + 1 if delta_days >= 0 else delta_days - 4

    def status_coefficient(self):
        if self.status == "canceled":
            return -5

        elif self.status == "pending":
            return 0

        else:
            return 1

    def base_current_points(self):
        return self.base_points() * self.difficulty.coefficient * self.priority.coefficient * self.status_coefficient()
