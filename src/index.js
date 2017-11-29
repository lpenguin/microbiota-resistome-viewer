const Data = require('./views/data');
const { StatesView } = require('./views/statesView');
const {LineChartView} = require('./views/lineChartView');
const d3 = require('d3');
const async = require('async');
const {ipcRenderer} = require('electron');

const {PlaybackController} = require('./playbackController');
const {PlayerView} = require('./views/playerView')


ipcRenderer.on('loadDataAndRun', (event, data)=>{
    const {abundanceFile, transLogFile} = data;
    loadDataAndRun(abundanceFile, transLogFile);
});

function loadDataAndRun(abundanceFile, transLogFile) {
    async.parallel([
        async.apply(Data.loadTransitions, transLogFile),
        async.apply(Data.loadTicks, abundanceFile),
    ], (err, result) => {
        ['abundance', 'resistance', 'svg', 'svg-edges'].forEach((id)=>{
            document.getElementById(id).innerHTML = ''
        })

        let [transitions, abundance] = result;

        const transitionDuration = 500;

        const playerView = new PlayerView({
            maxTicks: abundance.length,
        })

        playerView.show()
        let views = [
            new LineChartView({
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
            }),
            new LineChartView({
                target: 'resistance',
                type: 'line',
                abundance: Data.getSeries(abundance, [
                    'pGetInfectedTown',
                    'AvMicResistance',
                    'AvPathResistance',
                ]),
                title: 'Resitance related',
            })
        ]

        if(transitions){
            views.push(new StatesView({
                abundance: abundance,
                ticks: transitions,
                targetId: "#svg",
                transitionDuration: transitionDuration,
                animateAgents: true,
                animateStates: true,
            }))

            views.push(new StatesView({
                    abundance: abundance,
                    ticks: transitions,
                    targetId: "#svg-edges",
                    transitionDuration: transitionDuration,
                    animateTransitionFrequency: true,
                }))
        }

        const player = new PlaybackController({
            views: views,
            interval: transitionDuration + 50,
            maxTicks: abundance.length,
            playerView: playerView,
        })
    })
}