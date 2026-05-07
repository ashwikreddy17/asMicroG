from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_returnrequest'),
    ]

    operations = [
        migrations.CreateModel(
            name='ShippingSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('free_shipping_threshold', models.DecimalField(decimal_places=2, default=500, max_digits=10)),
                ('shipping_cost', models.DecimalField(decimal_places=2, default=50, max_digits=10)),
                ('first_order_free', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'shipping_settings',
            },
        ),
    ]
