from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import tempfile
import os
from unittest.mock import patch, MagicMock
from doc_assistant.models import Document
from doc_assistant.views import DocumentProcessor

User = get_user_model()

class DocumentProcessorTests(TestCase):
    def setUp(self):
        self.processor = DocumentProcessor()
        
    def create_temp_file(self, content, extension):
        temp = tempfile.NamedTemporaryFile(suffix=f'.{extension}', delete=False)
        if isinstance(content, str):
            content = content.encode('utf-8')
        temp.write(content)
        temp.close()
        return temp.name

    def test_extract_content_txt(self):
        content = "This is a test document."
        file_path = self.create_temp_file(content, 'txt')
        with open(file_path, 'rb') as f:
            file = SimpleUploadedFile("test.txt", f.read())
            extracted = self.processor.extract_content(file)
            self.assertEqual(extracted.strip(), content)
        os.unlink(file_path)

    @patch('doc_assistant.views.docx.Document')
    def test_extract_content_docx(self, mock_docx):
        mock_doc = MagicMock()
        mock_doc.paragraphs = [
            MagicMock(text="Paragraph 1"),
            MagicMock(text="Paragraph 2")
        ]
        mock_docx.return_value = mock_doc
        
        file = SimpleUploadedFile("test.docx", b"fake docx content")
        extracted = self.processor.extract_content(file)
        self.assertEqual(extracted, "Paragraph 1\n\nParagraph 2")

    def test_validate_content(self):
        # Test valid English content
        valid_content = "This is a valid English document."
        self.assertEqual(self.processor.validate_content(valid_content), valid_content)
        
        # Test empty content
        with self.assertRaises(ValueError):
            self.processor.validate_content("")
        
        # Test non-English content
        with self.assertRaises(ValueError):
            self.processor.validate_content("Este es un documento en español.")

    def test_improve_document(self):
        # Test basic improvements
        content = "this is a test sentence. the cat was chased by the dog."
        improved = self.processor.improve_document(content)
        self.assertTrue(improved[0].isupper())  # Check capitalization
        self.assertIn("dog chased", improved)  # Check passive voice conversion

    def test_improve_sentence(self):
        doc = self.processor.nlp("the document was processed by the system.")
        improved = self.processor.improve_sentence(list(doc.sents)[0])
        self.assertTrue(improved[0].isupper())  # Check capitalization
        self.assertIn("system processed", improved)  # Check passive voice conversion


class DocumentViewSetTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test document
        self.document = Document.objects.create(
            user=self.user,
            title='test.txt',
            original_content='Original content',
            improved_content='Improved content',
            file_type='txt'
        )
        
        self.upload_url = reverse('document-upload')
        self.compare_url = reverse('document-compare', kwargs={'pk': self.document.pk})
        self.export_url = reverse('document-export', kwargs={'pk': self.document.pk})

    def test_upload_document(self):
        content = b"This is a test document."
        file = SimpleUploadedFile("test.txt", content)
        
        response = self.client.post(self.upload_url, {'document': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 2)
        self.assertEqual(Document.objects.latest('id').title, 'test.txt')

    def test_upload_invalid_file_type(self):
        content = b"Invalid file content"
        file = SimpleUploadedFile("test.invalid", content)
        
        response = self.client.post(self.upload_url, {'document': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_compare_document(self):
        response = self.client.get(self.compare_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['original_content'], 'Original content')
        self.assertEqual(response.data['improved_content'], 'Improved content')

    @patch('doc_assistant.views.docx.Document')
    def test_export_document(self, mock_docx):
        mock_doc = MagicMock()
        mock_docx.return_value = mock_doc
        
        response = self.client.post(self.export_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    def test_unauthorized_access(self):
        self.client.force_authenticate(user=None)
        
        response = self.client.get(self.compare_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_document_list(self):
        response = self.client.get(reverse('document-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_document_detail(self):
        response = self.client.get(reverse('document-detail', kwargs={'pk': self.document.pk}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'test.txt')

class DocumentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_document_creation(self):
        document = Document.objects.create(
            user=self.user,
            title='test.txt',
            original_content='Test content',
            improved_content='Improved test content',
            file_type='txt'
        )
        self.assertEqual(document.title, 'test.txt')
        self.assertEqual(document.file_type, 'txt')
        self.assertEqual(document.user, self.user)

    def test_document_str_method(self):
        document = Document.objects.create(
            user=self.user,
            title='test.txt',
            original_content='Test content',
            improved_content='Improved test content',
            file_type='txt'
        )
        self.assertEqual(str(document), 'test.txt')
