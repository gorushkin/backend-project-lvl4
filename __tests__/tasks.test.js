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

  it('Get status code 200 on /tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get status code 200 on /tasks/new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get status code 200 on /tasks/:id/edit', async () => {
    const exsistingTaskData = testData.tasks.existing;
    const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('taskEdit', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get status code 200 on /tasks/:id', async () => {
    const exsistingTaskData = testData.tasks.existing;
    const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('taskDetails', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('Get status code 302 with unauthorized request', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
    });

    expect(response.statusCode).toBe(302);
  });

  it('Create new task', async () => {
    const expected = testData.tasks.new;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('taskCreate'),
      cookies: cookie,
      payload: {
        data: expected,
      },
    });

    expect(response.statusCode).toBe(302);

    const newTask = await models.task.query().findOne({ name: expected.name });
    expect(newTask).toMatchObject(expected);
  });

  it('Edit existing status', async () => {
    const exsistingTaskData = testData.tasks.existing;
    const updatedTaskData = testData.tasks.updated;

    const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('taskUpdate', { id }),
      cookies: cookie,
      payload: {
        data: updatedTaskData,
      },
    });

    expect(response.statusCode).toBe(302);

    const updatedTask = await models.task.query().findById(id);
    expect(updatedTask).toMatchObject(updatedTaskData);
  });

  it('Delete existing task', async () => {
    const exsistingTaskData = testData.tasks.existing;
    const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('taskDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedTask = await models.task.query().findById(id);
    expect(deletedTask).toBeUndefined();
  });

  it('Can not delete task that belongs to anothet user', async () => {
    const anotherTaskData = testData.tasks.another;
    const anotherTask = await models.task.query().findOne({ name: anotherTaskData.name });
    const { id } = anotherTask;
    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('taskDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const undeletedTask = await models.task.query().findById(id);
    expect(anotherTask).toMatchObject(undeletedTask);
  });

  it('remove relations', async () => {
    const exsistingTaskData = testData.tasks.existing;
    const relatedLabel = testData.labels.related;
    const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('taskDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const [deletedRelations] = (
      await models.label.query().findById(relatedLabel.id).withGraphJoined('tasks')
    ).tasks;

    expect(deletedRelations).toBeUndefined();
  });

  afterEach(async () => {
    // после каждого теста откатываем миграции
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
