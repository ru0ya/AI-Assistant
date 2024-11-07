from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import spacy
from django.conf import settings
import docx
import PyPDF2
from io import BytesIO

from doc_assistant.serializers import (
        DocumentSerializer,
        SuggestionSerializer,
        DocumentUploadSerializer,
        UserDocumentListSerializer
        )
from doc_assistant.models import (
        Document,
        Suggestion
        )


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'upload':
            return DocumentUploadSerializer
        return DocumentSerializer

    @action(detail=False, methods=['GET'])
    def list_user_documents(self, request):
        serializer = UserDocumentListSerializer(context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['POST'])
    def upload(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['document']
        content = self.extract_content(file)

        if not content:
            return Response(
                    {'error': 'Unable to extract content from file'},
                    status=status.HTTP_400_BAD_REQUEST
                    )

        document = Document.objects.create(
                user=request.user,
                title=file.name,
                original_content=content,
                file_type=file.name.split('.')[-1]
                )

        improved_content, suggestions = self.process_document(content)
        document.improved_content = improved_content
        document.save()

        suggestion_objects = [
                Suggestion(
                    document=document,
                    original_text=suggestion['original'],
                    improved_text=suggestion['improved'],
                    position=suggestion['position'],
                    type=suggestion['type']
                    )
                for suggestion in suggestions
                ]

        if suggestion_objects:
            Suggestion.objects.bulk_create(suggestion_objects)

        return Response(
                self.get_serializer(document).data,
                status=status.HTTP_201_CREATED
                )

        @action(detail=True, methods=['POST'])
        def apply_suggestion(self, request, pk=None):
            suggestion_id = request.data.get('suggestion_id')
            try:
                suggestion = Suggestion.objects.get(
                        id=suggestion_id,
                        document_id=pk,
                        document__user=request.user
                        )
            except Suggestion.DoesNotExist:
                return Response(
                        {'error': 'Suggestion not found'},
                        status=status.HTTP_404_NOT_FOUND
                        )

            document = suggestion.document
            # apply suggestion to improved content
            document.improved_content = document.improved_content.replace(
                    suggestion.original_text,
                    suggestion.improved_text
                    )
            document.save()

            suggestion.status = 'applied'
            suggestion.save()

            return Response(self.get_serializer(document).data)

        def process_document(self, content):
            nlp = spacy.load("en_core_web_sm")
            doc = nlp(content)

            improved_content = content
            suggestions = []

            improved_content, grammar_suggestions = self.check_grammar(
                    doc,
                    improved_content
                    )
            suggestions.extend(grammar_suggestions)

            improved_content, style_suggestions = self.check_style(
                    doc,
                    improved_content
                    )
            suggestions.extend(style_suggestions)

            return improved_content, suggestions

        def check_grammar(self, doc, content):
            suggestions = []

            for token in doc:
                if token.dep_ == "nsubj" and token.head.pos_ == "VERB":
                    if token.morph.get("Number") != token.head.\
                            morph.get("Number"):
                                suggestions.append({
                                    'original': token.sent.text,
                                    'improved': 
                                    self.fix_subject_verb_agreement(
                                        token,
                                        token.head
                                        ),
                                    'position': token.sent.start_char,
                                    'type': 'grammar'
                                    })
            return content, suggestions

        def check_style(self, doc, content):
            suggestions = []
            
            if self.is_passive_voice(doc):
                suggestions.append({
                    'original': doc.text,
                    'improved': self.suggest_active_voice(doc),
                    'position': 0,
                    'type': 'style'
                    })

            return content, suggestions

        def check_clarity(self, doc, content):
            suggestions = []

            for sent in doc.sents:
                if len(sent.text.split()) > 30:
                    suggestions.append({
                        'original': sent.text,
                        'improved': self.split_long_sentence(sent.text),
                        'position': sent.start_char,
                        'type': 'clarity'
                        })

            return content, suggestions

        def extract_content(self, file):
            if file.name.endswith('.txt'):
                return file.read().decode('utf-8')
            elif file.name.endswith('.docx'):
                doc = docx.Document(file)
                return '\n'.join([paragraph.text for paragraph in doc.paragraphs])
            elif file.name.endswith('.pdf'):
                pdf_reader = PyPDF2.PdfReader(file)
                return ''.join(page.extract_text() for page in pdf_reader.pages)

            return ''

        @action(detail=True, methods=['POST'])
        def export(self, request, pk=None):
            document = self.get_object()

            # create new word document
            doc = docx.Document(settings.WORD_TEMPLATE_PATH)
            doc.add_paragraph(document.improved_content)

            buffer = BytesIO()
            doc.save(buffer)
            buffer.seek(0)

            response = Response(
                    buffer.getvalue(),
                    content_type='application/vnd.openxmlformats\
                            -officedocument.wordprocessingml.document'
                            )
            response['Content-Disposition'] = f'attachment; filename="{document.title}"'

            return response
