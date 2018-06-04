
class App extends PIXI.Application{
    constructor() {
        super();
        console.log('new app', this);
        document.body.appendChild(this.view);
        //
        PIXI.loader
            .add('table', 'res/table.png')
            .add('coin', 'res/coin1.png')
            .load(this.onAssetsLoaded.bind(this));
    }

    private coin:PIXI.Sprite;
    onAssetsLoaded(loader:PIXI.loaders.Loader, res:any):void {
        let table = new PIXI.Sprite(res.table.texture);
        app.stage.addChild(table);
        //
        let coin:PIXI.Sprite = new PIXI.Sprite(res.coin.texture);
        this.coin = coin;
        coin.x = 100;
        coin.y = 150;
        coin.anchor.set(0.5);
        this.stage.addChild(coin);
        //
        this.ticker.add(function() {
            Anim.update();
        });
        //
        this.initUI();
        this.ballAnim();
        // this.colorAnim();
        this.myAnim
            .addListener(Anim.Events.CHANGE, this.onChangeAnim, this)
            .addListener(Anim.Events.END, function() {
                coin.rotation = 0;
                console.log('end');
            })
            .addListener('loop_step', function(eventData) {
            console.log('testEvent', eventData);
        });
    }

    initUI():void {
        let pauseButton = document.getElementById('pauseButton');
        const self:App = this;
        pauseButton.onclick = function() {
            switch (self.myAnim.playState) {
                case Anim.PlayState.STOP:
                case Anim.PlayState.FINISH:
                    self.myAnim.play();
                    break;
                case Anim.PlayState.PLAY:
                    self.myAnim.pause();
                    break;
                case Anim.PlayState.PAUSE:
                    self.myAnim.resume();
                    break;
            }
        };
        //
        let slider = document.getElementById('slider');
        slider.oninput = this.onSlide.bind(this);
    }

    onSlide(event:Event):void {
        this.myAnim.setTime(this.myAnim.duration * event.target['value']/100);
    }

    onChangeAnim(event:Anim.EventData):void {
        let slider = document.getElementById('slider');
        slider['value'] = event.player.position*100;
    }

    myAnim:Anim.Player;
    ballAnim():void {
        const coin:PIXI.Sprite = this.coin;
        this.myAnim =
        //
        Anim.spawn([
            Anim.rotateTo(Math.PI*2).setDuration(1000).loop(),
            Anim.sequence([
                Anim.log('ping'),
                Anim.spawn([
                    Anim.moveAddY(-70).easeStrongOut(),
                    Anim.tintTo(0xff0000),
                ]).setDuration(700),
                Anim.spawn([
                    Anim.moveAddY(70),
                    Anim.tintTo(0xffffff),
                ]).setDuration(300),
                Anim.warn('pong'),
                Anim.event('loop_step', true, [1, 'dd'])
            ]).loop(),
            Anim.moveAddX(600).setDuration(6000)
        ]);
        //
        this.myAnim.setTarget(coin);
        console.log('myAnim', this.myAnim);
        return;
    }

    colorAnim():void {
        const coin:PIXI.Sprite = this.coin;
        this.myAnim = Anim.tintTo(0xff0000)
            .setDuration(1000)
            .setTarget(coin)
            .play();
    }
}

const app:App = new App();