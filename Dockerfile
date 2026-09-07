FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/
COPY . .

RUN npm run build

EXPOSE 3333

CMD ["npm", "run", "start:prod"]