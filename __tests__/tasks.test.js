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
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await getCookie(app, testData.users.another);
  });

  it('User can create new task', async () => {
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

  it('User can delete existing task', async () => {
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

  it('User can not delete task that belongs to anothet user', async () => {
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

  const templatesTestsData = [
    {
      testName: 'Get status code 200 on /tasks',
      testUrl: (server) => server.reverse('tasks'),
      isAuthenticated: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 200 on /tasks/new',
      testUrl: (server) => server.reverse('taskNew'),
      isAuthenticated: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 200 on /tasks/:id/edit',
      testUrl: (server, id) => server.reverse('taskEdit', { id }),
      isAuthenticated: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 200 on /tasks/:id',
      testUrl: (server, id) => server.reverse('taskDetails', { id }),
      isAuthenticated: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 302 with unauthorized request',
      testUrl: (server) => server.reverse('tasks'),
      isAuthenticated: false,
      statusCode: 302,
    },
  ];

  describe('templates test', () => {
    test.each(
      templatesTestsData.map(({
        testName, testUrl, isAuthenticated, statusCode,
      }) => [
        testName,
        testUrl,
        isAuthenticated,
        statusCode,
      ]),
    )('%s,', async (_, testUrl, isAuthenticated, statusCode) => {
      const exsistingTaskData = testData.tasks.existing;
      const { id } = await models.task.query().findOne({ name: exsistingTaskData.name });

      const response = await app.inject({
        method: 'GET',
        url: testUrl(app, id),
        cookies: isAuthenticated ? cookie : { session: '' },
      });

      expect(response.statusCode).toBe(statusCode);
    });
  });

  const patchTaskTestsData = [
    {
      testName: 'Update existing task with name only',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withNameOnlyUpdated,
      payloadData: (data) => ({ ...testData.tasks.existing, name: data.name }),
      expectedData: testData.tasks.withNameOnlyUpdated,
    },
    {
      testName: 'Update existing task with executor only',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withExecutorOnlyUpdated,
      payloadData: (data) => ({ ...testData.tasks.existing, executorId: data.executorId }),
      expectedData: testData.tasks.withExecutorOnlyUpdated,
    },
    {
      testName: 'Update existing task with status only',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withStatusOnlyUpdated,
      payloadData: (data) => ({ ...testData.tasks.existing, statusId: data.statusId }),
      expectedData: testData.tasks.withStatusOnlyUpdated,
    },
    {
      testName: 'Update existing task with all fields',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.fullyUpdated,
      payloadData: (data) => data,
      expectedData: testData.tasks.fullyUpdated,
    },
    {
      testName: 'is not possible to update creatorId',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withCreatorOnlyUpdated,
      payloadData: (data) => ({ ...testData.tasks.existing, creatorId: data.creatorId }),
      expectedData: testData.tasks.existing,
    },
  ];

  describe('patch tests', () => {
    test.each(
      patchTaskTestsData.map(
        ({
          testName, testData: initialData, updatedTestData, payloadData, expectedData,
        }) => [
          testName,
          initialData,
          updatedTestData,
          payloadData,
          expectedData,
        ],
      ),
    )('%s', async (_, initialData, updatedTestData, payloadData, expectedData) => {
      const { id } = await models.task.query().findOne({ name: initialData.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('taskUpdate', { id }),
        cookies: cookie,
        payload: {
          data: payloadData(updatedTestData),
        },
      });

      expect(response.statusCode).toBe(302);

      const updatedTask = await models.task.query().findById(id);
      expect(updatedTask).toMatchObject(expectedData);
    });
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  afterAll(() => {
    app.close();
  });
});
