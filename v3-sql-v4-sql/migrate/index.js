const { dbV3, dbV4, isPGSQL, isSQLITE, isMYSQL } = require('../config/database');
const { migrateCustom } = require('./migrateCustom');
const { migrateAdmin } = require('./migrateAdmin');
const { migrateCoreStore } = require('./migrateCoreStore');
const { migrateModels } = require('./migrateModels');
const { migrateFiles } = require('./migrateFiles');
const { migrateUsers } = require('./migrateUsers');
const { migrateWebhooks } = require('./migrateWebhooks');
const { migrateI18n } = require('./migrateI18n');
const { migrateComponents } = require('./migrateComponents');

const migrations = [
  migrateCoreStore,
  migrateAdmin,
  migrateUsers,
  migrateCustom,
  migrateWebhooks,
  migrateI18n,
  migrateFiles,
];

// const preModels = ['common_configs', 'common_configs__most_common_faq'];

async function migrate() {
  if (isPGSQL) {
    // Default to public if no schema is defined
    if (!process.env.DATABASE_V3_SCHEMA) process.env.DATABASE_V3_SCHEMA = 'public';
    if (!process.env.DATABASE_V4_SCHEMA) process.env.DATABASE_V4_SCHEMA = 'public';

    try {
      await dbV4.raw('set session_replication_role to replica;');
      console.log('Replication role set to replica');
    } catch (error) {
      console.log(
        'Error setting session_replication_role to replica, you may get foreign key constraint errors'
      );
      console.log('Replication role requires specific admin permissions');
    }
  }

  if (isMYSQL) {
    await dbV4.raw('SET FOREIGN_KEY_CHECKS=0;');
  }
  let tables = [];

  if (isPGSQL) {
    tables = (
      await dbV3('information_schema.tables')
        .select('table_name')
        .where('table_schema', process.env.DATABASE_V3_SCHEMA)
    ).map((row) => row.table_name);
  }

  if (isSQLITE) {
    tables = (await dbV3('sqlite_master').select('name')).map((row) => row.name);
  }

  if (isMYSQL) {
    tables = (await dbV3('information_schema.tables').select('table_name')).map((row) => {
      return row.table_name || row.TABLE_NAME;
    });
  }

  const processedTables = [];
  for (const migration of migrations) {
    await migration.migrateTables();
    processedTables.push(...migration.processedTables);
  }

  const unprocessedTables = tables.filter((table) => !processedTables.includes(table));

  // if (preModels.length) {
  //   await migrateModels(preModels);
  //   processedTables.push(...preModels);
  // }

  await migrateComponents.migrateTables(unprocessedTables);

  processedTables.push(...migrateComponents.processedTables);

  await migrateModels(tables.filter((table) => !processedTables.includes(table)));

  if (isPGSQL) {
    await dbV4.raw('set session_replication_role to DEFAULT;');
    console.log('Replication role set to DEFAULT');
  }

  if (isMYSQL) {
    await dbV4.raw('SET FOREIGN_KEY_CHECKS=1;');
  }

  if (isPGSQL) {
    const response = await dbV3.raw(
      `SELECT * FROM information_schema.sequences ORDER BY sequence_name`
    );
    for (const oldSeq of response.rows) {
      const newSeq = await dbV4.raw(
        `SELECT * FROM information_schema.sequences WHERE sequence_name = '${oldSeq.sequence_name}'`
      );
      const oldSeqData = await dbV3.raw(`SELECT x.* FROM public."${oldSeq.sequence_name}" x`);
      if (newSeq.rows.length) {
        const restartValue =
          (isNaN(oldSeqData.rows[0].last_value) ? 1 : parseInt(oldSeqData.rows[0].last_value)) + 1;
        await dbV4.raw(`
          ALTER SEQUENCE public."${oldSeq.sequence_name}"
          RESTART ${restartValue};
        `);
        console.log(`SEQUENCE ${oldSeq.sequence_name} RESTARTED WITH ${restartValue}`);
      }
    }
  }
}

module.exports = {
  migrate,
};
