// @ts-check

import path from 'path';
import { Model } from 'objection';
import _ from 'lodash';

export default class Task extends Model {
  $parseJson(json, options) {
    const parsed = super.$parseJson(json, options);
    return {
      ...parsed,
      ...(parsed.name && { name: _.trim(parsed.name) }),
      ...(parsed.description && { description: _.trim(parsed.description) }),
      ...(parsed.creatorId && { creatorId: parsed.creatorId }),
      ...(parsed.statusId && { statusId: parseInt(parsed.statusId, 10) }),
      ...(parsed.id && { id: parseInt(parsed.id, 10) }),
      ...(parsed.executorId && { executorId: parseInt(parsed.executorId, 10) }),
      ...(parsed.labels && {
        labels: [parsed.labels].flatMap((labelId) => ({ id: parseInt(labelId, 10) })),
      }),
    };
  }

  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'creatorId', 'statusId'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'text' },
        creatorId: { type: 'integer' },
        statusId: { type: 'integer' },
        executorId: { type: 'integer' },
      },
    };
  }

  static get relationMappings() {
    return {
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User'),
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User'),
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'Status'),
        join: {
          from: 'tasks.statusId',
          to: 'statuses.id',
        },
      },
      labels: {
        relation: Model.ManyToManyRelation,
        modelClass: path.join(__dirname, 'Label'),
        join: {
          from: 'tasks.id',
          through: {
            from: 'tasks_labels.taskId',
            to: 'tasks_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }

  static modifiers = {
    filterCreator(query, id) {
      query.where('creatorId', id);
    },

    filterExecutor(query, id) {
      query.where('executorId', id);
    },

    filterStatus(query, id) {
      query.where('statusId', id);
    },

    filterLabel(query, id) {
      query.where('labels.id', id);
    },
  };
}
