// @ts-check

import getApp from '../server/index.js';
import { getFixtureData, prepareData } from './helpers/index.js';
import _ from 'lodash';

describe('test filter requests', () => {
  let app;
  let knex;
  let fixtureData;
  let models;

  beforeAll(async () => {
    app = await getApp();
    knex = app.objection.knex;
    await knex.migrate.latest();
    await prepareData(app);
    models = app.objection.models;
    fixtureData = getFixtureData('tasks.json');
  });

  const testData = [
    {
      testName: 'get tasks for creator #1 only',
      relations: [{ name: 'creator', id: 1 }],
    },
    {
      testName: 'get tasks for status #1 only',
      relations: [{ name: 'status', id: 1 }],
    },
    {
      testName: 'get tasks for executor #1 only',
      relations: [{ name: 'executor', id: 1 }],
    },
    {
      testName: 'get tasks for executor #1 and status #2 only',
      relations: [
        { name: 'executor', id: 1 },
        { name: 'status', id: 3 },
      ],
    },
  ];

  test.each(testData.map(({ testName, relations }) => [testName, relations]))(
    '%s',
    async (testName, relations) => {
      const filteredData = relations.map((relation) =>
        fixtureData.filter((task) => task[`${relation.name}Id`] === relation.id).map(({ id }) => id)
      );

      const expected = _.intersection(...filteredData);

      const request = relations.map(({ name, id }) => [`${name}.id`, id]);
      const result = (await models.task.filter(request)).map(({ id }) => id);

      expect(result).toMatchObject(expected);
      // expect(1).toEqual(1);
    }
  );

  afterAll(() => {
    app.close();
  });
});
