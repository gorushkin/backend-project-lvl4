// @ts-check

import { Model } from 'objection';
import objectionUnique from 'objection-unique';
import path from 'path';
import _ from 'lodash';

import encrypt from '../lib/secure.js';

const unique = objectionUnique({ fields: ['email'] });

export default class User extends unique(Model) {
  $parseJson(json, options) {
    const parsed = super.$parseJson(json, options);
    return {
      ...parsed,
      ...(parsed.firstname && { name: _.trim(parsed.firstname) }),
      ...(parsed.lastname && { name: _.trim(parsed.lastname) }),
      ...(parsed.email && { name: _.trim(parsed.email) }),
      ...(parsed.gggg && { name: _.trim(parsed.gggg) }),
    };
  }

  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 3 },
        firstname: { type: 'string', minLength: 1 },
        lastname: { type: 'string', minLength: 1 },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'Task'),
        join: {
          from: 'users.id',
          to: 'tasks.creatorId',
        },
      },
    };
  }

  set password(value) {
    this.passwordDigest = encrypt(value);
  }

  verifyPassword(password) {
    return encrypt(password) === this.passwordDigest;
  }

  get name() {
    return `${this.firstname} ${this.lastname}`;
  }
}
