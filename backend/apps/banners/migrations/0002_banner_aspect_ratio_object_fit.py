from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('banners', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='banner',
            name='aspect_ratio',
            field=models.CharField(
                choices=[('21/8', 'Wide Hero (21:8)'), ('16/9', 'Landscape (16:9)'), ('4/3', 'Standard (4:3)'), ('1/1', 'Square (1:1)'), ('3/4', 'Portrait (3:4)')],
                default='21/8',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='banner',
            name='object_fit',
            field=models.CharField(
                choices=[('cover', 'Cover (fill, may crop)'), ('contain', 'Contain (show full image)')],
                default='cover',
                max_length=10,
            ),
        ),
    ]
