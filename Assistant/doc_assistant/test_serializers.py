import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory

from doc_assistant.models import Document, Suggestion
from doc_assistant.serializers import (
        SuggestionSerializer,
        DocumentSerializer,
        DocumentUploadSerializer
        )


@pytest.fixture
def user():
    return User.objects.create_user(
            username='testuser',
            password='testpass123'
            )

@pytest.fixture
def document(user):
    return Document.objects.create(
            user=user,
            title='Test Document',
            original_content='Original content',
            improved_content='Improved content',
            file_type='txt',
            status='completed'
            )

@pytest.fixture
def suggestion(document):
    return Suggestion.objects.create(
            document=document,
            original_text='original',
            improved_text='improved',
            position=0,
            type='grammar',
            status='pending'
            )

@pytest.fixture
def request_factory():
    return APIRequestFactory()

@pytest.fixture
def request_with_user(request_factory, user):
    request = request_factory.get('/')
    request.user = user
    return request


@pytest.mark.django_db
class TestSuggestionSerializer:
    def test_serialize_suggestion(self, suggestion):
        serializer = SuggestionSerializer(suggestion)
        assert serializer.data['original_text'] == 'original'
        assert serializer.data['improved_text'] == 'improved'
        assert serializer.data['position'] == 0
        assert serializer.data['type'] == 'grammar'
        assert serializer.data['status'] == 'pending'
        assert 'created_at' in serializer.data

    def test_create_suggestion(self):
        data = {
                'original_text': 'test original',
                'improved_text': 'test improved',
                'position': 1,
                'type': 'spelling',
                'status': 'pending'
                }
        serializer = SuggestionSerializer(data=data)
        assert serializer.is_valid()


@pytest.mark.django_db
class TestDocumentSerializer:
    def test_serialize_document(self, document, suggestion, request_with_user):
        serializer = DocumentSerializer(
                document,
                context={'request': request_with_user}
                )
        assert serializer.data['title'] == 'Test Document'
        assert serializer.data['original_content'] == 'Original content'
        assert serializer.data['improved_content'] == 'Improved content'
        assert serializer.data['file_type'] == 'txt'
        assert serializer.data['status'] == 'completed'
        assert len(serializer.data['suggestions']) == 1
        assert serializer.data['suggestions'][0]['original_text'] == 'original'

    def test_create_document(self, user, request_with_user):
        data = {
                'title': 'New Document',
                'original_content': 'New content',
                'improved_content': 'Improved new content',
                'file_type': 'txt',
                'status': 'pending'
                }
        serializer = DocumentSerializer(
                data=data,
                context={'request': request_with_user}
                )
        assert serializer.is_valid()
        document = serializer.save()
        assert document.user == user
        assert document.title == 'New Document'


@pytest.mark.django_db
class TestDocumentUploadSerializer:
    def test_valid_txt_file(self):
        file = SimpleUploadedFile(
                "test.txt",
                b"file content",
                content_type="text/plain"
                )
        serializer = DocumentUploadSerializer(data={'document': file})
        assert serializer.is_valid()

    def test_valid_docx_file(self):
        file = SimpleUploadedFile(
                "test.docx",
                b"file content",
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
        serializer = DocumentUploadSerializer(data={'document': file})
        assert serializer.is_valid()

    def test_valid_pdf_file(self):
        file = SimpleUploadedFile(
                "test.pdf",
                b"file content",
                content_type="application/pdf"
                )
        serializer = DocumentUploadSerializer(data={'document': file})
        assert serializer.is_valid()

    def test_invalid_file_type(self):
        file = SimpleUploadedFile(
                "test.jpg",
                b"file content",
                content_type="image/jpeg"
                )
        serializer = DocumentUploadSerializer(data={'document': file})
        assert not serializer.is_valid()
        assert 'Unsupported file type' in str(serializer.errors['document'][0])

    def test_file_too_large(self):
        content = b'x' * (6 * 1024 * 1024)
        file = SimpleUploadedFile(
                "test.txt",
                content,
                content_type="text/plain"
                )
        serializer = DocumentUploadSerializer(data={'document': file})
        assert not serializer.is_valid()
        assert 'File size too large' in str(serializer.errors['document'][0])

    def test_empty_file(self):
        file = SimpleUploadedFile(
                "test.txt",
                b"",
                content_type="text/plain"
                )
        serializer = DocumentUploadSerializer(data={'document': file})
        assert not serializer.is_valid()
        assert 'empty' in str(serializer.errors['document'][0]).lower()
