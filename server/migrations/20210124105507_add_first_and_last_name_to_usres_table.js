  // @ts-check

  exports.up = (knex) => (
    knex.schema.table('users', (table) => {
      table.string('firstName');
      table.string('lastName');
    })
  );

  exports.down = (knex) => knex.schema.table('users', (table) => {
    table.dropColumn('firstName');
    table.dropColumn('lastName');
  });