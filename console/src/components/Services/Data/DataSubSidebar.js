import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import LeftSubSidebar from '../../Common/Layout/LeftSubSidebar/LeftSubSidebar';

import { UPDATE_TRACKED_FUNCTIONS } from './DataActions';

const appPrefix = '/data';

class DataSubSidebar extends React.Component {
  constructor() {
    super();

    this.tableSearch = this.tableSearch.bind(this);
    this.setTrackedTables = this.setTrackedTables.bind(this);
    this.state = {
      trackedTables: [],
      tableList: [],
    };
  }

  componentDidMount() {
    const { currentSchema, schema } = this.props;
    this.setTrackedTables(currentSchema, schema);
  }

  shouldComponentUpdate(nextProps) {
    const { currentSchema, schema } = this.props;
    if (
      currentSchema !== nextProps.currentSchema ||
      schema !== nextProps.schema
    ) {
      this.setTrackedTables(nextProps.currentSchema, nextProps.schema);
    }
    return true;
  }

  setTrackedTables(currentSchema, schema) {
    const trackedTables = schema.filter(
      table => table.is_table_tracked && table.table_schema === currentSchema
    );
    this.setState({
      trackedTables: trackedTables,
      tableList: trackedTables,
    });
  }

  tableSearch(e) {
    const searchTerm = e.target.value;

    this.state.tableList = this.state.trackedTables.filter(
      t => t.table_name.indexOf(searchTerm) !== -1
    );

    const matchedFuncs = this.props.functionsList.filter(
      f => f.function_name.indexOf(searchTerm) !== -1
    );

    this.props.dispatch({ type: UPDATE_TRACKED_FUNCTIONS, data: matchedFuncs });
  }

  render() {
    const styles = require('../../Common/Layout/LeftSubSidebar/LeftSubSidebar.scss');
    const functionSymbol = require('../../Common/Layout/LeftSubSidebar/function.svg');
    const functionSymbolActive = require('../../Common/Layout/LeftSubSidebar/function_high.svg');
    const {
      functionsList,
      listedFunctions,
      currentTable,
      currentSchema,
      migrationMode,
      location,
      currentFunction,
      metadata,
    } = this.props;

    if (metadata.ongoingRequest) {
      return null;
    }

    const { trackedTables, tableList } = this.state;

    const trackedTablesLength = trackedTables.length;

    const getSearchInput = () => {
      return (
        <input
          type="text"
          onChange={this.tableSearch}
          className="form-control"
          placeholder={'search table/view/function'}
          data-test="search-tables"
        />
      );
    };

    const getChildList = () => {
      let tableLinks = [
        <li className={styles.noChildren} key="no-tables-1">
          <i>No tables/views available</i>
        </li>,
      ];

      const tables = {};
      tableList.map(t => {
        if (t.is_table_tracked) {
          tables[t.table_name] = t;
        }
      });

      const currentLocation = location.pathname;

      if (tableList && tableList.length) {
        tableLinks = Object.keys(tables)
          .sort()
          .map((tableName, i) => {
            let activeTableClass = '';
            if (
              tableName === currentTable &&
              currentLocation.indexOf(currentTable) !== -1
            ) {
              activeTableClass = styles.activeTable;
            }
            if (tables[tableName].table_type === 'BASE TABLE') {
              return (
                <li className={activeTableClass} key={i}>
                  <Link
                    to={
                      appPrefix +
                      '/schema/' +
                      currentSchema +
                      '/tables/' +
                      tableName +
                      '/browse'
                    }
                    data-test={tableName}
                  >
                    <i
                      className={styles.tableIcon + ' fa fa-table'}
                      aria-hidden="true"
                    />
                    {tableName}
                  </Link>
                </li>
              );
            }

            return (
              <li className={activeTableClass} key={i}>
                <Link
                  to={
                    appPrefix +
                    '/schema/' +
                    currentSchema +
                    '/views/' +
                    tableName +
                    '/browse'
                  }
                  data-test={tableName}
                >
                  <i
                    className={styles.tableIcon + ' fa fa-table'}
                    aria-hidden="true"
                  />
                  <i>{tableName}</i>
                </Link>
              </li>
            );
          });
      }

      const dividerHr = [
        <li key={'fn-divider-1'}>
          <hr className={styles.tableFunctionDivider} />
        </li>,
      ];

      // If the listedFunctions is non empty
      if (listedFunctions.length > 0) {
        const functionHtml = listedFunctions.map((f, i) => (
          <li
            className={
              f.function_name === currentFunction ? styles.activeTable : ''
            }
            key={'fn ' + i}
          >
            <Link
              to={
                appPrefix +
                '/schema/' +
                currentSchema +
                '/functions/' +
                f.function_name
              }
              data-test={f.function_name}
            >
              <div
                className={styles.display_inline + ' ' + styles.functionIcon}
              >
                <img
                  src={
                    f.function_name === currentFunction
                      ? functionSymbolActive
                      : functionSymbol
                  }
                />
              </div>
              {f.function_name}
            </Link>
          </li>
        ));

        tableLinks = [...tableLinks, ...dividerHr, ...functionHtml];
      } else if (
        functionsList.length !== listedFunctions.length &&
        listedFunctions.length === 0
      ) {
        const noFunctionResult = [
          <li className={styles.noChildren}>
            <i>No matching functions available</i>
          </li>,
        ];

        tableLinks = [...tableLinks, ...dividerHr, ...noFunctionResult];
      }

      return tableLinks;
    };

    return (
      <LeftSubSidebar
        migrationMode={migrationMode}
        searchInput={getSearchInput()}
        heading={`Tables (${trackedTablesLength})`}
        addLink={'/data/schema/' + currentSchema + '/table/add'}
        addLabel={'Add Table'}
        addTestString={'sidebar-add-table'}
        childListTestString={'table-links'}
      >
        {getChildList()}
      </LeftSubSidebar>
    );
  }
}

const mapStateToProps = state => {
  return {
    currentTable: state.tables.currentTable,
    migrationMode: state.main.migrationMode,
    functionsList: state.tables.trackedFunctions,
    listedFunctions: state.tables.listedFunctions,
    currentFunction: state.functions.functionName,
    serverVersion: state.main.serverVersion ? state.main.serverVersion : '',
    metadata: state.metadata,
  };
};

export default connect(mapStateToProps)(DataSubSidebar);
