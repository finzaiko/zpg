
webix.protoUI({
	name:"monaco-editor",
	defaults:{
		language:"sql",
		// theme: "vs-dark",
		renderLineHighlight: "none",
		fontSize: "12px",
		// lineNumbers: "off",
		roundedSelection: false,
		scrollBeyondLastLine: false,
		readOnly: false,
		glyphMargin: false,
		// folding: true,
		lineDecorationsWidth: 4,
		lineNumbersMinChars: 4,
		renderLineHighlight: "none",
		// // "renderLineHighlight": "gutter",
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

		var cdn = this.config.cdn || "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.18.0/min/";

		webix.require(cdn + "vs/loader.js")
		.then(webix.bind(function(){
			require.config({ paths: { 'vs': cdn+"vs/" }});
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
			}else{
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
	getValue:function(){
		return this._editor?this._editor.getValue():this.config.value;
	},
	goToLine:function(value){
		if(this._editor){
			this._editor.revealLine(value);
		}
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
		if(this.config.diffEditor){
			const originalModel = monaco.editor.createModel(originalValue, "text/plain");
			const modifiedModel = monaco.editor.createModel(modifiedValue, "text/plain");
			this._editor.setModel({
				original: originalModel,
				modified: modifiedModel
			});
		}
	}
}, webix.ui.view);