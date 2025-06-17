import requests

HOST = "http://127.0.0.1:8000"

body = {
     "api_key": "a640373b-30ae-4655-a1f3-5caa882a8721",
}

response = requests.post(f"{HOST}/public/v1/auth/access_token", json=body).json()

token = response.get("bearer")

headers = {
    "Authorization": f"Bearer {token}",
}

response = requests.get(f"{HOST}/public/v1/project", headers=headers)
print(response.json())

# a little bit slow, may be worth async for larger tasks, e.g., traces