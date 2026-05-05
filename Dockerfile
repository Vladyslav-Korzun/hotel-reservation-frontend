FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/academy-frontend/browser /usr/share/nginx/html

EXPOSE 80 8080

CMD ["nginx", "-g", "daemon off;"]
