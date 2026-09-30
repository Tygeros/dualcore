from rest_framework import serializers

from .models import User, Profile
from projects.models import Project
from base.models import DifficultyLevel, PriorityLevel


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"

    def create(self, validated_data):
        user = super().create(validated_data)

        default_priority = PriorityLevel.objects.get(coefficient=1.0)
        default_difficulty = DifficultyLevel.objects.get(coefficient=1.0)

        Project.objects.get_or_create(
            owner=user,
            name="Default Tasklist",
            status="in_progress",
            priority=default_priority,
            difficulty=default_difficulty,
        )

        return user


class ProfileSerializer(serializers.ModelSerializer):
    exp_threshold = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = "__all__"

    def get_exp_threshold(self, obj):
        return obj.exp_threshold()
