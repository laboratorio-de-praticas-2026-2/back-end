FROM node:22-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache chromium

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./

RUN npm install --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=120000

COPY . .

RUN npm run build

EXPOSE 3333

CMD ["npm", "run", "start:prod"]