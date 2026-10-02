from rest_framework import generics

from users.models import User
from .models import Project
from .serializers import ProjectSerializer


class ProjectList(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        qs = Project.objects.prefetch_related("categories").all()
        category_id = self.request.query_params.get("category")
        status = self.request.query_params.get("status")
        if category_id:
            qs = qs.filter(categories__id=category_id).distinct()
        if status:
            qs = qs.filter(status=status)
        return qs

    def perform_create(self, serializer):
        # Single-user mode: always assign the only existing user
        owner = User.objects.first()
        serializer.save(owner=owner)


class ProjectDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.prefetch_related("categories").all()
    serializer_class = ProjectSerializer
