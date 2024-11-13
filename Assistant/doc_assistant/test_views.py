import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User

from doc_assistant.models import Document
from doc_assistant.views import DocumentViewSet


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
            username='testuser',
            password='testpassword'
            )

@pytest.mark.django_db
def test_document_upload(api_client, user):
    api_client.force_authenticate(user=user)

    with open('test_file.txt', 'wb')as f:
        f.write(b'This is a document.')

    with open('test_file.txt', 'rb') as f:
        response = api_client.post(
                '/documents/upload/',
                {'document': f},
                format='multipart'
                )

    assert response.status_code == status.HTTP_201_CREATED
    assert Document.objects.filter(user=user).count() == 1

@pytest.mark.django_db
def test_document_compare(api_client, user):
    document = Document.objects.create(
            user=user,
            title='Test Document',
            original_content='This is the original content.',
            improved_content='This is the improved content.'
            )

    api_client.force_authenticate(user=user)
    response = api_client.get(f'/documents/{document.id}/compare/')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['original_content'] == 'This is the original content.'
    assert response.data['improved_content'] == 'This is the improved content.'

"""
@pytest.mark.django_db
def test_document_export(api_client, user):
    document = Document.objects.create(
            user=user,
            title='Test Document',
            original_content='This is the original content.',
            improved_content='This is the improved content.'
            )

    api_client.force_authenticate(user=user)
    response = api_client.post(f'/documents/{id}/export/')

    assert response.status_code == status.HTTP_200_OK
    assert response['Content-Type'] == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    assert response['Content-Disposition'] == 'attachment; filename="Test Document_improved.docx"'
"""
