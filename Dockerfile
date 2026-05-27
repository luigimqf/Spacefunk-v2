FROM node:20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN apt-get autoremove -y

CMD [ "node", "src/main.js" ]