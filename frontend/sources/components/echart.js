import { BACKEND_URL } from "../config/setting";

export function loadExComponentEChart() {
    const loadECharts = () => {
        return new Promise((resolve, reject) => {
            // webix.require("https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js")
            webix.require(`${BACKEND_URL}/assets/echarts/echarts.min.js`)
                .then(() => {
                    if (typeof echarts !== 'undefined') {
                        resolve(echarts);
                    } else {
                        reject(new Error('ECharts not loaded properly'));
                    }
                })
                .catch(reject);
        });
    };

    webix.protoUI(
        {
            name: "echart",
            defaults: {
                theme: "light",
                renderer: "canvas"
            },
            $init: function(config) {
                this._waitChart = webix.promise.defer();
                this.$view.style.position = "relative";
                this.$ready.push(this._init_chart);
                this.config.theme = this.config.theme || this.defaults.theme;

                // Initialize with explicit size
                this.$view.style.width = "100%";
                this.$view.style.height = "100%";
            },
            _init_chart: function() {
                loadECharts().then((echartsLib) => {
                    this.echartsLib = echartsLib;
                    this._render_chart();
                }).catch(e => {
                    console.error("Failed to load ECharts:", e);
                    this._waitChart.reject(e);
                });
            },
            _render_chart: function() {
                // Ensure we have a size before trying to render
                if (this.$view.clientWidth === 0 || this.$view.clientHeight === 0) {
                    webix.delay(this._render_chart, this, [], 100);
                    return;
                }
                this._render_when_ready();
            },
            _render_when_ready: function() {
                try {
                    if (!this._chart && this.echartsLib) {
                        this._chart = this.echartsLib.init(this.$view, this.config.theme);
                        this._waitChart.resolve(this._chart);

                        if (this.config.option) {
                           this.setOption(this.config.option);
                        }
                    }
                } catch (e) {
                    console.error("Error initializing chart:", e);
                }
            },
            $setSize: function(x, y) {
                if (webix.ui.view.prototype.$setSize.call(this, x, y)) {
                    // Ensure positive dimensions
                    if (x > 0 && y > 0) {
                        if (!this._chart) {
                            this._render_when_ready();
                        } else {
                            this._chart.resize({width: x, height: y});
                        }
                    }
                }
            },
            setTheme: function(theme) {
                if (this._chart) {
                    const currentOption = this._chart.getOption();
                    this._chart.dispose();
                    this.config.theme = theme;
                    this._chart = this.echartsLib.init(this.$view, theme);
                    this._chart.setOption(currentOption);
                } else {
                    this.config.theme = theme;
                }
            },
           setOption: function(option, notMerge, lazyUpdate) {
               if (this._chart) {
                   // Use predefined colorful palette if colors are not specified
                   if (!option.color) {
                       option.color = [
                           '#5470c6',
                           '#91cc75',
                           '#fac858',
                           '#ee6666',
                           '#73c0de',
                           '#3ba272',
                           '#fc8452',
                           '#9a60b4',
                           '#ea7ccc'
                       ];
                   }
                   this._chart.setOption(option, notMerge, lazyUpdate);
               } else {
                   this.config.option = option;
               }
           },
            getOption: function() {
                return this._chart ? this._chart.getOption() : this.config.option;
            },
            getChart: function(waitChart) {
                return waitChart ? this._waitChart : this._chart;
            },
            clear: function() {
                if (this._chart) {
                    this._chart.clear();
                }
            },
            showLoading: function(text) {
                if (this._chart) {
                    this._chart.showLoading(text);
                }
            },
            hideLoading: function() {
                if (this._chart) {
                    this._chart.hideLoading();
                }
            },
            dispose: function() {
                if (this._chart) {
                    this._chart.dispose();
                }
            }
        },
        webix.ui.view
    );
}
