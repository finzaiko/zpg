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
		vertical: "hidden",
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
		if(this.config.diffEditor || config.diffEditorInline){
			// const originalModel = monaco.editor.createModel(originalValue, "sql");
			const originalModel = monaco.editor.createModel(originalValue, "text/plain");
			const modifiedModel = monaco.editor.createModel(modifiedValue, "text/plain");
			this._editor.setModel({
				original: originalModel,
				modified: modifiedModel
			});
		}
	}
}, webix.ui.view);

// TEST UPGRADE MONACO
// https://snippet.webix.com/cekq039k