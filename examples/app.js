var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var App = (function (_super) {
    __extends(App, _super);
    function App() {
        var _this = _super.call(this) || this;
        console.log('new app', _this);
        document.body.appendChild(_this.view);
        PIXI.loader
            .add('table', 'res/table.png')
            .add('coin', 'res/coin1.png')
            .load(_this.onAssetsLoaded.bind(_this));
        return _this;
    }
    App.prototype.onAssetsLoaded = function (loader, res) {
        var table = new PIXI.Sprite(res.table.texture);
        app.stage.addChild(table);
        var coin = new PIXI.Sprite(res.coin.texture);
        this.coin = coin;
        coin.x = 100;
        coin.y = 150;
        coin.anchor.set(0.5);
        this.stage.addChild(coin);
        coin = new PIXI.Sprite(res.coin.texture);
        this.coin2 = coin;
        coin.x = 100;
        coin.y = 200;
        coin.anchor.set(0.5);
        this.stage.addChild(coin);
        this.ticker.add(function () {
            Anim.update();
        });
        this.initUI();
        this.ballAnim();
        this.myAnim
            .addListener(Anim.Events.CHANGE, this.onChangeAnim, this)
            .addListener(Anim.Events.END, function () {
            coin.rotation = 0;
            console.log('end');
        })
            .addListener('loop_step', function (eventData) {
            console.log('testEvent', eventData);
        });
    };
    App.prototype.initUI = function () {
        var pauseButton = document.getElementById('pauseButton');
        var self = this;
        pauseButton.onclick = function () {
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
        var slider = document.getElementById('slider');
        slider.oninput = this.onSlide.bind(this);
    };
    App.prototype.onSlide = function (event) {
        this.myAnim.setTime(this.myAnim.duration * event.target['value'] / 100);
    };
    App.prototype.onChangeAnim = function (event) {
        var slider = document.getElementById('slider');
        slider['value'] = event.player.position * 100;
    };
    App.prototype.ballAnim = function () {
        var coin = this.coin;
        this.myAnim =
            Anim.spawn([
                Anim.rotateFromTo(0, Math.PI * 2).setDuration(1000).loop(),
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
                Anim.moveFromToX(100, 600).setDuration(6000)
            ]);
        this.myAnim.setTarget(coin);
        console.log('myAnim', this.myAnim);
        return;
    };
    App.prototype.colorAnim = function () {
        var coin = this.coin;
        this.myAnim = Anim.tintTo(0xff0000)
            .setDuration(1000)
            .setTarget(coin)
            .play();
    };
    App.prototype.testAnim = function () {
        var coin = this.coin;
        this.myAnim = Anim.spawn([
            Anim.moveToX(200),
            Anim.moveToX(300).setTarget(this.coin2)
        ]).setDuration(1000)
            .setTarget(coin)
            .play();
    };
    return App;
}(PIXI.Application));
var app = new App();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQTtJQUFrQix1QkFBZ0I7SUFDOUI7UUFBQSxZQUNJLGlCQUFPLFNBUVY7UUFQRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFJLENBQUMsQ0FBQztRQUM3QixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckMsSUFBSSxDQUFDLE1BQU07YUFDTixHQUFHLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQzthQUM3QixHQUFHLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQzthQUM1QixJQUFJLENBQUMsS0FBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQzs7SUFDOUMsQ0FBQztJQUlELDRCQUFjLEdBQWQsVUFBZSxNQUEwQixFQUFFLEdBQU87UUFDOUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUIsSUFBSSxJQUFJLEdBQWUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDYixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTFCLElBQUksR0FBRyxJ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