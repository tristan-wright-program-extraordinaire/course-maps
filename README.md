# Course Maps

> An interactive nationwide map for sales representatives showing every signed golf course and the products they're enrolled in. This is all kept current automatically by a daily Python pipeline. Hosted on Google Cloud Run.

<img width="1470" height="744" alt="Screenshot 2026-03-04 at 4 57 07 PM" src="https://github.com/user-attachments/assets/2b4c33b9-f295-4d42-bc4e-bbe6d476f5e0" />
<img width="1470" height="745" alt="Screenshot 2026-03-04 at 4 58 36 PM" src="https://github.com/user-attachments/assets/a9f76ffd-558b-41b1-bf4a-c501df7faca9" />

---

## What This Is

Sales representatives cover territories across the country and need a fast, visual way to understand what courses exist in their area and what products those courses are signed up for. Digging through spreadsheets to answer that question was slow and extremely error-prone.

Course Maps puts that information on a map. Every signed course appears as a pin. Click a pin and you see the course details and product enrollment. The whole dataset refreshes automatically every day. No manual updates, no stale data.

---

## Features

- **Nationwide map view** - All signed courses displayed as interactive pins via Google Maps
- **Product-level detail** - Each pin surfaces what products the course is enrolled in
- **Daily data pipeline** - A Python script runs automatically each day to refresh all course info
- **Production deployment** - Hosted on Google Cloud Run, always available to the sales team

---

## Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

**Data Pipeline**

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)

**APIs & Infrastructure**

![Google Maps](https://img.shields.io/badge/Google_Maps_API-4285F4?style=flat-square&logo=googlemaps&logoColor=white)
![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white)

---

## Architecture

```
course-maps/
├── src/        # React + TypeScript frontend
├── python/     # Daily data pipeline script
├── public/     # Static assets
└── assets/     # Images and resources
```

The frontend is a React app built with Vite that renders course data onto a Google Maps interface. The `python/` directory contains the pipeline script that fetches, processes, and updates course data on a daily schedule. This keeps the map current without any manual intervention.
