FROM node:16-alpine
WORKDIR /app
COPY package.json .
COPY *.lock .
RUN yarn install --production
CMD ["yarn", "start"]
