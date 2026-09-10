FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=4000
EXPOSE 4000

# Run `npm run migrate && npm run seed` once against your target database before
# (or as part of) the first start — see README.md.
CMD ["node", "src/server.js"]
