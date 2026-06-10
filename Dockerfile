# ---------- FRONTEND BUILD STAGE ----------
FROM node:20 AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

RUN npm run build


# ---------- BACKEND STAGE ----------
FROM node:20

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install --omit=dev

COPY backend/ .

# Copy frontend production build into backend
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

EXPOSE 5055

CMD ["npm", "start"]