// @ts-check

exports.up = (knex) => (
  knex.schema.table('users', (table) => {
    table.string('firstname');
    table.string('lastname');
  })
);

exports.down = (knex) => knex.schema.dropTable('users');
