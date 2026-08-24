# EduMeet

EduMeet is a full-stack platform for discovering, organizing, and attending educational events.

## Core functionality

Users and organizations can discover, create, and register for educational events, manage attendance through QR codes, and share reviews.

## Tech stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Google Maps JavaScript API
- ZXing QR scanner

### Backend

- ASP.NET Core 10 Web API
- Entity Framework Core
- ASP.NET Core Identity
- JWT bearer authentication
- PostgreSQL
- MailKit
- QRCoder
- Background services and the transactional outbox pattern

## Start with Docker

### Prerequisite

No local installation of .NET, Node.js, PostgreSQL, or the Entity Framework CLI
is required.

### Run the application

Build and start all services:

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL, applies the Entity Framework migrations, and
starts the backend and frontend.

Open the application at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5062

### Optional integrations

The application starts without an `.env` file. Without additional
configuration, Google Maps location search and registration-email delivery are
unavailable.

To enable them, copy the example file from the project root:

```bash
cp .env.example .env
```

On PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Then populate the relevant values in `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EMAIL_USERNAME=your-gmail-address
EMAIL_PASSWORD=your-google-app-password
EMAIL_FROM_ADDRESS=your-gmail-address
```

Use a Google App Password for `EMAIL_PASSWORD`, not the normal Google account
password.

After changing `.env`, restart the services:

```bash
docker compose up --build
```

### Stop the application

Stop the containers while preserving the database and uploaded files:

```bash
docker compose down
```

For a completely clean restart that also deletes the Docker database and upload
volumes:

```bash
docker compose down --volumes
docker compose up --build
```
