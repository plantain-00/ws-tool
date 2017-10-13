FROM node:alpine
WORKDIR /app
ADD . /app
RUN apk add --no-cache make gcc g++ python && yarn --production
EXPOSE 12345
CMD ["node","proxy.js"]
