const d3 = require('d3');
const _ = require('underscore');
const {BaseView} = require('./baseView');
const {Data} = require('./data')


function sum(values) {
    return values.reduce((x, y) => x + y, 0)
}

class EdgesView extends BaseView {
    constructor({abundance, ticks, targetId, transitionDuration=500}){
        super();
        this._states = this._convertAbundance(abundance);
        this._ticks = ticks;

        this._svg = d3.select(targetId);
        this._transitionDuration = transitionDuration;

        this._statesMap = _.object(this._states.map(s => s.name), this._states);
        console.log(this._statesMap)
        this._createTransitionsMap()
        this._recalcScales()
        
        this._createStates();
        window.addEventListener('resize', () => {
            console.log('resize');
            this._recalcScales();
            this._createStates();
        });
    }

    reset(){
        this._createTransitionsMap()
    }

    _transtitionName(fromName, toName){
        return `${fromName}:${toName}`
    }

    _createTransitionsMap(){
        this._transitionsMap = {};
        for(let stateFromName in this._statesMap){
            for(let stateToName in this._statesMap){
                const transitionName = this._transtitionName(stateFromName, stateToName);
                this._transitionsMap[transitionName] = {
                    name: transitionName,
                    transitions: [],  // number of transitions per tick
                    stateFrom: this._statesMap[stateFromName],
                    stateTo: this._statesMap[stateToName],
                }
            }                
        }
    }

    _convertAbundance(abundance){
        const statesMap = {
            "HealthyPersonsInTown": "townHealthyPersons",
            "IncPeriodPersonsInTown": "townIncPerPersons",
            "IncPeriodPersonsInTown2": "townIncPerPersons2",
            "AntibioticTreatedPersonsInTown": "townAntTrPersons",
            "AntibioticTreatedPersonsInTown2": "townAntTrPersons2",
            "InfectedPersonsInHospital": "hospAntTrPersons",
            "HealthyPersonsInHospital": "healthyHospPeople",
        };
        
        let firstPoint = abundance[0];

        const nStates = Object.keys(statesMap).length;
        const step = Math.PI * 2 / nStates;
        let alpha = 0;

        return _.map(statesMap, (transLogName, abundName) => {
            const x = Math.cos(alpha) * 0.5 + 0.5;
            const y = Math.sin(alpha) * 0.5 + 0.5;
            const count = firstPoint[abundName];
            if(count === undefined){
                console.warn(`${abundName} not found in abundance table`);
                count = 0;
            }
            alpha += step;
            
            return {
                name: transLogName,
                count: parseInt(count),
                x: x,
                y: y
            }

        });
    }

    _recalcScales(){
        let svgBox = this._svg.node().getBoundingClientRect();

        this._width = svgBox.width;
        this._height = svgBox.height;

        this._xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([50, this._width - 50]);

        this._yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([50, this._height - 50]);

        this._countsScale = d3.scaleLog()
            .domain([1, 10000])
            .range([3, 50])
            .clamp(true);

        this._widthScale = d3.scaleLinear()
            .domain([0, 200])
            .range([0, 10])
            .clamp(true);

        this._transitionColorScale = d3.scaleLinear()
                                    .domain([0, 100, 200])
                                    .range(['blue', 'yellow', 'red']);

    }

    tick(nTick) {
        let events = this._ticks[nTick]
        this._tickTransitions(events)
        this._animateTransitions()
        // this._animateEvents(events);
        this._animateStates(events)
    }

    _stateX(stateName) {
        let state = this._statesMap[stateName];
        return this._xScale(state.x);
    }

    _stateY(stateName) {
        let state = this._statesMap[stateName];
        return this._yScale(state.y);
    }

    _tickTransitions(events){
        const transitionsInTick = {}

        events.forEach((event) => {
            const transitionName = this._transtitionName(event.oldState, event.newState)

            // const transition = this._transitionsMap[this._transtitionName(event.oldState, event.newState)];
            transitionsInTick[transitionName] = (transitionsInTick[transitionName] || 0) + 1
        });

        for(let transitionName in this._transitionsMap){
            const transitions = transitionsInTick[transitionName] || 0
            this._transitionsMap[transitionName].transitions.push(transitions)
        }
    }

    // _animateEvents(events) {
    //     let circleAgent = this._svg.selectAll("circle.agent").data(events);

    //     circleAgent
    //         .enter()
    //         .append('circle')
    //         .classed('agent', true)
    //         .attr('cx', d => this._stateX(d.oldState))
    //         .attr('cy', d => this._stateY(d.oldState))
    //         .attr("r", 2.5)
    //         .transition()
    //         .duration(this._transitionDuration)
    //         .delay((d, i) => {
    //             return Math.random() * this._transitionDuration / 10
    //         })
    //         .attr('cx', d => this._stateX(d.newState))
    //         .attr('cy', d => this._stateY(d.newState))
    //         .remove();
    //     // .call(d3_transition_endall, callback);
    //     // .on('end', function(){callback();});
    // }

    _animateTransitions(){
        const transtitions = _.values(this._transitionsMap);
        console.log(transtitions.filter(t => t.transitions.length > 0).map(d => sum(d.transitions.slice(-10))))

        let transitionLines = this._svg.selectAll('line.transition').data(transtitions);
        transitionLines
            .enter()
            .append('line')
            .classed('transition', true)
            .merge(transitionLines)
            .attr('x1', d => this._xScale(d.stateFrom.x))
            .attr('y1', d => this._yScale(d.stateFrom.y))
            .attr('x2', d => this._xScale(d.stateTo.x))
            .attr('y2', d => this._yScale(d.stateTo.y))
            // .transition()
            // .duration(this._transitionDuration)
            .style('stroke-width', d => {
                return this._widthScale(sum(d.transitions.slice(-10)))
            })
            .style('stroke', d => this._transitionColorScale(sum(d.transitions.slice(-10))))
        ;
    }

    _animateStates(events) {
        events.forEach((e) => {
            this._statesMap[e.oldState].count = Math.max(0, this._statesMap[e.oldState].count - 1);
            this._statesMap[e.newState].count = Math.max(0, this._statesMap[e.newState].count + 1);
        });

        let stateCircle = this._svg.selectAll("circle.state").data(this._states);

        stateCircle
            .transition()
            .duration(this._transitionDuration * 0.4)
            .delay(this._transitionDuration * 0.6)
            .attr('cx', d => this._xScale(d.x))
            .attr('cy', d => this._yScale(d.y))
            .attr('r', d =>  this._countsScale(d.count))
        ;

        this._svg
            .selectAll("text.state")
            .data(this._states)
            .text(d => d.name + " " + d.count);
    }

    _createStates() {
        let stateCircle = this._svg.selectAll("circle.state").data(this._states);

        stateCircle
            .enter()
            .append('circle')
            .classed('state', true)
            .merge(stateCircle)
            .attr('cx', d => this._xScale(d.x))
            .attr('cy', d => this._yScale(d.y))
            .attr('r', d =>  this._countsScale(d.count))
        ;

        let stateText = this._svg.selectAll("text.state").data(this._states);

        stateText
            .enter()
            .append('text')
            .classed('state', true)
            .merge(stateText)
            .text(d => d.name + " " + d.count)
            .attr('x', d => this._xScale(d.x))
            .attr('y', d => this._yScale(d.y))
            .attr('dx', 10)
        ;

    }
}

module.exports.EdgesView = EdgesView;