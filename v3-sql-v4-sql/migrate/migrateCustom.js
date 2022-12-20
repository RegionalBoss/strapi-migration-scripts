// Tables that should not be proccessed later
const processedTables = [];

const fs = require('fs');
const path = require('path');

const customMigrations = [];

const MIGRATION_FOLDERS = __dirname + '/../customMigrations';
const files = fs.readdirSync(MIGRATION_FOLDERS);

files.forEach((file) => {
  const extension = path.extname(file);

  if (extension === '.js' && file !== 'import.js') {
    customMigrations.push({
      name: file,
      ...require(path.join(MIGRATION_FOLDERS, file)),
    });
  }
});

// Custom migration function, handles DB reads and writes
async function migrateTables() {
  for (const customMigration of customMigrations.filter((m) => !m.modelRelation)) {
    console.log('Migration custom ', customMigration.name);

    await customMigration.migrateTables();
    processedTables.push(...customMigration.processedTables);
  }
}

async function migrateAfterModels() {
  for (const customMigration of customMigrations.filter((m) => m.modelRelation)) {
    console.log('Migration custom after models', customMigration.name);

    await customMigration.migrateTables();
    processedTables.push(...customMigration.processedTables);
  }
}

const migrateCustom = {
  processedTables,
  migrateTables,
};

const migrateCustomAfterModels = {
  processedTables,
  migrateAfterModels,
};

module.exports = {
  migrateCustom,
  migrateCustomAfterModels,
};
