from rest_framework import serializers
from django.utils import timezone

from categories.models import Category
from .models import Project

from base.services import up_level


class ProjectSerializer(serializers.ModelSerializer):
    current_points = serializers.SerializerMethodField()
    final_points = serializers.SerializerMethodField()
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "owner",
            "name",
            "description",
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

        project = super().update(instance, validated_data)

        if categories is not None:
            project.categories.set(categories)

        if old_status in ("pending", "in_progress") and project.status in (
            "completed",
            "canceled",
        ):
            owner = project.owner
            profile = owner.profile
            pts = project.final_points()
            if pts is not None:
                new_level, new_exp = up_level(profile, pts)
                profile.level = new_level
                profile.exp = new_exp
                profile.save()

            # Cascade: complete open tasks under this project and stamp the
            # same local date so they count toward today_points.
            today = project.terminated_date or timezone.localdate()
            child_tasks = project.tasks.all()
            for task in child_tasks:
                if task.status not in ("completed", "canceled"):
                    task.status = "completed"
                    task.terminated_date = today
                    task.save()

        return project

    def create(self, validated_data):
        categories = validated_data.pop("categories", [])
        project = super().create(validated_data)
        if categories:
            project.categories.set(categories)
        return project

    def get_current_points(self, obj):
        return obj.current_points()

    def get_final_points(self, obj):
        return obj.final_points()
