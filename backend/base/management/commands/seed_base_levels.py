from django.core.management.base import BaseCommand

from base.models import DifficultyLevel, PriorityLevel


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        difficulty_choices = [
            ("Easy", 0.5),
            ("Normal", 1.0),
            ("Hard", 1.5),
            ("Very Hard", 2.0),
            ("Extremely", 3.0)
        ]

        # Create default Difficulty Levels
        difficulty_count = 0
        for choice in difficulty_choices:
            new_level, created = DifficultyLevel.objects.get_or_create(
                name=choice[0],
                coefficient=choice[1]
            )

            if created == False:
                self.stdout.write(
                    self.style.WARNING(f"Create new difficulty level failed! \"{choice[0]}\" difficulty already exists")
                )
            else:
                difficulty_count += 1

        if difficulty_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f"Successfully created new {difficulty_count} difficulty levels!")
            )


        # Create default Priority Levels
        priority_choices = [
            ("Low", 0.5),
            ("Medium", 1.0),
            ("High", 1.5),
            ("Very High", 2.0)
        ]

        priority_count = 0
        for choice in priority_choices:
            new_level, created = PriorityLevel.objects.get_or_create(
                name=choice[0],
                coefficient=choice[1]
            )

            if created == False:
                self.stdout.write(
                    self.style.WARNING(f"Create new priority level failed. \"{choice[0]}\" priority already exists")
                )
            else:
                priority_count += 1

        if priority_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f"Successfully created new {priority_count} priority levels!")
            )
