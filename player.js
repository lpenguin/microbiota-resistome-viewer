const d3 = require('d3');

class Player {
    constructor({views, interval, maxTicks}){
        this.views = views
        this.interval = interval
        this.maxTicks = maxTicks
        this.timer = null
        this.nTick = 0
    }

    play(){
        this.timer = d3.interval(() => {
            if (this.nTick >= this.maxTicks) {
                timer.stop()
                return
            }

            this._updateViews(this.nTick)
            this.nTick++
        }, this.interval)
    }

    pause(){
        this.timer.stop()
    }

    reset(){
        this.timer.stop()
        this.nTick = 0
    }

    _updateViews(nTick){
        this.views.forEach(view => {
            view.tick(nTick)
        })
    }
}

module.exports.Player = Player