
exports.seed = function(knex) {
      // Inserts seed entries
      return knex('admin').insert([
        {admin_id: 1, email: 'user@example.org', password: 'test'},
      ]);
};
