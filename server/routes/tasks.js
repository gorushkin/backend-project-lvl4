// @ts-check

import i18next from 'i18next';

const getLabelIdList = (labels = []) => {
  const labelIdFormatMatching = {
    string: (id) => [parseInt(id, 10)],
    object: (labelsId) => labelsId.map((id) => parseInt(id, 10)),
  };
  return labelIdFormatMatching[typeof labels](labels);
};

export default (app) => {
  app
    .get('/tasks', { name: 'tasks', preValidation: app.authenticate }, async (req, reply) => {
      // const tasks2 = await app.objection.models.task
      //   .query()
      //   .withGraphJoined('[creator, executor, status]');
      const [tasks, users, statuses, labels] = await Promise.all([
        app.objection.models.task.query().withGraphJoined('[creator, executor, status]'),
        app.objection.models.user.query(),
        app.objection.models.status.query(),
        app.objection.models.label.query(),
      ]);
      reply.render('tasks/index', {
        tasks, users, statuses, labels,
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
            name, description, statusId, executorId, labels,
          },
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
        const labelsId = getLabelIdList(labels);

        await app.objection.models.task.transaction(async (trx) => {
          const { id } = await app.objection.models.task.query(trx).insert(task);

          Promise.all(
            labelsId.map((labelId) => app.objection.models.task.relatedQuery('labels').for(id).relate(labelId)),
          );
        });

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
      },
    )
    .get(
      '/tasks/:id/edit',
      { name: 'taskEdit', preValidation: app.authenticate },
      async (req, reply) => {
        const [task, users, statuses, labels, taskLabels] = await Promise.all([
          app.objection.models.task
            .query()
            .findById(req.params.id),
          app.objection.models.user.query(),
          app.objection.models.status.query(),
          app.objection.models.label.query(),
          (await app.objection.models.task.query().findById(req.params.id)).$relatedQuery('labels'),
        ]);
        const taskLabelId = taskLabels.map(({ id }) => id);
        reply.render('tasks/edit', {
          task,
          users,
          statuses,
          labels,
          taskLabelId,
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
            body: { data },
          } = req;
          const task = await app.objection.models.task.query().findById(req.params.id);
          await task.$query().patch(data);
          req.flash('success', i18next.t('flash.tasks.edit.success'));
          reply.redirect('/tasks');
          return reply;
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.tasks.edit.error'));
          reply.redirect(app.reverse('taskEdit', { id: req.params.id }));
          return reply;
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
        try {
          const task = await app.objection.models.task.query().findById(req.params.id);
          await task.$query().delete();
          await task.$relatedQuery('labels').unrelate();
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.tasks.delete.error'));
        }
        reply.redirect('/tasks');
        return reply;
      },
    );
};
