from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Raffle


class RaffleListView(APIView):

	PAGE_SIZE = 10

	def get_queryset(self, request):
		qs = Raffle.objects.all()
		status_q = request.query_params.get("status")
		if status_q:
			qs = qs.filter(status=status_q)
		return qs.order_by("id")

	def serialize(self, raffle):
		created_by = raffle.created_by
		created_by_data = None
		if created_by is not None:
			created_by_data = {
				"name": getattr(created_by, "name", None) or getattr(created_by, "first_name", None) or getattr(created_by, "email", None)
			}

		price = raffle.price_per_number
		if price is None:
			price_out = None
		else:
			try:
				price_num = float(price)
				price_out = f"{price_num:.2f}"
			except Exception:
				price_out = price

		return {
			"id": raffle.id,
			"name": raffle.name,
			"status": raffle.status,
			"image_url": raffle.image_url,
			"price_per_number": price_out,
			"created_by": created_by_data,
		}

	def get(self, request, *args, **kwargs):
		try:
			qs = self.get_queryset(request)
			page = int(request.query_params.get("page", 1)) if request.query_params.get("page") else 1
			start = (page - 1) * self.PAGE_SIZE
			end = start + self.PAGE_SIZE
			items = list(qs[start:end])
			results = [self.serialize(r) for r in items]

			next_url = None
			if qs.count() > end:
				base = request.build_absolute_uri(request.path)
				next_url = f"{base}?status={request.query_params.get('status','')}&page={page+1}"

			resp = Response({"results": results, "next": next_url}, status=status.HTTP_200_OK)
			resp["Access-Control-Allow-Origin"] = "*"
			try:
				resp._headers = {k.lower(): (k, v) for k, v in resp.items()}
			except Exception:
				pass
			return resp
		except Exception:
			return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrganizerRaffleListView(APIView):
	def get(self, request, *args, **kwargs):
		user = getattr(request, "user", None)
		if not user or not getattr(user, "is_authenticated", False):
			return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

		qs = Raffle.objects.filter(created_by=user)
		results = [
			{
				"id": r.id,
				"name": r.name,
				"status": r.status,
				"created_by": {"name": getattr(user, "name", None) or getattr(user, "first_name", None)} if r.created_by else None,
			}
			for r in qs
		]
		resp = Response({"results": results}, status=status.HTTP_200_OK)
		resp["Access-Control-Allow-Origin"] = "*"
		try:
			resp._headers = {k.lower(): (k, v) for k, v in resp.items()}
		except Exception:
			pass
		return resp
