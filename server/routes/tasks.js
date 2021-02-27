// @ts-check

import i18next from 'i18next';
import _ from 'lodash';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const tasks = await app.objection.models.task
        .query()
        .withGraphJoined('[creator, executor, status]');
      reply.render('tasks/index', { tasks });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const [users, statuses, labels] = await Promise.all([
        app.objection.models.user.query(),
        app.objection.models.status.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('tasks/new', {
        task,
        users,
        statuses,
        labels,
      });
    })
    .post('/tasks', { name: 'taskCreate', preValidation: app.authenticate }, async (req, reply) => {
      console.log(req.body.data);
      const {
        body: {
          data: { name, description, statusId, executorId, labels = [] },
        },
      } = req;

      try {
        const data = {
          name,
          description,
          status_id: parseInt(statusId, 10),
          creator_id: req.user.id,
          executor_id: parseInt(executorId, 10),
        };

        const task = await app.objection.models.task.fromJson(data);
        const labelIds = [labels].flat().map((id) => ({ id: parseInt(id, 10) }));

        await app.objection.models.task.query().insertGraph([{ ...task, labels: labelIds }], {
          relate: ['labels'],
        });

        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.tasks.create.error'));
        const [users, statuses, labels] = await Promise.all([
          app.objection.models.user.query(),
          app.objection.models.status.query(),
          app.objection.models.label.query(),
        ]);
        reply.render('/tasks/new', { task: req.body.data, users, statuses, labels, errors: data });
        return reply;
      }
    })
    .get(
      '/tasks/:id',
      { name: 'taskDetails', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const task = await app.objection.models.task
            .query()
            .findById(req.params.id)
            .withGraphJoined('[creator, executor, status, labels]');
          if (!task) {
            req.flash('error', i18next.t('flash.tasks.detailsError'));
            reply.redirect(app.reverse('tasks'));
          } else {
            reply.render('tasks/details', { task });
          }
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
        const [task, users, statuses, labels] = await Promise.all([
          app.objection.models.task.query().findById(req.params.id).withGraphJoined('labels'),
          app.objection.models.user.query(),
          app.objection.models.status.query(),
          app.objection.models.label.query(),
        ]);
        reply.render('tasks/edit', {
          task,
          users,
          statuses,
          labels,
        });
        return reply;
      }
    )
    .patch(
      '/tasks/:id',
      { name: 'taskUpdate', preValidation: app.authenticate },
      async (req, reply) => {
        // try {
          const {
            body: { data },
          } = req;
          const labels = data.labels || [];
          const labelIds = [labels].flat().map((id) => parseInt(id, 10));
          const task = await app.objection.models.task.query().findById(req.params.id);
          console.log('task: ', task);
          // await app.objection.models.task.transaction(async (trx) => {
          //   await Promise.all([
          //     task.$query(trx).patch(data),
          //     task.$relatedQuery('labels', trx).unrelate(),
          //     Promise.all(
          //       labelIds.map((labelId) => task.$relatedQuery('labels', trx).relate(labelId))
          //     ),
          //   ]);
          // });
          console.log(req.params.id);
          await app.objection.models.task.query().upsertGraph({
            id: req.params.id,
            ...data,
          });
          req.flash('success', i18next.t('flash.tasks.edit.success'));
          reply.redirect('/tasks');
          return reply;
        // } catch ({ data }) {
        //   req.flash('error', i18next.t('flash.tasks.edit.error'));
        //   reply.redirect(app.reverse('taskEdit', { id: req.params.id }));
        //   return reply;
        // }
      }
    )
    .delete(
      '/tasks/:id',
      {
        name: 'taskDelete',
        preValidation: app.auth([app.checkIfUserCreatedTask, app.authenticate]),
      },
      async (req, reply) => {
        try {
          const task = await app.objection.models.task.query().findById(req.params.id);
          await app.objection.models.task.transaction(async (trx) => {
            await task
              .$relatedQuery('labels', trx)
              .unrelate()
              .then(() => task.$query(trx).delete());
          });
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.tasks.delete.error'));
        }
        reply.redirect('/tasks');
        return reply;
      }
    );
};
