// @ts-check

import i18next from 'i18next';
import { getTask } from '../helpers/index.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const tasks = await app.objection.models.task
        .query()
        .select(
          'tasks.id',
          'tasks.name',
          'tasks.description',
          'statuses.name as statusName',
          'creator.firstname as creatorFirstName',
          'creator.lastname as creatorLastName',
          'executor.firstname as executorFirstName',
          'executor.lastname as executorLastname',
          'tasks.createdAt'
        )
        .innerJoin('statuses', 'statuses.id', 'tasks.statusId')
        .innerJoin('users as creator', 'creator.id', 'tasks.creatorId')
        .innerJoin('users as executor', 'executor.id', 'tasks.executorId');
      reply.render('tasks/index', { tasks: tasks });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const users = await app.objection.models.user.query();
      const statuses = await app.objection.models.status.query();
      reply.render('tasks/new', { task, users, statuses });
    })
    .post('/tasks', { name: 'taskCreate', preValidation: app.authenticate }, async (req, reply) => {
      const { name, description, statusId: statusId, executorId: executorId } = req.body.data;
      try {
        const data = {
          name,
          description,
          status_id: parseInt(statusId, 10),
          creator_id: req.user.id,
          executor_id: parseInt(executorId, 10),
        };
        const task = await app.objection.models.task.fromJson(data);
        await app.objection.models.task.query().insert(task);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.task.create.error'));
        reply.render('/tasks/new', { task: req.body.data, errors: data });
        return reply;
      }
    })
    .get(
      '/tasks/:id',
      { name: 'taskDetails', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const task = await getTask(app, req.params.id);
          if (!task) {
            throw Error('There is no task with such parametrs');
          }
          reply.render('tasks/details', { task });
          return reply;
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.tasks.detailsError'));
          reply.redirect(app.reverse('tasks'));
          return reply;
        }
      }
    )
    .get(
      '/tasks/:id/edit',
      { name: 'taskEdit', preValidation: app.authenticate },
      async (req, reply) => {
        const task = await getTask(app, req.params.id);
        const users = await app.objection.models.user.query();
        const statuses = await app.objection.models.status.query();
        reply.render('tasks/edit', { task, users, statuses });
        return reply;
      }
    );
};
