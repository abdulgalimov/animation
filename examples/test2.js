/**
 * Created by Zaur abdulgalimov@gmail.com on 03.06.17.
 */

var app = new PIXI.Application();
document.body.appendChild(app.view);

PIXI.loader
    .add('table', 'examples/res/table.png')
    .add('coin1', 'examples/res/coin1.png')
    .add('coin2', 'examples/res/coin2.png')
    .add('coin3', 'examples/res/coin3.png')
    .add('coin4', 'examples/res/coin4.png')
    .add('coin5', 'examples/res/coin5.png')
    .load(onAssetsLoaded);

var coins = [];
function onAssetsLoaded(loader, res) {
    var table = new PIXI.Sprite(res.table.texture);
    app.stage.addChild(table);
    //
    function createCoin(num) {
        var coin = new PIXI.Sprite(res['coin'+num].texture);
        coin.x = 400;
        coin.y = 200;
        coin.alpha = 0;
        coin.anchor.set(0.5);
        app.stage.addChild(coin);
        coins.push(coin);
    }
    for (var i=0; i<5; i++) {
        createCoin(i+1);
    }
    //
    animation.util.ticker.registerStarter(function(active) {
        if (active) {
            app.ticker.add(animation.util.ticker.update, animation.util.ticker);
        } else {
            app.ticker.remove(animation.util.ticker.update, animation.util.ticker);
        }
    });
    //
    testAnim(coins);
}

var myAnim;
function testAnim(coins) {
    var an = animation;
    //
    var animsList = [];
    for (var i=0; i<5; i++) {
        var direction = Math.random() < 0.5 ? -1 : 1;
        var toX = direction * (50 + Math.random()*200);
        var timeout = Math.random()*400;
        var time = 600 + Math.random()*500;
        //
        var target = coins[i];
        //
        var anim = an.sequence([
                an.callFunc(function(target) {
                    target.alpha = 0;
                }, null, [target]),
                an.timeout(timeout),
                an.spawn([
                    an.rotateAdd(direction * Math.PI*2).duration(time*0.9),
                    an.moveAddX(toX).duration(time*2).easeStrongOut(),
                    an.moveToY(200).fluctuation(-200, 2, true),
                    an.alphaTo(1)
                ]).duration(time)
            ])
            .setTarget(target);
        //
        animsList.push(anim);
    }
    //
    myAnim = an.spawn(animsList)
        .finish()
        .loop()
        .play();
    console.log(myAnim);
}