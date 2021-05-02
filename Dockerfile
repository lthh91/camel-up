# build
FROM node:15.7.0-alpine3.10 as build-vue
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend/vue-socketio.js ./node_modules/vue-3-socket.io/dist/vue-socketio.js
COPY ./frontend .
RUN npm run build

# production
FROM nginx:stable-alpine as production
WORKDIR /app
RUN apk update && apk add --no-cache python3 g++ && \
    python3 -m ensurepip && \
    rm -r /usr/lib/python*/ensurepip && \
    pip3 install --upgrade pip setuptools && \
    if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi && \
    if [[ ! -e /usr/bin/python ]]; then ln -sf /usr/bin/python3 /usr/bin/python; fi && \
    rm -r /root/.cache
RUN apk update && apk add postgresql-dev gcc python3-dev musl-dev
COPY --from=build-vue /app/dist /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY ./requirements.txt .
RUN pip install -r requirements.txt
RUN pip install gunicorn
COPY ./backend backend/
COPY ./game_logic game_logic/
# replace $PORT in the default.conf file with the env var PORT supplied by Heroku.
CMD gunicorn -b 0.0.0.0:5000 "backend:create_app()" --worker-class eventlet --daemon && \
      sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && \
      nginx -g 'daemon off;'
