const { omit } = require('lodash');
const { dbV4 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');
// Tables that should be migrated from v3 to v4
const tables = [
  {
    source: 'deploy',
    destination: 'deploys',
  },
  {
    source: 'deployStatus',
    destination: 'deploy-statuses',
  },
];

const LINKS_TABLE = 'deploy_statuses_deploy_links';

const processedTables = tables.map((table) => table.source);

// Custom migration function, handles DB reads and writes
/**
 * Migrates tables from v3 source to v4 destination and changes 'created_by' and 'updated_by' fields to 'created_by_id' and 'updated_by_id', then creates link between them if deployStatus has 'deploy' field as id in link table
 */
async function migrateTables() {
  let deployLinks = [];
  for (const table of tables) {
    await migrate(table.source, table.destination, (item) => {
      const newItem = {
        ...item,
        created_by_id: item.created_by,
        updated_by_id: item.updated_by,
      };
      delete newItem.created_by;
      delete newItem.updated_by;

      if (table.destination === 'deploy-statuses') {
        if (item.deploy) {
          deployLinks.push({
            deploy_status_id: item.id,
            deploy_id: item.deploy,
          });
        }
        delete newItem.deploy;
      }

      return migrateItem(omit(newItem, ['created_by', 'updated_by']));
    });
  }
  if (deployLinks.length) {
    await dbV4(resolveDestTableName(LINKS_TABLE)).insert(deployLinks);
  }
}

module.exports = {
  processedTables,
  migrateTables,
};
