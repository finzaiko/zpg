function createDependencyProposals(range) {
    return [
		{
			label: 'rais',
			kind: monaco.languages.CompletionItemKind.Function,
			documentation: 'Raise Notice one parameter',
			insertText: 'RAISE NOTICE \'${1:var}= %\', ${1:var};',
			insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
			range: range
		},
        {
			label: 'rais2',
			kind: monaco.languages.CompletionItemKind.Function,
			documentation: 'Raise Notice two parameter',
			insertText: 'RAISE NOTICE \'${1:var1}= %, ${2:var2}= %\', ${1:var1}, ${2:var2};',
			insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
			range: range
		}
    ];
}


// Static SQL keywords always offered as autocomplete suggestions
const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "JOIN", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN",
  "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "OFFSET", "INSERT INTO", "VALUES",
  "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE",
  "AND", "OR", "NOT", "NULL", "IS NULL", "IS NOT NULL", "IN", "EXISTS",
  "BETWEEN", "LIKE", "AS", "DISTINCT", "UNION", "UNION ALL", "ON",
];

// Cache of DB-derived identifiers (schemas/tables/columns/functions), keyed by profileId
// so each query tab/connection keeps its own completion list.
const sqlCompletionCacheByProfile = new Map();

// Normalize cache structure to support both flat and schema-organized formats
// Input format 1 (flat): { schemas: [...], tables: [...], columns: [...], functions: [...] }
// Input format 2 (schema-organized): { tablesBySchema: { schema: [...] }, functionsBySchema: {...}, ... }
// Or with per-schema details: [{ schema: "public", tables: [...], functions: [...], columns: [...] }, ...]
function normalizeCacheStructure(data) {
  if (!data) return {
    schemas: [],
    tables: [],
    columns: [],
    functions: [],
    tablesBySchema: {},
    functionsBySchema: {},
    columnsBySchema: {}
  };

  // Already normalized format
  if (data.tablesBySchema) {
    return {
      schemas: data.schemas || [],
      tables: data.tables || [],
      columns: data.columns || [],
      functions: data.functions || [],
      tablesBySchema: data.tablesBySchema || {},
      functionsBySchema: data.functionsBySchema || {},
      columnsBySchema: data.columnsBySchema || {}
    };
  }

  // Array format: [{ schema, tables, functions, columns }, ...]
  if (Array.isArray(data)) {
    const cache = {
      schemas: [],
      tables: [],
      columns: [],
      functions: [],
      tablesBySchema: {},
      functionsBySchema: {},
      columnsBySchema: {}
    };

    data.forEach(item => {
      if (item.schema) {
        cache.schemas.push(item.schema);
        if (item.tables) {
          cache.tablesBySchema[item.schema] = item.tables;
          cache.tables = cache.tables.concat(item.tables);
        }
        if (item.functions) {
          cache.functionsBySchema[item.schema] = item.functions;
          cache.functions = cache.functions.concat(item.functions);
        }
        if (item.columns) {
          cache.columnsBySchema[item.schema] = item.columns;
          cache.columns = cache.columns.concat(item.columns);
        }
      }
    });
    return cache;
  }

  // Flat format: { schemas: [...], tables: [...], columns: [...], functions: [...] }
  return {
    schemas: data.schemas || [],
    tables: data.tables || [],
    columns: data.columns || [],
    functions: data.functions || [],
    tablesBySchema: data.tablesBySchema || {},
    functionsBySchema: data.functionsBySchema || {},
    columnsBySchema: data.columnsBySchema || {}
  };
}

// Call this (e.g. after loading a DB tree, or from an IndexedDB cache hit) per connection
// Supports multiple input formats:
// 1. Flat: { schemas: [...], tables: [...], columns: [...], functions: [...] }
// 2. Schema-organized: { tablesBySchema: { schema: [...] }, functionsBySchema: {...}, ... }
// 3. Array format: [{ schema: "public", tables: [...], functions: [...], columns: [...] }, ...]
window.setSqlCompletionCache = function (profileId, data) {
  if (!profileId) return;
  sqlCompletionCacheByProfile.set(String(profileId), normalizeCacheStructure(data));
};

