FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY db ./db
COPY engine ./engine
COPY src ./src

EXPOSE 4000

CMD ["npm", "start"]
