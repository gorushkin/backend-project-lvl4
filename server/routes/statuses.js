// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'newStatus', preValidation: app.authenticate }, (req, reply) => {
      const status = new app.objection.models.status();
      reply.render('statuses/new', { status });
    })
    .post(
      '/statuses',
      { name: 'statusCreate', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const status = await app.objection.models.status.fromJson(req.body.data);
          await app.objection.models.status.query().insert(status);
          req.flash('info', i18next.t('flash.statuses.create.success'));
          reply.redirect(app.reverse('statuses'));
          return reply;
        } catch (error) {
          if (error instanceof app.objection.models.status.ValidationError) {
            req.flash('error', i18next.t('flash.statuses.create.error'));
            reply.render('/statuses/new', { status: req.body.data, errors: error.data });
            return reply;
          }
          throw error;
        }
      },
    )
    .get(
      '/statuses/:id/edit',
      { name: 'statusEdit', preValidation: app.authenticate },
      async (req, reply) => {
        const status = await app.objection.models.status.query().findById(req.params.id);
        reply.render('statuses/edit', { status });
        return reply;
      },
    )
    .patch(
      '/statuses/:id',
      { name: 'statusUpdate', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const {
            body: { data },
          } = req;
          const status = await app.objection.models.status.query().findById(req.params.id);
          await status.$query().patch(data);
          req.flash('success', i18next.t('flash.statuses.edit.success'));
          reply.redirect('/statuses');
          return reply;
        } catch (error) {
          if (error instanceof app.objection.models.status.ValidationError) {
            req.flash('error', i18next.t('flash.statuses.edit.error'));
            reply.redirect(app.reverse('statusEdit', { id: req.params.id }));
            return reply;
          }
          throw error;
        }
      },
    )
    .delete(
      '/statuses/:id',
      { name: 'statusDelete', preValidation: app.authenticate },
      async (req, reply) => {
        const statusTasks = await app.objection.models.task
          .query()
          .withGraphJoined('status')
          .where('tasks.status_id', '=', req.params.id);
        if (statusTasks.length !== 0) {
          req.flash('error', i18next.t('flash.statuses.delete.error'));
        } else {
          const status = await app.objection.models.status.query().findById(req.params.id);
          await status.$query().delete();
          req.flash('info', i18next.t('flash.statuses.delete.success'));
        }
        reply.redirect('/statuses');
        return reply;
      },
    );
};
