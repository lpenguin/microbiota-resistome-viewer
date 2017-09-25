const d3 = require('d3');

class PlaybackController {
    constructor({views, interval, maxTicks, playerView}){
        this.views = views
        this.interval = interval
        this.maxTicks = maxTicks
        this.timer = null
        this.nTick = 0
        this.playerView = playerView

        this.playerView.on('player:play', ()=>{
            console.log('play')
            this.play()
        })

        this.playerView.on('player:reset', ()=>{
            console.log('reset')
            this.reset()
        })

        this.playerView.on('player:pause', ()=>{
            console.log('pause')
            this.pause()
        })

        this.playerView.on('player:step', ()=>{
            console.log('step')
            this.step()
        })
    }

    play(){
        this.playerView.setStatePlaying()
        this.timer = d3.interval(() => {
            this.step()
        }, this.interval)
    }

    step(){
        this.playerView.setTicks(this.nTick)
        if (this.nTick >= this.maxTicks) {
            this.pause()
            return
        }

        this.views.forEach(view => {
            view.tick(this.nTick)
        })
        this.nTick++
    }

    pause(){
        this.playerView.setStateStopped()
        if(this.timer){
            this.timer.stop()    
        }
        this.timer = null
    }

    reset(){
        this.pause()
        this.nTick = 0
        this.playerView.setTicks(0)
        this.views.forEach(view => {
            view.reset()
        })
    }
}

module.exports.PlaybackController = PlaybackController