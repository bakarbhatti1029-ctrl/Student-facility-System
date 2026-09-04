# Student Facility System (SFS)

A web platform for managing student facilities (hostels, kitchens, and related bookings/payments), built as a final year project.

**Developer:** Aqib Awan (Aqib Ejaz)
**College:** Govt. Shalimar Graduate College, Lahore

## Stack

| Layer      | Technology                     | Host          |
|------------|---------------------------------|---------------|
| Frontend   | React + Redux + Tailwind CSS    | Vercel        |
| Backend    | Node.js + Express + Socket.IO   | Render        |
| Database   | MongoDB Atlas                   | Atlas         |
| Payments   | Stripe (PKR)                    | Stripe        |
| Maps       | Leaflet + OpenStreetMap         | Free          |

## Project structure

```
backend/    Express API, Socket.IO, MongoDB models, auth, payments
frontend/   React app (Redux, Tailwind, Leaflet maps, Stripe checkout)
```

## Getting started locally

### Backend
```
cd backend
npm install
npm run dev
```

### Frontend
```
cd frontend
npm install
npm start
```

Each app expects its own `.env` file (see `.env.example` if present, or `backend/README.md` / `frontend/README.md` for required variables).

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for the full production deployment walkthrough (Render for backend, Vercel for frontend, MongoDB Atlas, Stripe setup, and the super admin creation steps).

## License

See [backend/LICENSE](./backend/LICENSE).
