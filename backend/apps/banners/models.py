from django.db import models


class Banner(models.Model):
    POSITION_CHOICES = [
        ("hero", "Hero Slider"),
        ("mid", "Mid-page"),
        ("popup", "Popup"),
        ("sidebar", "Sidebar"),
    ]

    ASPECT_RATIO_CHOICES = [
        ("21/8", "Wide Hero (21:8)"),
        ("16/9", "Landscape (16:9)"),
        ("4/3", "Standard (4:3)"),
        ("1/1", "Square (1:1)"),
        ("3/4", "Portrait (3:4)"),
    ]

    OBJECT_FIT_CHOICES = [
        ("cover", "Cover (fill, may crop)"),
        ("contain", "Contain (show full image)"),
    ]

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    image = models.ImageField(upload_to="banners/")
    mobile_image = models.ImageField(upload_to="banners/mobile/", null=True, blank=True)
    link = models.CharField(max_length=500, blank=True)
    button_text = models.CharField(max_length=50, blank=True, default="Shop Now")
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default="hero")
    aspect_ratio = models.CharField(max_length=10, choices=ASPECT_RATIO_CHOICES, default="21/8")
    object_fit = models.CharField(max_length=10, choices=OBJECT_FIT_CHOICES, default="cover")
    is_active = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "banners"
        ordering = ["order"]

    def __str__(self):
        return self.title
