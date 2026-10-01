from rest_framework import serializers

from .models import DifficultyLevel, PriorityLevel


class PriorityLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriorityLevel
        fields = "__all__"


class DifficultyLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DifficultyLevel
        fields = "__all__"
