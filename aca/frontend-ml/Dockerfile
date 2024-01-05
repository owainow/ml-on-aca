# pull the official base image
FROM node:18-alpine
# set working direction
WORKDIR ./
# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
# install application dependencies
COPY package.json ./
COPY package-lock.json ./
COPY public ./public
COPY src ./src
RUN npm i
# add app
COPY . ./
# start app
CMD ["npm", "start"]