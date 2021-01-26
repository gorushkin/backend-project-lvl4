FROM node:14

RUN apt-get install -yq libsqlite3-0
RUN curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

WORKDIR /srv/task-manager/

COPY ./package*.json /srv/task-manager/

RUN npm clean-install

# дефолтный порт
# EXPOSE $NODE_PORT

# если копировать тут, то данные будут неизменяемыми (КОПИЯ)
# COPY . .