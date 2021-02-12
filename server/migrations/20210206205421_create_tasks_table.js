// @ts-check

exports.up = async (knex) => {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.integer('status_id').references('id').inTable('statuses');
    table.integer('creator_id').references('id').inTable('users');
    table.integer('executor_id').references('id').inTable('users');
    table.boolean('is_complete').default(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = (knex) => knex.schema.dropTable('tasks');