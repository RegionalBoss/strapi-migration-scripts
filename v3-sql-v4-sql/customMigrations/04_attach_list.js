const { omit } = require('lodash');
const { dbV4 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');
// Tables that should be migrated from v3 to v4
const tables = [
  {
    source: 'components_page_components_documents_collapse__attachments_list',
    destination: 'components_page_components_documents_collapse_attach_links',
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
        documents_collapse_id: item.components_page_components_documents_collapse_id,
        downloadable_document_id: item['downloadable-document_id'],
      };

      return migrateItem(omit(newItem));
    });
  }
}

module.exports = {
  processedTables,
  migrateTables,
};
