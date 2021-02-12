// @ts-check

import { Model } from 'objection';
import objectionUnique from 'objection-unique';

const unique = objectionUnique({ fields: ['name'] });

export default class Task extends unique(Model) {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'creator_id', 'status_id'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'text' },
        creator_id: { type: 'integer' },
        status_id: { type: 'integer' },
        executor_Id: { type: 'integer' },
        isComplete: { type: 'boolean', default: false },
      },
    };
  }

  static get relationMappings() {
    const User = require('./User');
    const Status = require('./Status');

    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creator_id',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executor_id',
          to: 'users.id',
        },
      },
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: Status,
        join: {
          from: 'tasks.status_id',
          to: 'statuses.id',
        },
      },
    };
  }
}