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
                Anim.rotateTo(Math.PI * 2).setDuration(1000).loop(),
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
    return App;
}(PIXI.Application));
var app = new App();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQTtJQUFrQix1QkFBZ0I7SUFDOUI7UUFBQSxZQUNJLGlCQUFPLFNBUVY7UUFQRyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFJLENBQUMsQ0FBQztRQUM3QixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckMsSUFBSSxDQUFDLE1BQU07YUFDTixHQUFHLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQzthQUM3QixHQUFHLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQzthQUM1QixJQUFJLENBQUMsS0FBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLENBQUMsQ0FBQzs7SUFDOUMsQ0FBQztJQUdELDRCQUFjLEdBQWQsVUFBZSxNQUEwQixFQUFFLEdBQU87UUFDOUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0MsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFMUIsSUFBSSxJQUFJLEdBQWUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDekQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDYixJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTFCLElBQUksQ0FBQyxN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