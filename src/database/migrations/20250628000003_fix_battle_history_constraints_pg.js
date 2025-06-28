/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Só executa para PostgreSQL
  if (knex.client.config.client !== 'pg' && knex.client.config.client !== 'postgresql') {
    return;
  }
  // Remover constraints antigas
  await knex.raw('ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_a_id_foreign');
  await knex.raw('ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_b_id_foreign');

  // Adicionar novamente com ON DELETE SET NULL
  await knex.raw(`ALTER TABLE battle_history ADD CONSTRAINT battle_history_pokemon_a_id_foreign FOREIGN KEY (pokemon_a_id) REFERENCES pokemons(id) ON DELETE SET NULL`);
  await knex.raw(`ALTER TABLE battle_history ADD CONSTRAINT battle_history_pokemon_b_id_foreign FOREIGN KEY (pokemon_b_id) REFERENCES pokemons(id) ON DELETE SET NULL`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Só executa para PostgreSQL
  if (knex.client.config.client !== 'pg' && knex.client.config.client !== 'postgresql') {
    return;
  }
  // Remover constraints SET NULL
  await knex.raw('ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_a_id_foreign');
  await knex.raw('ALTER TABLE battle_history DROP CONSTRAINT IF EXISTS battle_history_pokemon_b_id_foreign');

  // Adicionar novamente com ON DELETE RESTRICT (padrão)
  await knex.raw(`ALTER TABLE battle_history ADD CONSTRAINT battle_history_pokemon_a_id_foreign FOREIGN KEY (pokemon_a_id) REFERENCES pokemons(id)`);
  await knex.raw(`ALTER TABLE battle_history ADD CONSTRAINT battle_history_pokemon_b_id_foreign FOREIGN KEY (pokemon_b_id) REFERENCES pokemons(id)`);
}; 