  // @ts-check

  exports.up = async (knex) => {
    await knex.schema.createTable('tasks_labels', (table) => {
      table.integer('task_id').references('id').inTable('tasks');
      table.integer('label_id').references('id').inTable('labels');
    });
  };

  exports.down = (knex) => knex.schema.dropTable('tasks_labels');
