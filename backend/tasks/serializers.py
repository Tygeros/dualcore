from rest_framework import serializers
from django.utils import timezone

from categories.models import Category
from .models import Task

from base.services import up_level


class TaskSerializer(serializers.ModelSerializer):
    task_level = serializers.SerializerMethodField()
    current_points = serializers.SerializerMethodField()
    final_points = serializers.SerializerMethodField()
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "owner",
            "name",
            "description",
            "project",
            "parent_task",
            "task_level",
            "priority",
            "difficulty",
            "status",
            "due_date",
            "terminated_date",
            "categories",
            "current_points",
            "final_points",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["owner"]

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get("status", old_status)
        categories = validated_data.pop("categories", None)

        # Backend is authoritative for terminated_date on status transitions
        # (avoids UTC vs local-date mismatch from the client).
        if old_status in ("pending", "in_progress") and new_status in (
            "completed",
            "canceled",
        ):
            validated_data["terminated_date"] = timezone.localdate()
        elif old_status in ("completed", "canceled") and new_status in (
            "pending",
            "in_progress",
        ):
            validated_data["terminated_date"] = None

        task = super().update(instance, validated_data)

        if categories is not None:
            task.categories.set(categories)

        if old_status in ("pending", "in_progress") and task.status in (
            "completed",
            "canceled",
        ):
            owner = task.owner
            profile = owner.profile
            pts = task.final_points()
            if pts is not None:
                new_level, new_exp = up_level(profile, pts)
                profile.level = new_level
                profile.exp = new_exp
                profile.save()

            # Cascade: complete open children and stamp the same local date
            # so they count toward today_points.
            today = task.terminated_date or timezone.localdate()
            child_tasks = task.child_tasks.all()
            for child in child_tasks:
                if child.status not in ("completed", "canceled"):
                    child.status = "completed"
                    child.terminated_date = today
                    child.save()

        return task

    def create(self, validated_data):
        categories = validated_data.pop("categories", [])
        task = super().create(validated_data)
        if categories:
            task.categories.set(categories)
        return task

    def get_task_level(self, obj):
        return obj.task_level()

    def get_current_points(self, obj):
        return obj.current_points()

    def get_final_points(self, obj):
        return obj.final_points()
