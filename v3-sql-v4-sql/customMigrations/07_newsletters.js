const { omit } = require('lodash');
const { dbV4 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');
// Tables that should be migrated from v3 to v4
const tables = [
  {
    source: 'newsletters',
    destination: 'newsletters',
  },
  {
    source: 'newsletter_signatures',
    destination: 'newsletter-signatures',
  },
];

const LINKS_TABLE = 'newsletters_signature_links';

const processedTables = tables.map((table) => table.source);

// Custom migration function, handles DB reads and writes
/**
 * Migrates tables from v3 source to v4 destination and changes 'created_by' and 'updated_by' fields to 'created_by_id' and 'updated_by_id', then creates link between them if deployStatus has 'deploy' field as id in link table
 */
async function migrateTables() {
  let links = [];
  for (const table of tables) {
    await migrate(table.source, table.destination, (item, index) => {
      const newItem = {
        ...item,
        created_by_id: item.created_by,
        updated_by_id: item.updated_by,
      };

      if (table.destination === 'newsletters') {
        if (item.signature) {
          links.push({
            newsletter_id: item.id,
            newsletter_signature_id: item.signature,
            newsletter_order: index,
          });
        }
      }

      return migrateItem(omit(newItem, ['created_by', 'updated_by', 'signature']));
    });
  }
  if (links.length) {
    await dbV4(resolveDestTableName(LINKS_TABLE)).insert(links);
  }
}

module.exports = {
  processedTables,
  migrateTables,
};
