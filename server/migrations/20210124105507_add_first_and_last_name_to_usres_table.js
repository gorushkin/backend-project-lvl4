// @ts-check

exports.up = (knex) => (
  knex.schema.table('users', (table) => {
    table.string('first_name');
    table.string('last_name');
  })
);

exports.down = (knex) => knex.schema.table('users', (table) => {
  table.dropColumn('first_name');
  table.dropColumn('last_name');
});
