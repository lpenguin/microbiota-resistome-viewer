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

        this._createTransitionsMap()
        this._recalcScales()

        this._createStates();
        window.addEventListener('resize', () => {
            console.log('resize');
            this._recalcScales();
            this._createStates();
        });

        this._svg.append("svg:defs")
        // .selectAll("marker")
        // .data(["suit", "licensing", "resolved"])
        .append("svg:marker")
        .attr("id", "marker-end")
        // .attr("viewBox", "0 -5 10 10")
        .attr("refX", 0)
        .attr("refY", 1)
        .attr("markerWidth", 2)
        .attr("markerHeight", 2)
        .attr("orient", "auto")
        // .attr('markerUnits', 'userSpaceOnUse')
        .append("svg:path")
        .attr("d", "M0,1 L0,2 L2,1 L0,0 L0,1");

        this._linksPath = this._svg.append("svg:g")
       
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
                if(stateFromName == stateToName){
                    continue
                }

                const transitionName = this._transtitionName(stateFromName, stateToName);
                this._transitionsMap[transitionName] = {
                    name: transitionName,
                    transitions: [],  // number of transitions per tick
                    source: this._statesMap[stateFromName],
                    target: this._statesMap[stateToName],
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
            .range([0, 7])
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
            transitionsInTick[transitionName] = (transitionsInTick[transitionName] || 0) + 1
        });

        for(let transitionName in this._transitionsMap){
            const transitions = transitionsInTick[transitionName] || 0
            this._transitionsMap[transitionName].transitions.push(transitions)
        }
    }

    _animateTransitions(){
        const transtitions = _.values(this._transitionsMap);

        const transitionElems = (
            this._linksPath
            .selectAll("path")
            .data(transtitions)
        )

        
        transitionElems
        .enter()
        .append("svg:path")
        .style('stroke-width', 0)
        .merge(transitionElems)
        .classed('link', true)
        .attr("d", d => {
            const [sx, tx] = [d.source.x, d.target.x].map(this._xScale);
            const [sy, ty] = [d.source.y, d.target.y].map(this._yScale);
            const [dx, dy] = [(tx - sx)/2, (ty - sy)/2];
            
            const r = Math.sqrt(dx * dx + dy * dy) 
            const c = r * Math.tan(Math.PI/6)

            const dx1 = c * dy / r
            const dy1 = c * dx / r
            
            const controlx = sx + dx - dx1
            const controly = sy + dy + dy1

            const res =  `M${sx},${sy} Q${controlx},${controly} ${tx},${ty}`;
            return res;
        })
        .transition()
        .duration(this._transitionDuration)
        .style('stroke-width', d => this._widthScale(sum(d.transitions.slice(-10))))
        .style('stroke', d => this._transitionColorScale(sum(d.transitions.slice(-10))))
        // .attr("marker-end", d => "url(#marker-end)")
        ;
        

        // const transtitions = _.values(this._transitionsMap);
        // console.log(transtitions.filter(t => t.transitions.length > 0).map(d => sum(d.transitions.slice(-10))))

        // const path = this._svg.append("svg:g")
        //         .selectAll("path")
        //         .data(transtitions)
        //         .enter()
        //         .append("svg:path");

        // path.attr("d", function(d) {
        //   var dx = d.target.x - d.source.x,
        //       dy = d.target.y - d.source.y,
        //       dr = 75;  //linknum is defined above
        //   return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        // });

        // let transitionLines = this._svg.selectAll('line.transition').data(transtitions);
        // transitionLines
        //     .enter()
        //     .append('line')
        //     .classed('transition', true)
        //     .merge(transitionLines)
        //     .attr('x1', d => this._xScale(d.stateFrom.x))
        //     .attr('y1', d => this._yScale(d.stateFrom.y))
        //     .attr('x2', d => this._xScale(d.stateTo.x))
        //     .attr('y2', d => this._yScale(d.stateTo.y))
        //     // .transition()
        //     // .duration(this._transitionDuration)
        //     .style('stroke-width', d => {
        //         return this._widthScale(sum(d.transitions.slice(-10)))
        //     })
        //     .style('stroke', d => this._transitionColorScale(sum(d.transitions.slice(-10))))
        // ;
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
            .attr('text-anchor', 'middle')
            .attr('x', d => this._xScale(d.x))
            .attr('y', d => this._yScale(d.y) - 5)
            .attr('dx', 10)
        ;

    }
}

module.exports.EdgesView = EdgesView;