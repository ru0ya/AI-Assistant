from django.db import models
from django.contrib.auth.models import User


class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    original_content = models.TextField()
    improved_content = models.TextField(null=True, blank=True)
    file_type = models.CharField(max_length=10)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Suggestion(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    original_text = models.TextField()
    improved_text = models.TextField()
    position = models.IntegerField()
    type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
