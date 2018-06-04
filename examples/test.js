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
    //app.stage.addChild(table);
    //
    var coin = new PIXI.Sprite(res.coin.texture);
    coin.x = 200;
    coin.y = 150;
    coin.anchor.set(0.5);
    app.stage.addChild(coin);
    //
    app.ticker.add(function() {
        Anim.update();
    });
    //
    initUI();
    testAnim(coin);
}

function initUI() {
    var pauseButton = document.getElementById('pauseButton');
    pauseButton.onclick = function() {
        switch (myAnim.playState) {
            case Anim.PlayState.STOP:
            case Anim.PlayState.FINISH:
                myAnim.play();
                break;
            case Anim.PlayState.PLAY:
                myAnim.pause();
                break;
            case Anim.PlayState.PAUSE:
                myAnim.resume();
                break;
        }
    };
    //
    var slider = document.getElementById('slider');
    slider.oninput = function(event) {
        myAnim.setTime(myAnim.duration * event.target.value/100);
    };
}

function onChangeAnim(player) {
    var slider = document.getElementById('slider');
    slider.value = player.position*100;
}

var myAnim;
function testAnim(coin) {
    if (1) {
        myAnim = Anim.spawn([
            Anim.rotateTo(Math.PI*2).setDuration(1000).loop(),
            Anim.sequence([
                Anim.log('ping'),
                Anim.moveAddY(-70).easeStrongOut().setDuration(700),
                Anim.moveAddY(70).easeRegular().setDuration(300),
                Anim.warn('pong'),
                Anim.event('loop_step', true, [1, 'dd'])
            ]).loop(),
            Anim.moveAddX(500).setDuration(8000)
        ])
            .setTarget(coin)
            .addListener(Anim.Events.CHANGE, onChangeAnim)
            .addListener(Anim.Events.END, function() {
                coin.rotation = 0;
                console.log('end');
            })
            .play();
        console.log('myAnim', myAnim);
        myAnim.addListener('loop_step', function(eventData) {
            console.log('testEvent', eventData);
        });
        return;
    }
    myAnim = Anim.spawn([
        Anim.sequence([
            Anim.rotateTo(Math.PI*8).setDuration(4000),
            Anim.rotateTo(-Math.PI*4).setDuration(1000)
        ]),
        Anim.sequence([
            //Anim.timeout(1000),
            Anim.spawn([
                Anim.moveToY(150),
                Anim.moveToX(600),
                Anim.scaleTo(1, 1)
            ]).setDuration(2000),
            Anim.spawn([
                Anim.alphaTo(0),
                Anim.anchorTo(0, 0)
            ]).setDuration(500),
            Anim.callFunc(checkPoint, null, [1, 'param 2']),
            Anim.timeout(1000),
            Anim.spawn([
                Anim.alphaTo(1),
                Anim.anchorTo(0.5, 0.5)
            ]).setDuration(500),
            Anim.spawn([
                Anim.moveToX(200),
                Anim.scaleTo(1, 1)
            ]).setDuration(1000)
        ])
    ])
        .setTarget(coin)
        .addListener(Anim.Events.CHANGE, onChangeAnim);
        // .play();
    // myAnim.setTime(1000);
    console.log(myAnim);
}

function checkPoint(p1, p2) {
    console.log('checkPoint', p1, p2);
}