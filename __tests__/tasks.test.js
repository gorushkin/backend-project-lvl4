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
    const existingTaskData = testData.tasks.existing;
    const { id } = await models.task.query().findOne({ name: existingTaskData.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('taskDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedTask = await models.task.query().findById(id);
    expect(deletedTask).toBeUndefined();
  });

  it('User can not delete task that belongs to another user', async () => {
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
      getTestURL: (server) => server.reverse('tasks'),
      shouldUseAuthentification: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 200 on /tasks/new',
      getTestURL: (server) => server.reverse('taskNew'),
      shouldUseAuthentification: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 200 on /tasks/:id/edit',
      getTestURL: (server, id) => server.reverse('taskEdit', { id }),
      shouldUseAuthentification: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 200 on /tasks/:id',
      getTestURL: (server, id) => server.reverse('taskShow', { id }),
      shouldUseAuthentification: true,
      statusCode: 200,
    },
    {
      testName: 'Get status code 302 with unauthorized request',
      getTestURL: (server) => server.reverse('tasks'),
      shouldUseAuthentification: false,
      statusCode: 302,
    },
  ];

  describe('GET request test', () => {
    test.each(
      templatesTestsData.map(({
        testName, getTestURL, shouldUseAuthentification, statusCode,
      }) => [
        testName,
        getTestURL,
        shouldUseAuthentification,
        statusCode,
      ]),
    )('%s,', async (_, getTestURL, shouldUseAuthentification, statusCode) => {
      const existingTaskData = testData.tasks.existing;
      const { id } = await models.task.query().findOne({ name: existingTaskData.name });

      const response = await app.inject({
        method: 'GET',
        url: getTestURL(app, id),
        cookies: shouldUseAuthentification ? cookie : { session: '' },
      });

      expect(response.statusCode).toBe(statusCode);
    });
  });

  const patchTaskTestsData = [
    {
      testName: 'Update existing task with name only',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withNameOnlyUpdated,
      getPayloadData: (data) => ({ ...testData.tasks.existing, name: data.name }),
      expectedData: testData.tasks.withNameOnlyUpdated,
    },
    {
      testName: 'Update existing task with executor only',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withExecutorOnlyUpdated,
      getPayloadData: (data) => ({ ...testData.tasks.existing, executorId: data.executorId }),
      expectedData: testData.tasks.withExecutorOnlyUpdated,
    },
    {
      testName: 'Update existing task with status only',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withStatusOnlyUpdated,
      getPayloadData: (data) => ({ ...testData.tasks.existing, statusId: data.statusId }),
      expectedData: testData.tasks.withStatusOnlyUpdated,
    },
    {
      testName: 'Update existing task with all fields',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.fullyUpdated,
      getPayloadData: (data) => data,
      expectedData: testData.tasks.fullyUpdated,
    },
    {
      testName: 'is not possible to update creatorId',
      testData: testData.tasks.existing,
      updatedTestData: testData.tasks.withCreatorOnlyUpdated,
      getPayloadData: (data) => ({ ...testData.tasks.existing, creatorId: data.creatorId }),
      expectedData: testData.tasks.existing,
    },
  ];

  describe('Task update tests', () => {
    test.each(
      patchTaskTestsData.map(
        ({
          testName, testData: initialData, updatedTestData, getPayloadData, expectedData,
        }) => [
          testName,
          initialData,
          updatedTestData,
          getPayloadData,
          expectedData,
        ],
      ),
    )('%s', async (_, initialData, updatedTestData, getPayloadData, expectedData) => {
      const { id } = await models.task.query().findOne({ name: initialData.name });
      const response = await app.inject({
        method: 'PATCH',
        url: app.reverse('taskUpdate', { id }),
        cookies: cookie,
        payload: {
          data: getPayloadData(updatedTestData),
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
