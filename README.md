# Roomly Hotel Management

React frontend with a Django backend using Django's built-in `User` model and
session authentication.

## Run the backend

```bash
cd backend
python3 manage.py migrate
python3 manage.py seed_demo
python3 manage.py runserver
```

The Django API and Admin site run at:

- API: `http://127.0.0.1:8000/api/`
- Django Admin: `http://127.0.0.1:8000/admin/`

## Run the frontend

In a second terminal:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Demo users

- Front Desk Admin: `ava` / `admin123`
- Room Service Staff: `maya` / `staff123`
- Room Service Staff: `daniel` / `staff123`
- Room Service Staff: `sofia` / `staff123`

## Managing users and roles

Sign in to Django Admin as `ava`. Create or edit a Django user under
**Authentication and Authorization > Users**, then select either
**Front Desk Admin** or **Room Service Staff** in the Roomly profile section.
The frontend automatically opens the correct dashboard after login.
