const { omit } = require('lodash');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');

const tables = [
  {
    source: 'audit_log',
    destination: 'audit_log',
  },
];

const processedTables = tables.map((table) => table.source);

async function migrateTables() {
  for (const table of tables) {
    await migrate(table.source, table.destination, (item) => {
      const newItem = {
        ...item,
        created_by_id: item.created_by,
        updated_by_id: item.updated_by,
      };

      return migrateItem(omit(newItem, ['created_by', 'updated_by']));
    });
  }
}

module.exports = {
  processedTables,
  migrateTables,
};
