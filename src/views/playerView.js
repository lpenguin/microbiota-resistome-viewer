const EventEmitter = require('events');

class PlayerView extends EventEmitter {
    constructor({maxTicks}){
        super()
        this.maxTicks = maxTicks

        this.panelElement = document.getElementById('panel-controls')


        this.ticksText = document.getElementById('text-ticks')

        this.playButton = document.getElementById('btn-play')
        this.pauseButton = document.getElementById('btn-pause')
        this.resetButton = document.getElementById('btn-reset')
        this.stepButton = document.getElementById('btn-step')

        this.playButton.addEventListener('click', ()=>{
            this.emit('player:play')
        })

        this.resetButton.addEventListener('click', ()=>{
            this.emit('player:reset')
        })

        this.pauseButton.addEventListener('click', ()=>{
            this.emit('player:pause')
        })

        this.stepButton.addEventListener('click', ()=>{
            this.emit('player:step')
        })

        
        this.setTicks(0)
        this.setStateStopped()
    }

    removeEventListeners(){

    }

    show(){
        this.panelElement.style.visibility = 'visible'
    }

    setTicks(nTick){
        this.ticksText.innerText = nTick + " of " + this.maxTicks
    }

    setStateStopped(){
        this.playButton.style.display = 'inline'
        this.pauseButton.style.display = 'none'
    }

    setStatePlaying(){
        this.playButton.style.display = 'none'
        this.pauseButton.style.display = 'inline'
    }
}

module.exports.PlayerView = PlayerView