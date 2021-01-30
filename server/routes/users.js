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
    .get(
      '/users/:id/edit',
      { name: 'userEdit', preValidation: app.authenticate, preHandler: app.checkUserRights },
      async (req, reply) => {
        const user = await app.objection.models.user.query().findById(req.params.id);
        reply.render('users/edit', { user });
        return reply;
      }
    )
    .post('/users', { name: 'userCreate' }, async (req, reply) => {
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
    .patch(
      '/users/:id',
      { name: 'userUpdate', preValidation: app.authenticate },
      async (req, reply) => {
        try {
          const {
            body: { data },
          } = req;
          const user = await app.objection.models.user.query().findById(req.params.id);
          await user.$query().patch(data);
          req.flash('success', i18next.t('flash.users.edit.success'));
          reply.redirect('/users');
          return reply;
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.users.edit.error'));
          reply.redirect(app.reverse('userEdit', { id: req.params.id }));
          return reply;
        }
      }
    )
    .delete(
      '/users/:id',
      { name: 'userDelete', preValidation: app.authenticate, preHandler: app.checkUserRights },
      async (req, reply) => {
        try {
          const user = await app.objection.models.user.query().findById(req.params.id);
          await user.$query().delete();
          req.logOut();
          req.flash('info', i18next.t('flash.users.delete.success'));
          reply.redirect('/users');
          return reply;
        } catch ({ data }) {
          req.flash('error', i18next.t('flash.users.delete.error'));
          reply.render('users/new', { user: req.body.data, errors: data });
          return reply;
        }
      }
    );
};
