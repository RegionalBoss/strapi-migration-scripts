const { omit } = require('lodash');
const { dbV4, dbV3 } = require('../config/database');
const { migrate } = require('../migrate/helpers/migrate');
const { migrateItem } = require('../migrate/helpers/migrateFields');
const { resolveDestTableName } = require('../migrate/helpers/tableNameHelpers');

const tables = [
  {
    source: {
      name: 'articles_categories__categories_articles',
      cols: ['id', 'article_id', 'category_id'],
    },
    destination: {
      name: 'articles_categories_links',
      cols: {
        id: 'id',
        article_id: 'article_id',
        category_id: 'category_id',
        category_order: 'index',
        article_order: 'index',
      },
    },
  },
  {
    source: {
      name: 'pages',
      cols: ['id', 'menu_baner'],
    },
    destination: {
      name: 'pages_menu_baner_links',
      cols: {
        page_id: 'id',
        menu_baner_id: 'menu_baner',
        page_order: 'index',
      },
    },
  },
  {
    source: {
      name: 'components_calc_exchange_rates__currencies',
      cols: ['id', 'components_calc_exchange_rate_id', 'currency_id'],
    },
    destination: {
      name: 'components_calc_exchange_rates_currencies_links',
      cols: {
        id: 'id',
        calc_exchange_rate_id: 'components_calc_exchange_rate_id',
        currency_id: 'currency_id',
        currency_order: 'index',
      },
    },
  },
  {
    source: {
      name: 'partials_calc_deposit_currency_terms',
      cols: ['id', 'currency'],
    },
    destination: {
      name: 'partials_calc_deposit_currency_terms_currency_links',
      cols: {
        calc_deposit_currency_terms_id: 'id',
        currency_id: 'currency',
      },
    },
  },
  {
    source: {
      name: 'partials_deposit_currency_terms',
      cols: ['id', 'currency'],
    },
    destination: {
      name: 'partials_deposit_currency_terms_currency_links',
      cols: {
        deposit_currency_terms_id: 'id',
        currency_id: 'currency',
      },
    },
  },
];

const processedTables = tables.map((table) => table.source.name);

async function migrateTables() {
  await Promise.all(
    tables.map(async (table) => {
      try {
        await migrate(table.source.name, table.destination.name, (item, index) => {
          if (
            table.source.name === 'articles_categories__categories_articles' &&
            item.article_id === 24
          )
            return undefined;
          const newItem = Object.keys(table.destination.cols).reduce(
            (prev, curr) => ({
              ...prev,
              [curr]:
                table.destination.cols[curr] === 'index'
                  ? index
                  : item[table.destination.cols[curr]] || null,
            }),
            {}
          );

          return migrateItem(omit(newItem));
        });
      } catch (ex) {
        console.error(ex);
        console.log('error migrating table', table);
      }
    })
  );
}

module.exports = {
  processedTables,
  migrateTables,
  modelRelation: true,
};
