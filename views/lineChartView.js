const Highcharts = require('highcharts');
const Data = require('./data');
const _ = require('underscore');
const {BaseView} = require('./baseView')

class LineChartView extends BaseView {
    constructor({target, abundance, title, ylabel='', type='line'}){
        super();
        this._target = target;
        this._title = title;
        this._ylabel = ylabel;
        this._series = abundance;
        if(type == 'area'){
            this._ymax = this._series.map(s => _.max(s.data)).reduce((a, b) => a + b, 0);
        }else{
            this._ymax = _.max(this._series.map(s => _.max(s.data)));
        }
        
        this._type = type;
        this._render();
    }

    _render(){
        let firstPoint = this._series.map(series => {
            return {
                name: series.name,
                data: [series.data[0]],
            }
        });
        this._chart = Highcharts.chart(this._target, {
            chart: {
                type: this._type
            },
            title: {
                text: this._title
            },
            subtitle: {
            },
            xAxis: {
                tickmarkPlacement: 'on',
                title: {
                    text: 'Ticks'
                },
                max: this._series[0].data.length,
            },
            yAxis: {
                title: {
                    text: this._ylabel
                },
                max: this._ymax
            },
            tooltip: {
                split: true,
            },
            plotOptions: {
                line: {
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                },
                area: {
                    animation: false,
                    stacking: 'normal',
                    lineColor: '#666666',
                    lineWidth: 1,
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {
                                enabled: true
                            }
                        }
                    }
                }
            },
            series: firstPoint,
        });
    }

    tick(nTick){
        this._series.forEach((s, i) => {
            let newPoint = s.data[nTick];
            this._chart.series[i].addPoint([nTick, newPoint], false, false, false);
        });
        this._chart.redraw();
    }

    reset(){
        this._chart.destroy()
        this._render()
    }
}

module.exports.LineChartView = LineChartView;