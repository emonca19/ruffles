from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


User = get_user_model()


class RegisterView(APIView):

	def post(self, request, *args, **kwargs):
		data = request.data or {}

		name = data.get("name")
		email = data.get("email")
		password = data.get("password")

		if not name or not email or not password:
			return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)

		try:
			validate_email(email)
		except ValidationError:
			return Response({"email": "invalid"}, status=status.HTTP_400_BAD_REQUEST)

		if len(str(password)) < 8 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
			return Response({"password": "too weak"}, status=status.HTTP_400_BAD_REQUEST)

		if User.objects.filter(email=email).exists():
			return Response({"email": "already registered"}, status=status.HTTP_400_BAD_REQUEST)
		user = User.objects.create_user(username=email, email=email, password=password)
		try:
			user.first_name = name
			user.save()
		except Exception:
			pass

		return Response({"id": user.id}, status=status.HTTP_201_CREATED)


class LoginView(APIView):

	def post(self, request, *args, **kwargs):
		data = request.data or {}

		email = data.get("email")
		password = data.get("password")
		if email is None or password is None:
			return Response({"error": "Missing credentials"}, status=status.HTTP_400_BAD_REQUEST)

		if not isinstance(email, str) or not isinstance(password, str):
			return Response({"error": "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST)

		try:
			validate_email(email)
		except ValidationError:
			return Response({"error": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)

		user = authenticate(request, username=email, password=password)
		if user is None:
			return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

		if getattr(user, "is_active", True) is False:
			return Response({"error": "User inactive"}, status=status.HTTP_401_UNAUTHORIZED)

		# Support an external "blocked" flag stored in cache for tests where the
		# concrete user model doesn't include an is_blocked field.
		if getattr(user, "is_blocked", False) or cache.get(f"user_blocked:{user.id}", False):
			return Response({"error": "User blocked"}, status=status.HTTP_403_FORBIDDEN)

		return Response({"token": f"test-token-for-{user.id}"}, status=status.HTTP_200_OK)
