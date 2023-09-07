FROM node:20.6.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install express body-parser sharp multer got showdown --save
RUN npm install --save-dev nodemon
RUN npm install color --save

COPY . .

#CMD ["npm", "start"]