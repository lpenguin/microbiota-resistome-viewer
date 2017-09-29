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
        this._constStatesCount = 200
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
        .append("svg:marker")
        .attr("id", "marker-end")
        .classed('marker', true)
        .attr("refX", 3.5)
        .attr("refY", 2)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M1,2 L0,4 L4,2 L0,0 L1,2");

        this._linksPath = this._svg.append("svg:g")
        
       
    }

    reset(){
        this._createTransitionsMap()
        this._animateTransitions()
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
            .domain([0, 1.9, 2, 200])
            .range([0, 0, 1.5, 6])
            .clamp(true);

        this._opacityScale = d3.scaleLinear()
            .domain([0, 200])
            .range([0, 1])
            .clamp(true);

        this._transitionColorScale = d3.scaleLinear()
                                    .domain([0, 50, 150, 200])
                                    .range(['rgb(90, 113, 226)', 'green', 'yellow', 'red']);

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


    _distance(sx, sy, tx, ty){
        let [dx, dy] = [tx - sx, ty - sy]
        return Math.sqrt(dx * dx + dy * dy)
    }

    _calcControlPoint(sx, sy, tx, ty){
        const [dx, dy] = [(tx - sx)/2, (ty - sy)/2];
        const r =  this._distance(sx, sy, tx, ty) / 2
        const c = r * Math.tan(Math.PI/6)
        const dx1 = c * dy / r
        const dy1 = c * dx / r

        const controlx = sx + dx - dx1
        const controly = sy + dy + dy1

        return [controlx, controly]
    }

    _calcEdgePoints(x1, y1, x2, y2, offset){
        const r = this._distance(x1, y1, x2, y2)
        const [dx, dy] = [x2 - x1, y2 - y1]
        
        const [dx1, dy1] = [offset/r * dx, offset/r * dy]

        const [edgeX1, edgeY1] = [x1 + dx1, y1 + dy1]

        return [edgeX1, edgeY1]
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
        // .style('stroke-opacity', 0)
        .merge(transitionElems)
        .classed('link', true)
        .attr("marker-end", d => "url(#marker-end)")
        .transition()
        .duration(this._transitionDuration)
        .attr("d", d => {
            const [sx, tx] = [d.source.x, d.target.x].map(this._xScale);
            const [sy, ty] = [d.source.y, d.target.y].map(this._yScale);

            const sr = this._countsScale(this._constStatesCount)
            const tr = this._countsScale(this._constStatesCount)

            const [controlx, controly] = this._calcControlPoint(sx, sy, tx, ty)
            const [sEdgeX, sEdgeY] = this._calcEdgePoints(sx, sy, controlx, controly, sr)
            const [tEdgeX, tEdgeY] = this._calcEdgePoints(tx, ty, controlx, controly, tr)

            // const r = this._distance(sx, sy, tx, ty)

            // const [dx, dy] = [tx - sx, ty - sy]
            // const [sdx, sdy] = [sr/r * dx, sr/r * dy]
            // const [tdx, tdy] = [tr/r * dx, tr/r * dy]

            // const [sx1, sy1] = [sx + sdx, sy + sdy]
            // const [tx1, ty1] = [tx - tdx, ty - tdy]
            
            // const [controlx, controly] = this._calcControlPoint(sx, sy, tx, ty)
            // const [controlx, controly] = this._calcControlPoint(sEdgeX, sEdgeY, tEdgeX, tEdgeY)
            
            // const res =  `M${sx},${sy} Q${controlx},${controly} ${tx},${ty}`;
            const res =  `M${sEdgeX},${sEdgeY} Q${controlx},${controly} ${tEdgeX},${tEdgeY}`;
            return res;
        })
        // .style('stroke-opacity', d => this._opacityScale(sum(d.transitions.slice(-10))))
        .style('stroke-width', d => this._widthScale(sum(d.transitions.slice(-10))))
        .style('stroke', d => this._transitionColorScale(sum(d.transitions.slice(-10))))
        ;
    }

    _animateStates(events) {
        // events.forEach((e) => {
        //     this._statesMap[e.oldState].count = Math.max(0, this._statesMap[e.oldState].count - 1);
        //     this._statesMap[e.newState].count = Math.max(0, this._statesMap[e.newState].count + 1);
        // });

        // let stateCircle = this._svg.selectAll("circle.state").data(this._states);

        // stateCircle
        //     .transition()
        //     .duration(this._transitionDuration * 0.4)
        //     .delay(this._transitionDuration * 0.6)
        //     .attr('cx', d => this._xScale(d.x))
        //     .attr('cy', d => this._yScale(d.y))
        //     .attr('r', d =>  this._countsScale(d.count))
        // ;

        // this._svg
        //     .selectAll("text.state")
        //     .data(this._states)
        //     .text(d => d.name + " " + d.count);
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
            .attr('r', d =>  this._countsScale(200))
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