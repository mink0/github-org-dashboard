FROM node:12-alpine

ARG APP_DIR=/app
WORKDIR ${APP_DIR}

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV GITHUB_ORG github

ENV PORT 3000
ENV HOST 0.0.0.0
ENV NODE_ENV production

EXPOSE 3000

CMD ["npm", "run", "start"]
