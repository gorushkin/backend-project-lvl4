// @ts-check

import i18next from 'i18next';
import { ValidationError } from 'objection';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .get(
      '/users/:id/edit',
      {
        name: 'userEdit',
        preValidation: app.auth([app.checkIfUserCanEditProfile, app.authenticate]),
      },
      async (req, reply) => {
        const user = await app.objection.models.user.query().findById(req.params.id);
        reply.render('users/edit', { user });
        return reply;
      },
    )
    .post('/users', { name: 'userCreate' }, async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch (error) {
        if (error instanceof ValidationError) {
          req.flash('error', i18next.t('flash.users.create.error'));
          const user = (new app.objection.models.user()).$set(req.body.data);
          reply.render('users/new', { user, errors: error.data });
          return reply.code(400);
        }
        throw error;
      }
    })
    .patch(
      '/users/:id',
      {
        name: 'userUpdate',
        preValidation: app.auth([app.checkIfUserCanEditProfile, app.authenticate]),
      },
      async (req, reply) => {
        try {
          const {
            body: { data },
          } = req;
          const user = await app.objection.models.user.query().findById(req.params.id);
          await user.$query().patch(data);
          req.flash('success', i18next.t('flash.users.edit.success'));
          reply.redirect(app.reverse('users'));
          return reply;
        } catch (error) {
          if (error instanceof ValidationError) {
            req.flash('error', i18next.t('flash.users.edit.error'));
            const user = (new app.objection.models.user())
              .$set({ ...req.body.data, id: req.params.id });
            reply.render('users/edit', {
              user,
              errors: error.data,
            });
            return reply.code(400);
          }
          throw error;
        }
      },
    )
    .delete(
      '/users/:id',
      {
        name: 'userDelete',
        preValidation: app.auth([app.checkIfUserCanEditProfile, app.authenticate]),
      },
      async (req, reply) => {
        const user = await app.objection.models.user.query().findById(req.params.id);
        const usersTasks = await user.$relatedQuery('tasks');
        if (usersTasks.length !== 0) {
          req.flash('error', i18next.t('flash.users.delete.error'));
        } else {
          await user.$query().delete();
          req.logOut();
          req.flash('info', i18next.t('flash.users.delete.success'));
        }
        reply.redirect('/users');
        return reply;
      },
    );
};
