from rest_framework import generics

from users.models import User
from .models import Project
from .serializers import ProjectSerializer


class ProjectList(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def perform_create(self, serializer):
        # Single-user mode: always assign the only existing user
        owner = User.objects.first()
        serializer.save(owner=owner)


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
