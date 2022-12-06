const { omit } = require('lodash');
const { dbV4 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');
// Tables that should be migrated from v3 to v4
const tables = [
  {
    source: 'audit_log',
    destination: 'audit_log',
  },
];

const processedTables = tables.map((table) => table.source);

// Custom migration function, handles DB reads and writes
/**
 * Migrates tables from v3 source to v4 destination and changes 'created_by' and 'updated_by' fields to 'created_by_id' and 'updated_by_id', then creates link between them if deployStatus has 'deploy' field as id in link table
 */
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
