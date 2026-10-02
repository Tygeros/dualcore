from rest_framework import generics

from users.models import User
from .models import Task
from .serializers import TaskSerializer


class TaskList(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.prefetch_related("categories").all()
        project_id = self.request.query_params.get("project")
        status = self.request.query_params.get("status")
        category_id = self.request.query_params.get("category")
        if project_id:
            qs = qs.filter(project_id=project_id)
        if status:
            qs = qs.filter(status=status)
        if category_id:
            qs = qs.filter(categories__id=category_id).distinct()
        return qs

    def perform_create(self, serializer):
        # Single-user mode: always assign the only existing user
        owner = User.objects.first()
        serializer.save(owner=owner)


class TaskDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.prefetch_related("categories").all()
    serializer_class = TaskSerializer
