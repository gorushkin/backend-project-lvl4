// @ts-check

import i18next from 'i18next';

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
    .get('/users/:id/edit', async (req, reply) => {
      if (!reply.locals.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect('/');
        return reply;
      }
      if (req.user.id == req.params.id) {
        const user = await app.objection.models.user.query().findById(req.params.id);
        reply.render('users/edit', { user });
      } else {
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.redirect('/users');
        return reply;
      }
    })
    .post('/users', async (req, reply) => {
      try {
        const user = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
        return reply;
      } catch ({ data }) {
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: req.body.data, errors: data });
        return reply;
      }
    })
    .patch('/users/:id', { name: 'usersUpdate' }, async (req, reply) => {
      const arr = Object.entries(req.body.data);
      const fields = arr.reduce((acc, [key, value]) => {
        if (value) {
          return { ...acc, [key]: value };
        }
        return acc;
      }, {});
      const user = await app.objection.models.user.query().findById(req.params.id);
      await user.$query().patch(fields);
      req.flash('success', i18next.t('flash.users.edit.success'));
      reply.redirect('/users');
    })
    .delete('/users/:id', async (req, reply) => {
      if (!reply.locals.isAuthenticated()) {
        req.flash('error', i18next.t('flash.authError'));
        reply.redirect('/');
        return reply;
      }
      if (req.user.id == req.params.id) {
        const user = await app.objection.models.user.query().findById(req.params.id);
        await user.$query().delete();
        req.logOut();
        req.flash('info', i18next.t('flash.users.delete.success'));
        reply.redirect('/users');
        return reply;
      } else {
        req.flash('error', i18next.t('flash.users.edit.error'));
        reply.redirect('/users');
        return reply;
      }
    });
};
