from rest_framework import serializers

from doc_assistant.models import (
        Document,
        Suggestion
        )


class SuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suggestion
        fields = [
                'id',
                'original_text',
                'improved_text',
                'position',
                'type',
                'status',
                'created_at'
                ]
        read_only_fields = ['created_at']


class DocumentSerializer(serializers.ModelSerializer):
    suggestions = SuggestionSerializer(
            many=True,
            read_only=True,
            source='suggestion_set'
            )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Document
        fields = [
                'id',
                'user',
                'title',
                'original_content',
                'improved_content',
                'file_type',
                'status',
                'created_at',
                'updated_at',
                'suggestions'
                ]
        read_only_fields = ['created_at', 'updated_at']


class DocumentUploadSerializer(serializers.Serializer):
    # verifies file upload
    document = serializers.FileField(
            required=True,
            allow_empty_file=False,
            help_text="Upload a document file (.txt, .docx, .pdf)"
            )

    def validate_document(self, value):
        # gets the file extension
        file_extension = value.name.split('.')[-1].lower()

        if file_extension not in ['txt', 'docx', 'pdf']:
            raise serializers.ValidationError(
                    "Unsupported file type.Please upload\
                            .txt, .docx, .pdf files."
                            )

        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                    "File size too large.Max file size is 5MB."
                    )
        return value

    class Meta:
        model = Document
        fields = [
                'document',
                'title',
                'original_content',
                'file_type'
                ]


class UserDocumentListSerializer(serializers.Serializer):
    documents = DocumentSerializer(many=True, read_only=True)

    def to_representation(self, instance):
        user = self.context['request'].user
        documents = Document.objects.filter(user=user)
        
        return {'documents': DocumentSerializer(documents, many=True).data}
