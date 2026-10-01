from rest_framework import generics

from .models import PriorityLevel, DifficultyLevel
from .serializers import PriorityLevelSerializer, DifficultyLevelSerializer


class PriorityLevelList(generics.ListAPIView):
    queryset = PriorityLevel.objects.all()
    serializer_class = PriorityLevelSerializer


class DifficultyLevelList(generics.ListAPIView):
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer
