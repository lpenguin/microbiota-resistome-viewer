const Data = require('./views/data');
const {AgentsView} = require('./views/agentsView');
const {LineChartView} = require('./views/lineChartView');
const d3 = require('d3');
const async = require('async');
const {ipcRenderer} = require('electron');

const {Player} = require('./player');

ipcRenderer.on('loadDataAndRun', (event, data)=>{
    const {abundanceFile, transLogFile} = data;
    loadDataAndRun(abundanceFile, transLogFile);
});

let player = null;

function loadDataAndRun(abundanceFile, transLogFile) {
    async.parallel([
        async.apply(Data.loadTransitions, transLogFile),
        async.apply(Data.loadTicks, abundanceFile),
    ], (err, result) => {
        let [transitions, abundance] = result;

        const transitionDuration = 500;
        const agentsView = new AgentsView({
            abundance: abundance,
            ticks: transitions,
            targetId: "#svg",
            transitionDuration: transitionDuration,
        });

        const abundanceView = new LineChartView({
            target: 'abundance',
            type: 'area',
            abundance: Data.getSeries(abundance, [
                'InfectedPersonsInTown',
                'IncPeriodPersonsInTown',
                'IncPeriodPersonsInTown2',
                'AntibioticTreatedPersonsInTown',
                'AntibioticTreatedPersonsInTown2',
                'InfectedPersonsInHospital',
                'HealthyPersonsInHospital',
            ]),
            title: 'Persons',
            ylabel: 'Persons',
        });

        const resistanceView = new LineChartView({
            target: 'resistance',
            type: 'line',
            abundance: Data.getSeries(abundance, [
                'pGetInfectedTown',
                'AvMicResistance',
                'AvPathResistance',
            ]),
            title: 'Resitance related',
        });

        player = new Player({
            views: [
                agentsView,
                abundanceView,
                resistanceView,
            ],
            interval: transitionDuration + 50,
            maxTicks: transitions.length,
        })
    });
}

document.getElementById('btn-play').onclick = ()=>{
    console.log('play');
    player.play();
};

document.getElementById('btn-reset').onclick = ()=>{
    console.log('reset');
    player.reset();
};

document.getElementById('btn-pause').onclick = ()=>{
    console.log('pause');
    player.pause();
};


// document.getElementById('btn-reset', ()=>{
//     console.log('reset');
// });

// document.getElementById('btn-pause', ()=>{
//     console.log('pause');
// });
