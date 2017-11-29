const d3 = require('d3');
const _ = require('underscore');
const fs = require('fs')
const Data = {
    generateEvents: function (nTicks, maxEventsPerTick, states) {
        var events = [];
        for (let nTick = 0; nTick < nTicks; nTick++) {
            const nEvents = Math.random() * maxEventsPerTick | 0;
            for (let nEvent = 0; nEvent < nEvents; nEvent++) {
                const oldState = states[Math.random() * states.length | 0];

                let newState;
                while ((newState = states[Math.random() * states.length | 0]) === oldState) {
                }

                const event = {
                    tick: nTick,
                    oldState: oldState.name,
                    newState: newState.name
                };
                events.push(event);
            }
        }
        return events;
    },
    groupEvents: function (events) {
        const eventsGrouped = d3.nest()
            .key(function (d) {
                return d.tick;
            })
            .entries(events);

        return eventsGrouped.map(function (e) {
            return e.values;
        })
    },
    loadStates: function (url, callback) {
        fs.readFile(url, 'utf8', function (err, data) {
            if (err) {
                callback(err, null);
            }
            data = d3.tsvParse(data);
            const nStates = _.keys(data[0]).length;
            const step = Math.PI * 2 / nStates;
            let alpha = 0;

            const states = _.map(data[0], (count, stateName) => {
                const x = Math.cos(alpha) * 0.5 + 0.5;
                const y = Math.sin(alpha) * 0.5 + 0.5;
                alpha += step;
                return {
                    name: stateName,
                    count: parseInt(count),
                    x: x,
                    y: y
                }
            });
            callback(null, states);
        });
    },
    loadTicks: function(url, callback){
        fs.readFile(url, 'utf8', function (err, result){
            if(err){
                callback(err, null);
            }
            let data = d3.tsvParse(result).map(row => {
                return _.mapObject(row, (value, key) => parseFloat(value));
            })
            callback(null, data);
        });
    },
    loadTransitions: function (url, callback) {
        if(!url){
            callback(null, null);
            return;
        }

        fs.readFile(url, 'utf8', function (err, data) {
            if (err) {
                callback(err, null);
            }

            data = d3.tsvParse(data);
            const events = data.map((t) => {
                return {
                    tick: t['Ticks'],
                    oldState: t['TransFromClass'],
                    newState: t['TransToClass']
                }
            })
            .filter(t => t.oldState != "NA");

            const ticks = Data.groupEvents(events);
            callback(null, ticks);
        });
    },
    getColumn: function(data, column){
        return data.map(x => x[column]);
    },
    getSeries: function(data, columns=null){
        if(!columns){
            columns = _.keys(data[0]);    
        }
        
        return columns.map(c => {return {name: c, data: Data.getColumn(data, c)}});
    }


};

module.exports = Data;


