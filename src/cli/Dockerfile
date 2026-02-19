FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY bin/ ./bin/
COPY src/ ./src/

RUN npm link

VOLUME ["/root/.osm"]

ENTRYPOINT ["osm"]
CMD ["--help"]
