// @ts-check

import getApp from '../server/index.js';
import { getTestData, prepareData, getCookie } from './helpers/index.js';

describe('test relations CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();
  let labels;
  let statuses;
  let users;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await getCookie(app, testData.users.another);
    labels = await models.label.query();
    statuses = await models.status.query();
    users = await models.user.query();
  });

  it('Create task with labelId should create only task-label relation', async () => {
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

    const afterTaskCreatingLabels = await models.label.query();
    const afterTaskCreatingStatuses = await models.status.query();
    const afterTaskCreatingUsers = await models.user.query();

    expect(users).toMatchObject(afterTaskCreatingUsers);
    expect(labels).toMatchObject(afterTaskCreatingLabels);
    expect(statuses).toMatchObject(afterTaskCreatingStatuses);
    expect(response.statusCode).toBe(302);
    expect(label).toMatchObject(expected);
  });

  it('Remove task with labelId should delete ONLY task-label relation', async () => {
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

    const afterTaskDeletingLabels = await models.label.query();
    const afterTaskDeletingUsers = await models.user.query();
    const afterTaskDeletingStatuses = await models.status.query();

    expect(users).toMatchObject(afterTaskDeletingUsers);
    expect(labels).toMatchObject(afterTaskDeletingLabels);
    expect(statuses).toMatchObject(afterTaskDeletingStatuses);
    expect(labels).toMatchObject(afterTaskDeletingLabels);
    expect(deletedRelations).toBeUndefined();
  });

  it('Update task with labelId should update ONLY task-label relation', async () => {
    const exsistingTaskData = testData.tasks.existing;
    const expected = testData.labels.related;
    const dataForFirstTaskUpdating = testData.tasks.withLabelsUpdated1;
    const dataForSecondTaskUpdating = testData.tasks.withLabelsUpdated2;
    const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

    await app.inject({
      method: 'PATCH',
      url: app.reverse('taskUpdate', { id }),
      cookies: cookie,
      payload: {
        data: dataForFirstTaskUpdating,
      },
    });

    await app.inject({
      method: 'PATCH',
      url: app.reverse('taskUpdate', { id }),
      cookies: cookie,
      payload: {
        data: dataForSecondTaskUpdating,
      },
    });

    const afterTaskUpdatingLabels = await models.label.query();
    const afterTaskUpdatingStatuses = await models.status.query();
    const afterTaskUpdatingUsers = await models.user.query();

    const [label] = (
      await models.task.query().findById(id).withGraphJoined('labels')
    ).labels.flat();

    expect(users).toMatchObject(afterTaskUpdatingUsers);
    expect(statuses).toMatchObject(afterTaskUpdatingStatuses);
    expect(label).toMatchObject(expected);
    expect(labels).toMatchObject(afterTaskUpdatingLabels);
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
