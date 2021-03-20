// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      const {
        query,
        user: { id },
      } = req;

      const tasksQuery = app.objection.models.task
        .query()
        .withGraphJoined('[creator, executor, status, labels]');

      if (query.executor) {
        tasksQuery.modify('filterExecutor', query.executor);
      }

      if (query.status) {
        tasksQuery.modify('filterStatus', query.status);
      }

      if (query.label) {
        tasksQuery.modify('filterLabel', query.label);
      }

      if (query.isCreatorUser) {
        tasksQuery.modify('filterCreator', { isCreatorUser: id });
      }

      const [tasks, users, statuses, labels] = await Promise.all([
        tasksQuery,
        app.objection.models.user.query(),
        app.objection.models.status.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('tasks/index', {
        tasks,
        users,
        statuses,
        labels,
        query,
      });
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
      const {
        body: {
          data: {
            name, description, statusId, executorId, labels = [],
          },
        },
      } = req;

      try {
        const data = {
          name,
          description,
          creatorId: req.user.id,
        };

        if (statusId) {
          data.statusId = parseInt(statusId, 10);
        }

        if (executorId) {
          data.executorId = parseInt(executorId, 10);
        }

        const task = await app.objection.models.task.fromJson(data);
        const labelIds = [labels].flat().map((id) => ({ id: parseInt(id, 10) }));

        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).insertGraph([{ ...task, labels: labelIds }], {
            relate: ['labels'],
          });
        });

        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        if (error instanceof app.objection.models.task.ValidationError) {
          req.flash('error', i18next.t('flash.tasks.create.error'));
          const [users, statuses, labelList] = await Promise.all([
            app.objection.models.user.query(),
            app.objection.models.status.query(),
            app.objection.models.label.query(),
          ]);
          reply.render('/tasks/new', {
            task: req.body.data,
            users,
            statuses,
            labels: labelList,
            errors: error.data,
          });
          return reply;
        }
        throw error;
      }
    })
    .get(
      '/tasks/:id',
      { name: 'taskDetails', preValidation: app.authenticate },
      async (req, reply) => {
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
      },
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
      },
    )
    .patch(
      '/tasks/:id',
      { name: 'taskUpdate', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const {
            body: {
              data: {
                name, executorId, statusId, description, labels = [],
              },
            },
          } = req;

          const labelIds = [labels].flat().map((id) => ({ id: parseInt(id, 10) }));

          const data = {
            name,
            description,
            labels: labelIds,
            id: parseInt(req.params.id, 10),
          };

          if (statusId) {
            data.statusId = parseInt(statusId, 10);
          }

          if (executorId) {
            data.executorId = parseInt(executorId, 10);
          }

          await app.objection.models.task.transaction(async (trx) => {
            await app.objection.models.task.query(trx).upsertGraph(
              data,
              {
                relate: true,
                unrelate: true,
              },
            );
          });
          req.flash('success', i18next.t('flash.tasks.edit.success'));
          reply.redirect('/tasks');
          return reply;
        } catch (error) {
          if (error instanceof app.objection.models.task.ValidationError) {
            req.flash('error', i18next.t('flash.tasks.edit.error'));
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
              errors: error.data,
            });

            return reply;
          }
          throw error;
        }
      },
    )
    .delete(
      '/tasks/:id',
      {
        name: 'taskDelete',
        preValidation: app.auth([app.checkIfUserCreatedTask, app.authenticate]),
      },
      async (req, reply) => {
        const task = await app.objection.models.task.query().findById(req.params.id);
        await app.objection.models.task.transaction(async (trx) => {
          await task
            .$relatedQuery('labels', trx)
            .unrelate()
            .then(() => task.$query(trx).delete());
        });
        req.flash('info', i18next.t('flash.tasks.delete.success'));
        reply.redirect('/tasks');
        return reply;
      },
    );
};
