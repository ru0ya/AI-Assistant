from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import spacy
from textblob import TextBlob
from langdetect import detect
from spacy.matcher import Matcher, PhraseMatcher
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # load spacy model with all pipeline components needed
        self.nlp = spacy.load("en_core_web_sm", disable=['ner'])

        if 'senter' not in self.nlp.pipe_names:
            self.nlp.add_pipe('sentencizer')

        self.matcher = Matcher(self.nlp.vocab)
        self.phrase_matcher = PhraseMatcher(self.nlp.vocab)

        # add passive voice pattern
        passive_pattern = [
                {'DEP': 'auxpass'},
                {'TAG': 'VBN'}
                ]
        self.matcher.add('Passive', [passive_pattern])

    def get_queryset(self):
        return Document.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'upload':
            return DocumentUploadSerializer
        return DocumentSerializer

    """
    @action(detail=False, methods=['GET'])
    def list_user_documents(self, request):
        serializer = UserDocumentListSerializer(context={'request': request})
        return Response(serializer.data)
    """

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

        document = self.create_and_process_document(content, file.name)

        return Response(
                self.get_serializer(document).data,
                status=status.HTTP_201_CREATED
                )

    def create_and_process_document(self, content, filename):
        blob = detect(content)
        if blob != 'en':
            raise ValueError('Only English documents are supported')

        document = Document.objects.create(
                user=self.request.user,
                title=filename,
                original_content=content,
                file_type=filename.split('.')[-1]
                )

        improved_content = self.improve_document(content)
        document.improved_content = improved_content
        document.save()

        return document
    
    def improve_document(self, content):
        """Improve document using both TextBlob and SpaCy"""
        blob = TextBlob(content)

        # correct spelling and basic grammar
        corrected_text = str(blob.correct())

        # use SpaCy for advanced processing
        doc = self.nlp(corrected_text)

        # convert doc into sentences for processing
        sentences = list(doc.sents)
        improved_sentences = []

        for sent in sentences:
            improved_sent = self.improve_sentence(sent)
            improved_sentences.append(improved_sent)

        # join sentences with proper spacing
        improved_text = ''.join(improved_sentences)

        final_blob = TextBlob(improved_text)
        return str(final_blob)

    def improve_sentence(self, sent):
        """Improve individual sentences using SpaCy's analysis"""
        text = sent.text

        # use SpaCy's analysis for improvements
        root = sent.root

        # handle passive voice
        if any(token.dep_ == 'auxpass' for token in sent):
            text = self.convert_to_active(sent)

        # fix subject verb agreement
        for token in sent:
            if token.dep_ == "nsubj" and token.head.pos_ == "VERB":
                text = self.fix_agreement(token, token.head, text)

        text = text[0].upper() + text[1:]

        return text

    def convert_to_active(self, sent):
        """
        Converts passive voice to active voice using SpaCy's\
                dependency parsing
        """
        subject = None
        verb = None
        agent = None

        for token in sent:
            if token.dep_ == "nsubjpass":
                subject = token
            elif token.dep_ == "auxpass":
                verb = token.head
            elif token.dep_ == "agent":
                agent = token.children.__next__()

        if subject and verb:
            if agent:
                return f"{agent.text} {verb.text} {subject.text}"
            else:
                return sent.text

        return sent.text

    def fix_agreement(self, subject, verb, text):
        """
        Fix subject-verb agreement using SpaCy's morphological analysis
        """
        subj_num = subject.morph.get("Number", [""])[0]
        verb_num = verb.morph.get("Number", [""])[0]

        if subj_num and verb_num and subj_num != verb_num:
            bob = TextBlob(text)
            return str(blob.correct())

        return text
        
    def extract_content(self, file):
        """
        Extract text from various file formats
        """
        try:
            if file.name.endswith('.txt'):
                return file.read().decode('utf-8', errors='replace')
            elif file.name.endswith('.docx'):
                doc = docx.Document(file)
                paragraphs = [p.text.strip() for p in doc.paragraphs if
                        p.text.strip()]
                return '\n\n'.join(paragraphs)
            elif file.name.endswith('.pdf'):
                pdf_reader = PyPDF2.PdfReader(file)

                # extract text from each page
                text_parts = []
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text.strip())
                return '\n\n'.join(text_parts)

            return ''
        except Exception as e:
            print(f"Error extracting content: {str(e)}")
            return ''

    @action(detail=True, methods=['GET'])
    def compare(self, request, pk=None):
        document = self.get_object()
        return Response({
            'original_content': document.original_content,
            'improved_content': document.improved_content
            })

    @action(detail=True, methods=['POST'])
    def export(self, request, pk=None):
        document = self.get_object()

        # create new word document
        doc = docx.Document(settings.WORD_TEMPLATE_PATH)

        # add improved content
        doc.add_paragraph(document.improved_content)

        # add analysis
        doc.aadd_paragraph("\nDocument Analysis:")

        # use TextBlob for sentiment analysis
        blob = TextBlob(document.improved_content)
        sentiment = blob.sentiment
        doc.add_paragraph(
            f"Sentiment: {'Positive' if sentiment.polarity > 0 else 'Negative' if sentiment.polarity < 0 else 'Neutral'}")

        # use SpaCy for structural analysis
        spacy_doc = self.nlp(document.improved_content)
        doc.add_paragraph(f"Sentences: {len(list(spacy_doc.sents))}")
        doc.add_paragraph(
            f"Average sentence length: {len(spacy_doc) / len(list(spacy_doc.sents)):.lf} words")

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
