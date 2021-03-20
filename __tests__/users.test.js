// @ts-check

import _ from 'lodash';
import getApp from '../server/index.js';
import encrypt from '../server/lib/secure.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
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
    cookie = await getCookie(app, testData.users.existing);
  });

  it('Users page status code is 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('New user creating page status code is 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('User updating page status code is 200', async () => {
    const existingUserData = testData.users.existing;
    const { id } = await models.user.query().findOne({ email: existingUserData.email });
    const response = await app.inject({
      method: 'GET',
      url: `/users/${id}/edit`,
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Anyone can create new user profile', async () => {
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

  it('User can update his user data', async () => {
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

    const updatedUser = await models.user.query().findById(id);
    const expected = {
      ..._.omit(updatedUserData, 'password'),
      passwordDigest: encrypt(updatedUserData.password),
    };
    expect(updatedUser).toMatchObject(expected);
  });

  it('User can not edit another user data', async () => {
    const existingUserData = testData.users.existing;
    const anotherUserData = testData.users.another;
    const user = await models.user.query().findOne({ email: anotherUserData.email });
    const { id } = user;

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('userEdit', { id }),
      cookies: cookie,
      payload: {
        data: existingUserData,
      },
    });
    expect(response.statusCode).toBe(302);

    const notUpdatedUser = await models.user.query().findById(id);
    const expected = {
      ..._.omit(notUpdatedUser, 'password'),
      passwordDigest: encrypt(anotherUserData.password),
    };
    expect(notUpdatedUser).toMatchObject(expected);
  });

  it('User can not patch another user profile', async () => {
    const existingUserData = testData.users.existing;
    const anotherUserData = testData.users.another;
    const user = await models.user.query().findOne({ email: anotherUserData.email });
    const { id } = user;

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('userUpdate', { id }),
      cookies: cookie,
      payload: {
        data: existingUserData,
      },
    });

    expect(response.statusCode).toBe(302);

    const notUpdatedUser = await models.user.query().findById(id);
    const expected = {
      ..._.omit(notUpdatedUser, 'password'),
      passwordDigest: encrypt(anotherUserData.password),
    };
    expect(notUpdatedUser).toMatchObject(expected);
  });

  it('User can delete his user profile', async () => {
    const existingUserData = testData.users.existing;
    const { id } = await models.user.query().findOne({ email: existingUserData.email });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('userDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedUser = await models.user.query().findById(id);
    expect(deletedUser).toEqual(undefined);
  });

  it('User can not delete another user profile', async () => {
    const anotherUserData = testData.users.another;
    const anotherUser = await models.user.query().findOne({ email: anotherUserData.email });
    const { id } = anotherUser;

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('userDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const unDeletedUser = await models.user.query().findById(id);
    expect(anotherUser).toMatchObject(unDeletedUser);
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
