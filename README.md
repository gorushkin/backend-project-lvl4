### Hexlet tests and linter status:
[![Actions Status](https://github.com/gorushkin/backend-project-lvl4/workflows/hexlet-check/badge.svg)](https://github.com/gorushkin/backend-project-lvl4/actions) ![Node.js CI](https://github.com/gorushkin/backend-project-lvl4/workflows/Node.js%20CI/badge.svg) [![Maintainability](https://api.codeclimate.com/v1/badges/420a707da8e17c8880cc/maintainability)](https://codeclimate.com/github/gorushkin/backend-project-lvl4/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/420a707da8e17c8880cc/test_coverage)](https://codeclimate.com/github/gorushkin/backend-project-lvl4/test_coverage)

[ссылка на приложение](https://enigmatic-headland-83386.herokuapp.com/)



## Обычная разработка

* make setup - Установка зависимостей
* make build - Сборка приложения
* make start - Запуск приложения

## Разработка в докере

* make compose-setup Установка
* make compose-build - пересборка контейнера
* make compose-app-setup - установка необходимых зависимостей
* make compose-app-build - сборка приложения
* make compose - запуск контейнера
* make compose-test - тесты приложения в контейнере