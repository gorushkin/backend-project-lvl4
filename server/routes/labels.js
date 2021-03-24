// @ts-check

import i18next from 'i18next';
import { ValidationError } from 'objection';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'labelNew', preValidation: app.authenticate }, (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
    })
    .post(
      '/labels',
      { name: 'labelCreate', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const label = await app.objection.models.label.fromJson(req.body.data);
          await app.objection.models.label.query().insert(label);
          req.flash('info', i18next.t('flash.labels.create.success'));
          reply.redirect(app.reverse('labels'));
          return reply;
        } catch (error) {
          if (error instanceof ValidationError) {
            req.flash('error', i18next.t('flash.labels.create.error'));
            reply.render('/labels/new', { label: req.body.data, errors: error.data });
            return reply;
          }
          throw error;
        }
      },
    )
    .get(
      '/labels/:id/edit',
      { name: 'labelEdit', preValidation: app.authenticate },
      async (req, reply) => {
        const label = await app.objection.models.label.query().findById(req.params.id);
        reply.render('labels/edit', { label });
        return reply;
      },
    )
    .patch(
      '/labels/:id',
      { name: 'labelUpdate', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const {
            body: { data },
          } = req;
          const label = await app.objection.models.label.query().findById(req.params.id);
          await label.$query().patch(data);
          req.flash('success', i18next.t('flash.labels.edit.success'));
          reply.redirect('/labels');
          return reply;
        } catch (error) {
          if (error instanceof ValidationError) {
            req.flash('error', i18next.t('flash.labels.edit.error'));
            reply.render(
              app.reverse('labelEdit', {
                label: { ...req.body.data, id: req.params.id },
                errors: error.data,
              })
            );
            return reply;
          }
          throw error;
        }
      },
    )
    .delete(
      '/labels/:id',
      { name: 'labelsDelete', preValidation: app.authenticate },
      async (req, reply) => {
        const label = await app.objection.models.label.query().findById(req.params.id);
        const tasks = await label.$relatedQuery('tasks');
        if (tasks.length !== 0) {
          req.flash('error', i18next.t('flash.labels.delete.error'));
        } else {
          await label.$query().delete();
          req.flash('info', i18next.t('flash.labels.delete.success'));
        }
        reply.redirect(app.reverse('labels'));
        return reply;
      },
    );
};
