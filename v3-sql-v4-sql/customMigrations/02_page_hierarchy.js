const { omit } = require('lodash');
const { dbV4 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');

const tables = [
  {
    source: 'pages',
    destination: 'pages',
  },
  {
    source: 'items',
    destination: 'items',
  },
];

const LINKS_TABLE = {
  item_page: 'items_page_links',
  item_parent: 'items_parent_item_links',
};

const processedTables = tables.map((table) => table.source);

async function migrateTables() {
  let pageLinks = [];
  let parentItemLinks = [];
  for (const table of tables) {
    await migrate(table.source, table.destination, (item) => {
      const newItem = {
        ...item,
        created_by_id: item.created_by,
        updated_by_id: item.updated_by,
      };

      if (table.destination === 'items') {
        if (item.page) {
          pageLinks.push({
            item_id: item.id,
            page_id: item.page,
          });
        }
        if (item.parent_item) {
          parentItemLinks.push({
            item_id: item.id,
            inv_item_id: item.parent_item,
          });
        }
        delete newItem.page;
        delete newItem.parent_item;
      }

      return migrateItem(omit(newItem, ['created_by', 'updated_by']));
    });
  }
  if (pageLinks.length) {
    await dbV4(resolveDestTableName(LINKS_TABLE.item_page)).insert(pageLinks);
  }
  if (parentItemLinks.length) {
    await dbV4(resolveDestTableName(LINKS_TABLE.item_parent)).insert(parentItemLinks);
  }
}

module.exports = {
  processedTables,
  migrateTables,
};
