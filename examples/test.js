/**
 * Created by Zaur abdulgalimov@gmail.com on 03.06.17.
 */

var app = new PIXI.Application();
document.body.appendChild(app.view);

PIXI.loader
    .add('table', 'examples/res/table.png')
    .add('coin', 'examples/res/coin1.png')
    .load(onAssetsLoaded);

function onAssetsLoaded(loader, res) {
    var table = new PIXI.Sprite(res.table.texture);
    app.stage.addChild(table);
    //
    var coin = new PIXI.Sprite(res.coin.texture);
    coin.x = 200;
    coin.y = 150;
    coin.anchor.set(0.5);
    app.stage.addChild(coin);
    //
    animation.util.ticker.registerStarter(function(active) {
        if (active) {
            app.ticker.add(animation.util.ticker.update, animation.util.ticker);
        } else {
            app.ticker.remove(animation.util.ticker.update, animation.util.ticker);
        }
    });
    //
    initUI();
    testAnim(coin);
}

function initUI() {
    var pauseButton = document.getElementById('pauseButton');
    pauseButton.onclick = function() {
        switch (myAnim.state) {
            case animation.State.STOP:
                myAnim.play();
                break;
            case animation.State.PLAY:
                myAnim.pause();
                break;
            case animation.State.PAUSE:
                myAnim.resume();
                break;
        }
    };
    //
    var slider = document.getElementById('slider');
    slider.oninput = function(event) {
        myAnim.gotoAndStop(6000 * event.target.value/100);
    };
}

function onChangeAnim(event) {
    var slider = document.getElementById('slider');
    slider.value = event.percent*100;
}

var myAnim;
function testAnim(coin) {
    var an = animation;
    //
    myAnim = an.spawn([
        an.sequence([
            an.rotateTo(Math.PI*8).duration(4000),
            an.rotateTo(-Math.PI*4).duration(2000)
        ]),
        an.sequence([
            an.timeout(1000),
            an.spawn([
                an.moveToY(150).fluctuation(-100, 6, true),
                an.moveToX(600),
                an.scaleTo(1, 1)
            ]).duration(2000),
            an.spawn([
                an.alphaTo(0),
                an.anchorTo(0, 0)
            ]).duration(500),
            an.callFunc(checkPoint, null, [1, 'param 2']),
            an.timeout(1000),
            an.spawn([
                an.alphaTo(1),
                an.anchorTo(0.5, 0.5)
            ]).duration(500),
            an.spawn([
                an.moveToX(200),
                an.scaleTo(1, 1)
            ]).duration(1000)
        ])
    ])
        .setTarget(coin)
        .finish()
        .loop()
        .on('change', onChangeAnim);
    console.log(myAnim);
}

function checkPoint(p1, p2) {
    console.log('checkPoint', p1, p2);
}