// @ts-check

import dotenv from 'dotenv';
import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyErrorPage from 'fastify-error-page';
import pointOfView from 'point-of-view';
import fastifyFormbody from 'fastify-formbody';
import fastifySecureSession from 'fastify-secure-session';
import fastifyPassport from 'fastify-passport';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifyMethodOverride from 'fastify-method-override';
import fastifyObjectionjs from 'fastify-objectionjs';
import fastifyAuth from 'fastify-auth';
import qs from 'qs';
import Pug from 'pug';
import i18next from 'i18next';
import Rollbar from 'rollbar';
import ru from './locales/ru.js';
import webpackConfig from '../webpack.config.babel.js';
import addRoutes from './routes/index.js';
import getHelpers from './helpers/index.js';
import knexConfig from '../knexfile.js';
import models from './models/index.js';
import FormStrategy from './lib/passportStrategies/FormStrategy.js';

dotenv.config();
const mode = process.env.NODE_ENV || 'development';
const isProduction = mode === 'production';
const isDevelopment = mode === 'development';

const rollbar = new Rollbar({
  accessToken: process.env.POST_SERVER_ITEM_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
});

const setUpViews = (app) => {
  const { devServer } = webpackConfig;
  const devHost = `http://${devServer.host}:${devServer.port}`;
  const domain = isDevelopment ? devHost : '';
  const helpers = getHelpers(app);
  app.register(pointOfView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext: {
      ...helpers,
      assetPath: (filename) => `${domain}/assets/${filename}`,
    },
    templates: path.join(__dirname, '..', 'server', 'views'),
  });

  app.decorateReply('render', function render(viewPath, locals) {
    this.view(viewPath, { ...locals, reply: this });
  });
};

const setUpStaticAssets = (app) => {
  const pathPublic = isProduction
    ? path.join(__dirname, '..', 'public')
    : path.join(__dirname, '..', 'dist', 'public');
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setupLocalization = () => {
  i18next.init({
    lng: 'ru',
    fallbackLng: 'en',
    debug: isDevelopment,
    resources: {
      ru,
    },
  });
};

const addHooks = (app) => {
  app.addHook('preHandler', async (req, reply) => {
    reply.locals = {
      isAuthenticated: () => req.isAuthenticated(),
    };
  });
};

const addErrorHadlers = (app) => {
  app.setErrorHandler((error, request, reply) => {
    const isUnhandledInternalError = reply.raw.statusCode === 500
    && error.explicitInternalServerError !== true;
    const errorMessage = isUnhandledInternalError ? 'Something went wrong!!!' : error.message;
    request.log.error(error);
    if (isProduction) rollbar.log(error);
    request.flash('error', errorMessage);
    reply.redirect('/');
  });
};

const registerPlugins = (app) => {
  app.register(fastifyAuth);
  if (isDevelopment) app.register(fastifyErrorPage);
  app.register(fastifyReverseRoutes.plugin);
  app.register(fastifyFormbody, { parser: qs.parse });
  app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  });

  fastifyPassport.registerUserDeserializer(
    (user) => app.objection.models.user.query().findById(user.id),
  );
  fastifyPassport.registerUserSerializer((user) => Promise.resolve(user));
  fastifyPassport.use(new FormStrategy('form', app));
  app.register(fastifyPassport.initialize());
  app.register(fastifyPassport.secureSession());
  app.decorate('fp', fastifyPassport);
  app.decorate('authenticate', (...args) => fastifyPassport.authenticate('form', {
    failureRedirect: app.reverse('root'),
    failureFlash: i18next.t('flash.authError'),
  })(...args));

  app.register(fastifyMethodOverride);
  app.register(fastifyObjectionjs, {
    knexConfig: knexConfig[mode],
    models,
  });

  app.decorate('checkIfUserCanEditProfile', async (request, reply) => {
    if (request.user?.id !== parseInt(request.params.id, 10)) {
      request.flash('error', i18next.t('flash.users.authError'));
      reply.redirect('/users');
    }
  });

  app.decorate('checkIfUserCreatedTask', async (request, reply) => {
    const { creatorId } = await app.objection.models.task.query().findById(request.params.id);
    if (request.user.id !== creatorId) {
      request.flash('error', i18next.t('flash.tasks.authError'));
      reply.redirect('/tasks');
    }
  });
};

export default () => {
  const app = fastify({
    logger: {
      prettyPrint: isDevelopment,
    },
  });

  registerPlugins(app);
  addErrorHadlers(app);
  setupLocalization();
  setUpViews(app);
  setUpStaticAssets(app);
  app.after(() => {
    addRoutes(app);
  });
  addHooks(app);

  return app;
};
