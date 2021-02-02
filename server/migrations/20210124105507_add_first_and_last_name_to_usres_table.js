  // @ts-check

  exports.up = (knex) => (
    knex.schema.table('users', (table) => {
      table.string('firstname');
      table.string('lastname');
    })
  );

  exports.down = (knex) => knex.schema.table('users', (table) => {
    table.dropColumn('firstname');
    table.dropColumn('lastname');
  });