import i18next from 'i18next';
import _ from 'lodash';

export default (app) => ({
  route(name, params = {}) {
    return app.reverse(name, params);
  },
  t(key) {
    return i18next.t(key);
  },
  _,
  getAlertClass(type) {
    switch (type) {
      // case 'failure':
      //   return 'danger';
      case 'error':
        return 'danger';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        throw new Error(`Unknown flash type: '${type}'`);
    }
  },
  formatDate(str) {
    const date = new Date(str);
    return date.toLocaleString();
  },
});

const getTask = async (app, id) => {
  const task = await app.objection.models.task
    .query()
    .findById(id)
    .select(
      'tasks.*',
      'statuses.name as statusName',
      'creator.firstname as creatorFirstName',
      'creator.lastname as creatorLastName',
      'executor.firstname as executorFirstName',
      'executor.lastname as executorLastname',
    )
    .innerJoin('statuses', 'statuses.id', 'tasks.statusId')
    .innerJoin('users as creator', 'creator.id', 'tasks.creatorId')
    .innerJoin('users as executor', 'executor.id', 'tasks.executorId');
  return task;
};

export { getTask };
