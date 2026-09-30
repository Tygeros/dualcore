from rest_framework import serializers

from .models import Task

from base.services import up_level


class TaskSerializer(serializers.ModelSerializer):
    task_level = serializers.SerializerMethodField()
    current_points = serializers.SerializerMethodField()
    final_points = serializers.SerializerMethodField()

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
            "current_points",
            "final_points",
            "created_at",
            "updated_at"
        ]

    def update(self, instance, validated_data):
        old_status = instance.status
        task = super().update(instance, validated_data)

        if old_status in ["pending", "in_progress"] and task.status in ["completed", "canceled"]:
            owner = task.owner
            profile = owner.profile
            new_level, new_exp = up_level(profile, task.final_points())
            profile.level = new_level
            profile.exp = new_exp
            profile.save()

            child_tasks = task.child_tasks.all()
            for task in child_tasks:
                if task.status not in ["completed", "canceled"]:
                    task.status = "completed"
                    task.save()

        return task 

    def get_task_level(self, obj):
        return obj.task_level()

    def get_current_points(self, obj):
        return obj.current_points()

    def get_final_points(self, obj):
        return obj.final_points()
