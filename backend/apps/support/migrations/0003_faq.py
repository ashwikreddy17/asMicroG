from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('support', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FAQ',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question', models.TextField()),
                ('answer', models.TextField(blank=True)),
                ('ask_count', models.PositiveIntegerField(default=1)),
                ('is_published', models.BooleanField(default=False)),
                ('category', models.CharField(blank=True, default='General', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('answered_at', models.DateTimeField(blank=True, null=True)),
                ('asked_by', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='faqs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'faqs',
                'ordering': ['-ask_count', '-created_at'],
            },
        ),
    ]
