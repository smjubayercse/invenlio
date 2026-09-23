FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.19.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_OIDC_URL=http://localhost:8081
ARG VITE_OIDC_REALM=invenlio
ARG VITE_OIDC_CLIENT_ID=invenlio-web
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_OIDC_URL=$VITE_OIDC_URL VITE_OIDC_REALM=$VITE_OIDC_REALM VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
RUN pnpm build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
