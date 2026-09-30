from rest_framework import serializers

from .models import Project

from base.services import up_level


class ProjectSerializer(serializers.ModelSerializer):
    current_points = serializers.SerializerMethodField() 
    final_points = serializers.SerializerMethodField()

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
            "current_points",
            "final_points",
            "created_at",
            "updated_at",
        ] 

    def update(self, instance, validated_data):
        old_status = instance.status
        project = super().update(instance, validated_data)

        if old_status in ["pending", "in_progress"] and project.status in ["completed", "canceled"]:
            owner = project.owner
            profile = owner.profile
            new_level, new_exp = up_level(profile, project.final_points())
            profile.level = new_level
            profile.exp = new_exp
            profile.save()

            child_tasks = project.tasks.all()
            for task in child_tasks:
                if task.status not in ["completed", "canceled"]:
                    task.status = "completed"
                    task.save()

        return project

    def get_current_points(self, obj):
        return obj.current_points()

    def get_final_points(self, obj):
        return obj.final_points()
