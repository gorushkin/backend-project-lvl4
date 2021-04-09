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
      .withGraphJoined('labels');

    const newTask = await models.task.query().findOne({ 'tasks.name': taskData.name });

    // Добавил исключение для правил чтобы jest правильно поймал ошибку внутри цикла
    // eslint-disable-next-line no-restricted-syntax
    for (const label of labels) {
      // eslint-disable-next-line no-await-in-loop
      const [fromRelationsTask] = await label.$relatedQuery('tasks');
      expect(newTask).toMatchObject(fromRelationsTask);
    }

    expect(response.statusCode).toBe(302);
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
      .withGraphJoined('labels');

    // Добавил исключение для правил чтобы jest правильно поймал ошибку внутри цикла
    // eslint-disable-next-line no-restricted-syntax
    for (const label of labels) {
      // eslint-disable-next-line no-await-in-loop
      const [updatedTask] = await label.$relatedQuery('tasks');
      expect(task).toMatchObject(updatedTask);
    }

    expect(response.statusCode).toBe(302);
  });

  it('Update task with removing labelId relation should removing one label relations', async () => {
    const taskData = testData.tasks.existing;
    const expectedRelatedLabelId = testData.labels.relatedRemove;
    const labelRemovedFromRelation = testData.labels.relatedRemovedlabel;

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
      .withGraphJoined('labels');

    const labelWithRemovedTaskRealation = await models.label.query()
      .findById(labelRemovedFromRelation.id);

    const [taskFromRemovedRelation] = await labelWithRemovedTaskRealation.$relatedQuery('tasks');

    expect(taskFromRemovedRelation).toBeUndefined();

    // Добавил исключение для правил чтобы jest правильно поймал ошибку внутри цикла
    // eslint-disable-next-line no-restricted-syntax
    for (const label of labels) {
      // eslint-disable-next-line no-await-in-loop
      const [updatedTask] = await label.$relatedQuery('tasks');
      expect(task).toMatchObject(updatedTask);
    }

    expect(response.statusCode).toBe(302);
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
