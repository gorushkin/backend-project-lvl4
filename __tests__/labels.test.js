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
    cookie = await getCookie(app, testData.users.another);
  });

  it('Get labels page work', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get labels create page work', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get labels edit page work', async () => {
    const exsistingLabelData = testData.labels.existing;
    const { id } = await models.label.query().findOne({ name: exsistingLabelData.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labelEdit', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Create new label', async () => {
    const expected = testData.labels.new;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labelCreate'),
      cookies: cookie,
      payload: {
        data: expected,
      },
    });

    expect(response.statusCode).toBe(302);

    const label = await models.label.query().findOne({ name: expected.name });
    expect(label).toMatchObject(expected);
  });

  it('Edit existing label', async () => {
    const exsistingLabelData = testData.labels.existing;
    const updatedLabelData = testData.labels.updated;

    const { id } = await models.label.query().findOne({ name: exsistingLabelData.name });

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('labelUpdate', { id }),
      cookies: cookie,
      payload: {
        data: updatedLabelData,
      },
    });

    expect(response.statusCode).toBe(302);

    const updatedStatus = await models.label.query().findOne({ id });
    expect(updatedStatus).toMatchObject(updatedLabelData);
  });

  it('Delete existing label', async () => {
    const exsistingLabelData = testData.labels.existing;

    const { id } = await models.label.query().findOne({ name: exsistingLabelData.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('labelsDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.label.query().findOne({ id });
    expect(deletedStatus).toBeUndefined();
  });

  it('add relations', async () => {
    const taskData = testData.tasks.existingWithLabels;
    const expected = testData.labels.related;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('taskCreate'),
      cookies: cookie,
      payload: {
        data: { ...taskData, labels: expected.id },
      },
    });

    const [label] = (
      await models.task.query().findOne({ 'tasks.name': taskData.name }).withGraphJoined('labels')
    ).labels.flat();

    expect(response.statusCode).toBe(302);
    expect(label).toMatchObject(expected);
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
