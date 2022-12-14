const { omit } = require('lodash');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');

const tables = [
  {
    source: 'components_page_components_documents_collapse__attachments_list',
    destination: 'components_page_components_documents_collapse_attach_links',
  },
];

const processedTables = tables.map((table) => table.source);

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