// Tags an editor's model with the active profileId so the shared "sql" completion
// provider knows which cache to use for that specific editor instance/tab.
window.setSqlEditorProfile = function (editor, profileId) {
  const model = editor && editor.getModel && editor.getModel();
  if (model) model.__sqlProfileId = profileId ? String(profileId) : null;
};

// Generate SQL alias from table name
// Examples: sales_order → so, customer → c, product_category → pc
function generateTableAlias(tableName) {
  if (!tableName) return '';

  // If contains underscore, take first letter of each word
  if (tableName.includes('_')) {
    return tableName.split('_').map(word => word[0]).join('');
  }

  // For single word, use first letter (or first 2 if very generic)
  const genericWords = ['data', 'record', 'table', 'item', 'object', 'info'];
  if (genericWords.includes(tableName.toLowerCase())) {
    return tableName.substring(0, 2).toLowerCase();
  }

  return tableName[0].toLowerCase();
}

// Extract table aliases from SQL (e.g., "FROM sales_order so", "FROM sales_order AS so")
// Returns Map: { alias => tableName }
function extractTableAliases(sqlText) {
  const aliasMap = {};

  // Match patterns like: schema.table alias, table alias, table AS alias
  // Handles: FROM table_name alias, FROM schema.table alias, FROM table_name AS alias
  const aliasPattern = /(?:FROM|JOIN)\s+(?:([a-zA-Z_][a-zA-Z0-9_]*\.))?([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/gi;

  let match;
  while ((match = aliasPattern.exec(sqlText)) !== null) {
    const schema = match[1] ? match[1].slice(0, -1) : null;  // Remove trailing dot
    const tableName = match[2];
    const alias = match[3];

    // Store both qualified and unqualified table names as keys for lookup
    aliasMap[alias] = { tableName: tableName, schema: schema };
  }

  return aliasMap;
}

// Detect if cursor is at schema-qualified position (e.g., "master." or "public.")
// Returns { isQualified: boolean, schema: string, position: 'afterDot' | 'normal' }
function detectSchemaContext(model, position) {
  try {
    const lineContent = model.getLineContent(position.lineNumber);
    // Include the dot in the search by using position.column instead of position.column - 1
    const beforeCursor = lineContent.substring(0, position.column);

    // Look for pattern: word. (where we're right after the dot)
    const lastDotIndex = beforeCursor.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return { isQualified: false, schema: null, position: 'normal' };
    }

    // Verify cursor is immediately after the dot (only identifier chars between dot and cursor)
    const afterDot = beforeCursor.substring(lastDotIndex + 1);
    if (!/^[a-zA-Z0-9_]*$/.test(afterDot)) {
      // There are non-identifier characters after the dot, so this is not an active schema context
      return { isQualified: false, schema: null, position: 'normal' };
    }

    // Get text before dot and extract the last word
    const beforeDot = beforeCursor.substring(0, lastDotIndex).trim();

    // Extract last word before dot (the potential schema name)
    // Split by common delimiters to find the immediate preceding identifier
    const words = beforeDot.split(/[\s\(\),;]+/);
    const lastWord = words[words.length - 1];

    if (!lastWord) {
      return { isQualified: false, schema: null, position: 'normal' };
    }

    // Check if last word looks like an identifier (schema name)
    // Valid: letters, underscores, numbers (but not starting with number)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lastWord)) {
      return {
        isQualified: true,
        schema: lastWord.toLowerCase(),
        position: 'afterDot'
      };
    }

    return { isQualified: false, schema: null, position: 'normal' };
  } catch (e) {
    return { isQualified: false, schema: null, position: 'normal' };
  }
}

