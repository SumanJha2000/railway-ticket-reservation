FROM node:18
WORKDIR /src/app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
