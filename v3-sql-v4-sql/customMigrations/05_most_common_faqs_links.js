const { omit } = require('lodash');
const { dbV4 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');

const tables = [
  {
    source: 'common_configs__most_common_faq',
    destination: 'common_configs_most_common_faq_links',
  },
];

const processedTables = tables.map((table) => table.source);

async function migrateTables() {
  await Promise.all(
    tables.map(async (table, index) => {
      await migrate(table.source, table.destination, (item) => {
        const newItem = {
          common_config_id: item.common_config_id,
          faq_id: item.faq_id,
          faq_order: index,
        };

        return migrateItem(omit(newItem));
      });
    })
  );
}

module.exports = {
  processedTables,
  migrateTables,
};