let sqlCompletionProviderRegistered = false;
function registerSqlCompletionProvider() {
  if (sqlCompletionProviderRegistered) return;

  // Check if SQL suggestions are enabled in settings
  // Note: Must match the key used in QueryPage.js settings
  const isSqlSuggestionEnabled = webix.storage.local.get("sqlsuggestion"); // SQL_SUGGESTION

  // If SQL suggestions are disabled, skip custom provider registration
  // Monaco editor will use its default cache/suggestions
  if (!isSqlSuggestionEnabled) {
    sqlCompletionProviderRegistered = true;
    return;
  }

  sqlCompletionProviderRegistered = true;

  monaco.languages.registerCompletionItemProvider("sql", {
    triggerCharacters: [".", " "],
    provideCompletionItems: function (model, position) {
      var suggestions = [];
      var cache = sqlCompletionCacheByProfile.get(model.__sqlProfileId) || {};

      // Get full SQL text to extract aliases
      const fullSqlText = model.getValue();
      const aliasMap = extractTableAliases(fullSqlText);

      // Detect if we're in a schema-qualified context (e.g., "master.")
      var schemaContext = detectSchemaContext(model, position);

      if (schemaContext.isQualified && schemaContext.position === 'afterDot') {
        // Schema-qualified completion: show tables/functions from specific schema
        const schema = schemaContext.schema;

        // For schema-qualified context, create range starting after the dot
        const lineContent = model.getLineContent(position.lineNumber);
        const lastDotIndex = lineContent.lastIndexOf('.');

        var range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: lastDotIndex + 2,  // Start right after the dot
          endColumn: position.column,      // End at cursor position
        };

        // Add tables from this schema
        if (cache.tablesBySchema && cache.tablesBySchema[schema]) {
          cache.tablesBySchema[schema].forEach(function (tableName) {
            // Only show alias suggestion (e.g., sales_order => so)
            const alias = generateTableAlias(tableName);
            suggestions.push({
              label: tableName + " " + alias,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: "table with alias [" + schema + "]",
              insertText: tableName + " " + alias,
              range: range,
              sortText: "0_" + tableName,
            });
          });
        }

        // Add functions from this schema
        if (cache.functionsBySchema && cache.functionsBySchema[schema]) {
          cache.functionsBySchema[schema].forEach(function (funcName) {
            suggestions.push({
              label: funcName,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: "function [" + schema + "]",
              insertText: funcName + "()",
              range: range,
              sortText: "2_" + funcName,
            });
          });
        }
      } else {
        // Check if we're after a table alias (e.g., "so.")
        const beforeCursor = fullSqlText.substring(0, model.getOffsetAt(position));
        const lastDotIndex = beforeCursor.lastIndexOf('.');

        if (lastDotIndex !== -1) {
          // Extract potential alias before the dot
          const beforeDot = beforeCursor.substring(0, lastDotIndex).trim();
          const words = beforeDot.split(/[\s\(\),;]+/);
          const potentialAlias = words[words.length - 1];

          // Check if this is a known alias
          if (potentialAlias && aliasMap[potentialAlias]) {
            // Show columns for this table alias
            const tableInfo = aliasMap[potentialAlias];
            const tableName = tableInfo.tableName;

            const lineContent = model.getLineContent(position.lineNumber);
            const lineLastDotIndex = lineContent.lastIndexOf('.');

            var range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: lineLastDotIndex + 2,
              endColumn: position.column,
            };

            // Show columns associated with this table
            (cache.columns || []).forEach(function (name) {
              suggestions.push({
                label: name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: "column [" + tableName + "]",
                insertText: name,
                range: range,
                sortText: "0_" + name,
              });
            });

            return { suggestions: suggestions };
          }
        }

        // Normal completion: show all keywords, schemas, and global items
        var word = model.getWordUntilPosition(position);
        var range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Always show SQL keywords
        suggestions = SQL_KEYWORDS.map(function (keyword) {
          return {
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range,
          };
        });

        // Show all schemas
        (cache.schemas || []).forEach(function (name) {
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Module,
            detail: "schema",
            insertText: name,
            range: range,
            sortText: "0_schema_" + name,
          });
        });

        // Show all tables (or just from default public schema if schema-organized)
        if (cache.tablesBySchema && Object.keys(cache.tablesBySchema).length > 0) {
          // Schema-organized: show tables from all schemas
          Object.entries(cache.tablesBySchema).forEach(function ([schemaName, tables]) {
            tables.forEach(function (tableName) {
              // With schema prefix
              suggestions.push({
                label: schemaName + "." + tableName,
                kind: monaco.languages.CompletionItemKind.Class,
                detail: "table",
                insertText: schemaName + "." + tableName,
                range: range,
                sortText: "1_" + schemaName + "_" + tableName,
              });

              // Also plain table name for convenience
              suggestions.push({
                label: tableName,
                kind: monaco.languages.CompletionItemKind.Class,
                detail: "table [" + schemaName + "]",
                insertText: tableName,
                range: range,
                sortText: "1a_" + tableName,
              });
            });
          });
        } else if (cache.tables && cache.tables.length > 0) {
          // Flat format (backward compatible)
          cache.tables.forEach(function (name) {
            suggestions.push({
              label: name,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: "table",
              insertText: name,
              range: range,
            });

            const alias = generateTableAlias(name);
            suggestions.push({
              label: name + " => " + alias,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: "table with alias",
              insertText: name + " " + alias,
              range: range,
              sortText: "1_" + name,
            });
          });
        }

        // Show columns (deduplicated, with schema info)
        var columnMap = {};  // Track columns and which schemas they belong to

        if (cache.columnsBySchema && Object.keys(cache.columnsBySchema).length > 0) {
          // Schema-organized: deduplicate columns and track schemas
          Object.entries(cache.columnsBySchema).forEach(function ([schemaName, columns]) {
            (columns || []).forEach(function (colName) {
              if (!columnMap[colName]) {
                columnMap[colName] = [];
              }
              columnMap[colName].push(schemaName);
            });
          });
        } else if (cache.columns && cache.columns.length > 0) {
          // Flat format: just deduplicate
          (cache.columns || []).forEach(function (colName) {
            columnMap[colName] = [];
          });
        }

        // Add deduplicated columns to suggestions
        Object.keys(columnMap).forEach(function (colName) {
          var detail = "column";
          var schemas = columnMap[colName];

          // Show schema info if available and column appears in multiple places
          if (schemas && schemas.length > 0 && schemas.length <= 3) {
            detail = "column [" + schemas.join(", ") + "]";
          } else if (schemas && schemas.length > 3) {
            detail = "column [multiple schemas]";
          }

          suggestions.push({
            label: colName,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: detail,
            insertText: colName,
            range: range,
            sortText: "2_" + colName,
          });
        });

        // Show functions
        if (cache.functionsBySchema && Object.keys(cache.functionsBySchema).length > 0) {
          // Schema-organized: show functions with schema prefix
          Object.entries(cache.functionsBySchema).forEach(function ([schemaName, functions]) {
            functions.forEach(function (funcName) {
              suggestions.push({
                label: schemaName + "." + funcName,
                kind: monaco.languages.CompletionItemKind.Function,
                detail: "function",
                insertText: schemaName + "." + funcName + "()",
                range: range,
                sortText: "3_" + schemaName + "_" + funcName,
              });

              suggestions.push({
                label: funcName,
                kind: monaco.languages.CompletionItemKind.Function,
                detail: "function [" + schemaName + "]",
                insertText: funcName + "()",
                range: range,
                sortText: "3a_" + funcName,
              });
            });
          });
        } else if (cache.functions && cache.functions.length > 0) {
          // Flat format (backward compatible)
          cache.functions.forEach(function (name) {
            suggestions.push({
              label: name,
              kind: monaco.languages.CompletionItemKind.Function,
              detail: "function",
              insertText: name + "()",
              range: range,
              sortText: "3_" + name,
            });
          });
        }
      }

      return { suggestions: suggestions };
    },
  });
}


