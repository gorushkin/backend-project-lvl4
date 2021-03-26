// @ts-check

import getApp from '../server/index.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test relations CRUD', () => {
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
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await getCookie(app, testData.users.another);
  });

  it('Create task with labelId should create only task-label relation', async () => {
    const taskData = testData.tasks.newTaskData;
    const expectedRelatedLabel = testData.labels.relatedNew;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('taskCreate'),
      cookies: cookie,
      payload: {
        data: taskData,
      },
    });

    const { labels } = await models.task
      .query()
      .findOne({ 'tasks.name': taskData.name })
      .withGraphJoined('[creator, executor, status, labels]');

    const [label] = labels.flat();

    expect(response.statusCode).toBe(302);
    expect(label).toMatchObject(expectedRelatedLabel);
  });

  it('Update task with adding labelId relation should add one label relations', async () => {
    const taskData = testData.tasks.existing;
    const expectedRelatedLabelId = testData.labels.relatedAdd;

    const task = await models.task.query().findOne({ 'tasks.name': taskData.name });
    const { id } = task;

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('taskUpdate', { id }),
      cookies: cookie,
      payload: {
        data: { ...taskData, labels: expectedRelatedLabelId },
      },
    });

    const { labels } = await models.task
      .query()
      .findOne({ 'tasks.name': taskData.name })
      .withGraphJoined('[creator, executor, status, labels]');

    labels.forEach(async (label) => {
      const [upatedTask] = await label.$relatedQuery('tasks');
      expect(task).toMatchObject(upatedTask);
    });

    expect(response.statusCode).toBe(302);
  });

  it('Update task with removing labelId relation should removing one label relations', async () => {
    const taskData = testData.tasks.existing;
    const expectedRelatedLabelId = testData.labels.relatedRemove;

    const task = await models.task.query().findOne({ 'tasks.name': taskData.name });
    const { id } = task;

    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('taskUpdate', { id }),
      cookies: cookie,
      payload: {
        data: { ...taskData, labels: expectedRelatedLabelId },
      },
    });

    const { labels } = await models.task
      .query()
      .findOne({ 'tasks.name': taskData.name })
      .withGraphJoined('[creator, executor, status, labels]');

    labels.forEach(async (label) => {
      const [upatedTask] = await label.$relatedQuery('tasks');
      expect(task).toMatchObject(upatedTask);
    });

    expect(response.statusCode).toBe(302);
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
