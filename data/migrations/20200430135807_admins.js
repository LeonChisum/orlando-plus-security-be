exports.up = function (knex) {
  return knex.schema.createTable("admin", (tbl) => {
    tbl.increments("admin_id");
    tbl.text("email").unique().notNullable();
    tbl.string("password").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("admin");
};
