# animation
```js
Anim.spawn([
    Anim.rotateTo(Math.PI*2).setDuration(1000).loop(),
    Anim.sequence([
        Anim.log('ping'), // console.log
        Anim.spawn([
            Anim.moveAddY(-70).easeStrongOut(),
            Anim.tintTo(0xff0000),
        ]).setDuration(700),
        Anim.spawn([
            Anim.moveAddY(70),
            Anim.tintTo(0xffffff),
        ]).setDuration(300),
        Anim.warn('pong'), , // console.warn
        Anim.event('loop_step', true, [1, 'dd']) // drop custom event
    ]).loop(),
    Anim.moveAddX(600).setDuration(6000)
])
    .addListener('loop_step', function(eventData) {
        console.log('testEvent', eventData); // log custom event
    })
    .setTarget(coin)
    .play();
```
