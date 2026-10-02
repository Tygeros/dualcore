from rest_framework import serializers

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
        categories = validated_data.pop("categories", None)
        task = super().update(instance, validated_data)

        if categories is not None:
            task.categories.set(categories)

        if old_status in ["pending", "in_progress"] and task.status in [
            "completed",
            "canceled",
        ]:
            owner = task.owner
            profile = owner.profile
            new_level, new_exp = up_level(profile, task.final_points())
            profile.level = new_level
            profile.exp = new_exp
            profile.save()

            child_tasks = task.child_tasks.all()
            for child in child_tasks:
                if child.status not in ["completed", "canceled"]:
                    child.status = "completed"
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
