// @ts-check

exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email');
    table.string('password_digest');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.table('users', (table) => {
    table.string('firstname');
    table.string('lastname');
  });
};

exports.down = (knex) => knex.schema.dropTable('users');