webix.protoUI({
	name:"monaco-editor",
	defaults:{
		language:"sql",
		// theme: "vs-dark",
		// renderLineHighlight: "none",
		// "renderLineHighlight": "gutter",
		fontSize: "14px",
		// lineNumbers: "off",
		roundedSelection: false,
		scrollBeyondLastLine: false,
		readOnly: false,
		glyphMargin: false,
		// folding: true,
		lineDecorationsWidth: 4,
		lineNumbersMinChars: 4,
		overviewRulerLanes: 1, // biang kerok
		overviewRulerBorder: false, // biang kerok
		hideCursorInOverviewRuler: true,

		scrollbar: {
			// vertical: "hidden",
		},
		minimap: {
		enabled: false,
		},
	},
	$init:function(config){
		this._waitEditor = webix.promise.defer();
		this.$ready.push(this._render_editor);
	},
	_render_editor:function(){

		if (this.config.cdn === false){
			this._render_when_ready();
			return;
		};

		// var cdn = this.config.cdn || "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.32.1/min/";
		var cdn = this.config.cdn || "http://localhost:9000/assets/monaco-editor/";

		webix.require(cdn + "vs/loader.js")
		.then(webix.bind(function(){
			require.config({ paths: { 'vs': cdn+"vs" }});
			window.MonacoEnvironment = {
				getWorkerUrl: function(workerId, label) {
				  return "data:text/javascript;charset=utf-8,"+
				  encodeURIComponent("self.MonacoEnvironment = { baseUrl: '"+cdn+"' }; importScripts('"+cdn+"/vs/base/worker/workerMain.js');");
				}
			};

			this._render_when_ready();
		}, this))
		.catch(console.log);
	},
	_render_when_ready:function(){
		require(["vs/editor/editor.main"], webix.bind(function () {

			registerSqlCompletionProvider();

			var config = webix.copy(this.config);
			// this._editor = monaco.editor.create(this.$view, config);
			// console.log('config', config);

			// const originalModel = monaco.editor.createModel("heLLo world!", "text/plain");
			// const modifiedModel = monaco.editor.createModel("hello orlando!", "text/plain");

			// console.log('config.diffEditor', config.diffEditor);
			if(config.diffEditor){
				// console.log("OKKKKKK")
				this._editor = monaco.editor.createDiffEditor(this.$view, config);
				// this._editor.setModel({
				// 	original: originalModel,
				// 	modified: modifiedModel
				// });
			}else if(config.diffEditorInline){
				// enableSplitViewResizing: false,
				config.renderSideBySide=false;
				this._editor = monaco.editor.createDiffEditor(this.$view, config);

			}else{
				monaco.languages.registerCompletionItemProvider('sql', {
					provideCompletionItems: function(model, position) {
						var word = model.getWordUntilPosition(position);
						var range = {
							startLineNumber: position.lineNumber,
							endLineNumber: position.lineNumber,
							startColumn: word.startColumn,
							endColumn: word.endColumn
						};
						return {
							suggestions: createDependencyProposals(range)
						};
					}
				});
				this._editor = monaco.editor.create(this.$view, config);
			}
			// this._editor = monaco.editor.createDiffEditor(this.$view, config);
			// var diffEditor = monaco.editor.createDiffEditor(document.getElementById("container"));

			// Add onDidChangeContent event listener
			if (this._editor && this._editor.onDidChangeModelContent) {
			this._editor.onDidChangeModelContent(() => {
				if (this.config.on && this.config.on.onChange) {
				this.config.on.onChange.call(this);
				}
			});
			}

			this._waitEditor.resolve(this._editor);
		}, this));

		if (this._focus_await)
			this._editor.focus();
	},
	$setSize:function(x,y){
		if (webix.ui.view.prototype.$setSize.call(this, x, y) && this._editor){
			this._editor.layout()
		}
	},
	setValue:function(value){
		if(!value && value !== 0)
			value = "";

		this.config.value = value;
		if(this._editor){
			this._editor.setValue(value);
		}
	},
	goToLine:function(value){
		if(this._editor){
			this._editor.revealLine(value);
		}
	},
	getValue:function(){
		return this._editor?this._editor.getValue():this.config.value;
	},
	focus:function(){
		this._focus_await = true;
		if (this._editor)
			this._editor.focus();
	},
	getEditor:function(waitEditor){
	 	return waitEditor?this._waitEditor:this._editor;
	},
	setDiffValue: function (originalValue, modifiedValue) {
		// console.log(originalValue, modifiedValue);
		// console.log('config-setDiffValue', this.config);
		// if(this.config.diffEditor || config.diffEditorInline){
		if (this.config.diffEditor || this.config.diffEditorInline) {
			// const originalModel = monaco.editor.createModel(originalValue, "sql");
			const originalModel = monaco.editor.createModel(originalValue, "text/plain");
			const modifiedModel = monaco.editor.createModel(modifiedValue, "text/plain");
			this._editor.setModel({
				original: originalModel,
				modified: modifiedModel
			});
		}
	},
	getLineAndCharCount: function () {
      if (this._editor) {
        const model = this._editor.getModel();
        if (model) {
          const lineCount = model.getLineCount();
          const charCount = model.getValueLength();
          return {
            lines: lineCount,
            chars: charCount
          };
        }
      }
      return { lines: 0, chars: 0 };
    },
}, webix.ui.view);

// TEST UPGRADE MONACO
// https://snippet.webix.com/cekq039k