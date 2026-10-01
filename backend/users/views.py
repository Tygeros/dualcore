from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from projects.models import Project
from tasks.models import Task
from .models import Profile
from .serializers import ProfileSerializer


class ProfileList(generics.ListAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class ProfileDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class TodayPointsView(APIView):
    """
    Điểm đạt được hôm nay từ project/task đã completed|canceled
    với terminated_date = hôm nay (local date).
    Không cộng EXP — chỉ dùng để hiển thị tiến độ vs commit_points.
    """

    def get(self, request):
        profile = Profile.objects.select_related("user").first()
        if not profile:
            return Response(
                {
                    "today_points": 0.0,
                    "commit_points": 0.0,
                    "progress": 0.0,
                    "date": str(timezone.localdate()),
                }
            )

        today = timezone.localdate()

        projects = Project.objects.filter(
            terminated_date=today,
            status__in=["completed", "canceled"],
        )
        tasks = Task.objects.filter(
            terminated_date=today,
            status__in=["completed", "canceled"],
        )

        today_points = 0.0
        for project in projects:
            pts = project.final_points()
            if pts is not None:
                today_points += pts
        for task in tasks:
            pts = task.final_points()
            if pts is not None:
                today_points += pts

        commit = float(profile.commit_points or 0)
        progress = (today_points / commit * 100.0) if commit > 0 else 0.0

        return Response(
            {
                "today_points": round(today_points, 2),
                "commit_points": commit,
                "progress": round(progress, 1),
                "date": str(today),
                "projects_count": projects.count(),
                "tasks_count": tasks.count(),
            }
        )
