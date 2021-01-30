// @ts-check

import _ from 'lodash';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  const testData = getTestData();

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.users.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    };
    const user = await models.user.query().findOne({ email: params.email });
    expect(user).toMatchObject(expected);
  });

  it('update', async () => {
    const cookie = await getCookie(app, testData.users.existing)

    const existingUserData = testData.users.existing;
    const { id } = await models.user.query().findOne({ email: existingUserData.email });
    const updatedUserData = testData.users.updated;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('userUpdate', { id }),
      cookies: cookie,
      payload: {
        data: updatedUserData,
      },
    });
    expect(response.statusCode).toBe(302);

    const updatedUser = await models.user.query().findOne({ id });
    const expected = {
      ..._.omit(updatedUserData, 'password'),
      passwordDigest: encrypt(updatedUserData.password),
    };
    expect(updatedUser).toMatchObject(expected);
  });

  it('delete', async () => {
    const cookie = await getCookie(app, testData.users.existing)

    const existingUserData = testData.users.existing;
    const { id } = await models.user.query().findOne({ email: existingUserData.email });
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('userDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedUser = await models.user.query().findOne({ id });
    expect(deletedUser).toEqual(undefined);
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
