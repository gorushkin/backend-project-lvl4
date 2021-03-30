// @ts-check

import { Model } from 'objection';
import objectionUnique from 'objection-unique';
import path from 'path';
import _ from 'lodash';

const unique = objectionUnique({ fields: ['name'] });
export default class Status extends unique(Model) {
  $parseJson(json, options) {
    const parsed = super.$parseJson(json, options);
    return {
      ...parsed,
      ...(parsed.name && { name: _.trim(parsed.name) }),
    };
  }

  static get tableName() {
    return 'statuses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'Task'),
        join: {
          from: 'statuses.id',
          to: 'tasks.statusId',
        },
      },
    };
  }
}
