import pytest
from rest_framework.test import APIClient
from unittest.mock import patch
from django.db import DatabaseError

class TestRafflesListEndpoint:
    
    @pytest.fixture
    def client(self):
        return APIClient()
    
    def test_get_raffles_returns_active_raffles(self, client):
        """Petición correcta con datos válidos"""
        response = client.get("/api/v1/raffles/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        for raffle in data:
            assert raffle['status'] == 'active'
    
    def test_pagination_limits_to_10_per_page(self, client):
        """Paginar correctamente el resultado"""
        response = client.get("/api/v1/raffles/")
        data = response.json()
        assert len(data) <= 10
    
    def test_empty_list_when_no_active_raffles(self, client):
        """Retornar lista vacía si no hay sorteos activos"""
        response = client.get("/api/v1/raffles/")
        data = response.json()
        assert len(data) == 0
    
    @patch('apps.raffles.views.RaffleViewSet.get_queryset')
    def test_database_error_returns_500(self, mock_queryset, client):
        """Manejar error de base de datos"""
        mock_queryset.side_effect = DatabaseError("Database error")
        response = client.get("/api/v1/raffles/")
        assert response.status_code == 500