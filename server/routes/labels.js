// @ts-check

import i18next from 'i18next';
import { getTask } from '../helpers/index.js';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      reply.render('labels/index');
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, (req, reply) => {
      // const status = new app.objection.models.status();
      reply.render('labels/new');
    });
};
