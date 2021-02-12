// @ts-check

import getApp from '../server/index.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test statuses CRUD', () => {
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

  it('Get statuses page work', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Can not get statuse page work with unauthorized guest', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('Get statuses create page work', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newStatus'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get statuses edit page work', async () => {
    const exsistingStatusData = testData.statuses.existing;
    const { id } = await models.status.query().findOne({ name: exsistingStatusData.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statusEdit', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Create new status', async () => {
    const expected = testData.statuses.new;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statusCreate'),
      cookies: cookie,
      payload: {
        data: expected,
      },
    });

    expect(response.statusCode).toBe(302);

    const status = await models.status.query().findOne({ name: expected.name });
    expect(status).toMatchObject(expected);
  });

  it('Can not create status with existing name', async () => {
    const exsistingStatusData = testData.statuses.existing;

    const expectedStatuses = await models.status.query();

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statusCreate'),
      cookies: cookie,
      payload: {
        data: exsistingStatusData,
      },
    });

    expect(response.statusCode).toBe(200);

    const updatedStatuses = await models.status.query();
    expect(updatedStatuses).toMatchObject(expectedStatuses);
  });

  it('Edit existing status', async () => {
    const exsistingStatusData = testData.statuses.existing;
    const updatedStatusData = testData.statuses.updated;

    const { id } = await models.status.query().findOne({ name: exsistingStatusData.name });

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('statusUpdate', { id }),
      cookies: cookie,
      payload: {
        data: updatedStatusData,
      },
    });

    expect(response.statusCode).toBe(302);

    const updatedStatus = await models.status.query().findOne({ id });
    expect(updatedStatus).toMatchObject(updatedStatusData);
  });

  it('Delete existing status', async () => {
    const exsistingStatusData = testData.statuses.existing;

    const { id } = await models.status.query().findOne({ name: exsistingStatusData.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('statusDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status.query().findOne({ id });
    expect(deletedStatus).toBeUndefined();
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});