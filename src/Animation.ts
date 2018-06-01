

module Anim {
    class GlobalItems {
        startTime:number = 0;
        time:number = 0;
        items:Array<Player> = [];
        update(dtime) {
            if (arguments.length === 1) {
                this.time += dtime;
            } else {
                if (this.startTime === 0) {
                    this.startTime = Date.now();
                }
                let oldTime = this.time;
                this.time = Date.now()-this.startTime;
                dtime = this.time-oldTime;
            }
            //
            for (let i=0; i<this.items.length; i++) {
                this.items[i]._updateRoot(dtime);
            }
        }

        add(player:Player):void {
            const index:number = this.items.indexOf(player);
            if (index === -1) this.items.push(player);
        }
        del(player:Player):void {
            const index:number = this.items.indexOf(player);
            if (index !== -1) this.items.splice(index, 1);
        }
    }
    const global:GlobalItems = new GlobalItems;
    export function update():void {
        global.update.apply(global, arguments);
    }

    function log(...args):void {
        console.log.apply(console, args);
    }

    function dropError(message) {
        throw new Error(`AnimError: ${message}`);
    }

    type PropsType = {
        [key:string]:number
    };
    class PropsContainer {
        values: PropsType = {};

        addProps(props:PropsContainer):void {
            for (let key in props.values) {
                this.values[key] = props.values[key];
            }
        }
        clear():void {
            this.values = {};
        }
    }
    class State {
        target: any;
        rootStartTime: number = 0;
        beginTime: number = 0;
        elapsedTime: number = 0;
        position: number = 0;
        duration: number = 0;
        from: PropsContainer;
        to: PropsContainer;
        constructor() {
            this.from = new PropsContainer();
            this.to = new PropsContainer();
        }
        clear():void {
            this.beginTime = 0;
            this.elapsedTime = 0;
            this.position = 0;
            this.duration = 0;
            this.from.clear();
            this.to.clear();
        }
    }

    enum Flags {
        STATIC  = 0x1,
        COLOR   = 0x2
    }

    export enum PlayState {
        STOP = 1,
        PLAY,
        PAUSE,
        FINISH
    }


    export enum Events {
        BEGIN = 'begin',
        CHANGE = 'change',
        END = 'end'
    }
    type EventNameType = Events.BEGIN|Events.CHANGE|Events.END;
    type ListenerCallback = (player:Player)=>void;
    type ListenersType = {
        [key:string]:ListenerCallback;
    };

    export class Player {
        private _name:string;
        protected _parent:Player = null;
        _duration:number = 0;
        protected _target:any;
        public _state:State;
        public _flags:number = 0;
        private _pausedTime:number = 0;
        private _playState:PlayState = PlayState.STOP;
        private _listeners:ListenersType;
        private _isProcess:boolean;
        constructor() {
            this._state = new State();
        }

        get target():any {
            let self:Player = this;
            while (!self._target && self._parent) self = self._parent;
            return self._target;
        }
        get position():number {return this._state.position;}
        get elapsedTime():number {return this._state.elapsedTime;}
        get duration():number {return this._state.duration;}
        get isProcess():boolean {return this._isProcess;}
        get playState():PlayState {return this._playState;}

        private _setPlayState(state:PlayState) {
            this._playState = state;
        }

        private _dropEvent(event:EventNameType):void {
            if (this._listeners && this._listeners[event]) {
                this._listeners[event](this);
            }
        }

        _setParent(parent:Player):void {
            this._parent = parent;
        }

        _updateRoot(deltaTime:number):void {
            switch (this._playState) {
                case PlayState.STOP:
                    break;
                case PlayState.PLAY:
                    this._state.elapsedTime = global.time - this._state.rootStartTime - this._pausedTime;
                    this._update(deltaTime, this._state.elapsedTime);
                    if (this._state.elapsedTime === this._state.duration) {
                        this._setPlayState(PlayState.FINISH);
                        global.del(this);
                    }
                    break;
                case PlayState.PAUSE:
                    this._pausedTime += deltaTime;
                    break;
            }
        }
        _update(deltaTime:number, rootElapsed:number):void {
            if (this._parent) {
                this._state.elapsedTime = rootElapsed - this._state.beginTime;
            }
            if (this._state.elapsedTime >= 0 && this._state.elapsedTime < this._state.duration) {
                if (!this._isProcess) {
                    this._isProcess = true;
                    //this._state.elapsedTime = 0;
                    this._dropEvent(Events.BEGIN);
                    this._dropEvent(Events.CHANGE);
                }
            }
            //
            if (this._state.elapsedTime < 0) this._state.elapsedTime = 0;
            if (this._state.elapsedTime > this._state.duration) this._state.elapsedTime = this._state.duration;
            const p = this._state.duration ? this._state.elapsedTime/this._state.duration : 0;
            if (p !== this._state.position) {
                this._state.position = p;
                this._apply();
            }
            //
            if (this._state.elapsedTime === this._state.duration) {
                if (this._isProcess) {
                    this._isProcess = false;
                    this._dropEvent(Events.CHANGE);
                    this._dropEvent(Events.END);
                }
            } else if (this._state.elapsedTime > 0) {
                this._dropEvent(Events.CHANGE);
            }

        }

        _apply():void {

        }

        private _calculated:boolean;
        _calculate(props:PropsContainer):void {
            this._calculated = true;
            this._state.target = this.target;
            this._state.elapsedTime = 0;
            this._state.position = 0;
            this._isProcess = false;
            if (this._duration) {
                this._state.duration = this._duration;
            }
        }

        _replay():void {
            this._state.elapsedTime = 0;
            this._state.position = 0;
        }

        get name():string {return this._name;}
        setName(name:string=null):Player {
            this._name = name;
            return this;
        }

        public setTarget(target:any):Player {
            this._target = target;
            return this;
        }

        public setDuration(duration:number):Player {
            this._duration = duration;
            return this;
        }

        public setTime(time:number):void {
            //if (!this._target) dropError('Target undefined');
            if (this._parent) dropError('Method play available in root anim only');
            //
            if (this._playState !== PlayState.PLAY) {
                if (!this._calculated) this._startCalc();
                //
                this._pausedTime = 0;
                this._state.elapsedTime = time;
                this._update(0, this._state.elapsedTime);
            }
        }
        private _startCalc():void {
            const props:PropsContainer = new PropsContainer();
            props.clear();
            this._calculate(props);
        }
        public play():Player {
            // if (!this._target) dropError('Target undefined');
            if (this._parent) dropError('Method play available in root anim only');
            //
            if (!this._calculated) {
                this._startCalc();
            } else {
                this._replay();
            }
            //
            global.add(this);
            this._pausedTime = 0;
            this._state.rootStartTime = global.time;
            this._setPlayState(PlayState.PLAY);
            //
            return this;
        }

        public stop():Player {
            if (this._parent) dropError('Method play available in root anim only');
            global.del(this);
            this._setPlayState(PlayState.STOP);
            return this;
        }

        public pause():void {
            if (this._playState === PlayState.PLAY) {
                this._setPlayState(PlayState.PAUSE);
            }
        }
        public resume():void {
            if (this._playState === PlayState.PAUSE) {
                this._setPlayState(PlayState.PLAY);
            }
        }
        public togglePause():void {
            switch (this._playState) {
                case PlayState.PAUSE:
                    this._setPlayState(PlayState.PLAY);
                    break;
                case PlayState.PLAY:
                    this._setPlayState(PlayState.PAUSE);
                    break;
            }
        }

        public addListener(name:Events, func:(player:Player)=>void):Player {
            if (!this._listeners) this._listeners = {};
            this._listeners[name] = func;
            return this;
        }
    }

    class Static extends Player {
        protected activated:boolean;
        constructor() {
            super();
            this._flags |= Flags.STATIC;
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
            this._state.duration = 0;
            this.activated = false;
        }

        _update(deltaTime:number, rootElapsed:number):void {
            super._update(deltaTime, rootElapsed);
             if (!this.activated && rootElapsed >= this._state.beginTime) {
                 this.activated = true;
                 this._activate();
             }
        }

        _activate() {}
    }

    class CallFunc extends Static {
        constructor(private callback:Function, private context:any, private params:Array<any>) {
            super();
        }

        _activate() {
            this.callback.apply(this.context, this.params||[]);
        }
    }

    class Visible extends Static {
        constructor(private value:boolean) {
            super();
        }

        _activate() {
            this._state.target.visible = this.value;
        }
    }
    class RemoveFromParent extends Static {
        constructor() {
            super();
        }

        _activate() {
            if (this._state.target.parent) {
                this._state.target.parent.removeChild(this._state.target);
            }
        }
    }
    class AddToParent extends Static {
        constructor(private parentCont:any) {
            super();
        }

        _activate() {
            this.parentCont.addChild(this._state.target);
        }
    }

    class Interval extends Player {
        constructor() {
            super();
        }
    }

    type EaseFuncType = (t:number, b:number, c:number, d:number) => number;

    class Property extends Interval {
        private _props:PropsType;
        private _keys:Array<string>;
        private _relative:boolean;
        private _ease:EaseFuncType;
        constructor(props:PropsType=null) {
            super();
            this.setName('property');
            this.setProps(props);
        }

        easeRegular():Property {this._ease = regular;return this;}
        easeCustom(func:EaseFuncType):Property {this._ease = func;return this;}
        easeStrongOut():Property {this._ease = strongOut;return this;}
        easeStrongIn():Property {this._ease = strongIn;return this;}
        easeStrongInOut():Property {this._ease = strongInOut;return this;}
        easeBackOut():Property {this._ease = backOut;return this;}
        easeBackIn():Property {this._ease = backIn;return this;}
        easeBackInOut():Property {this._ease = backInOut;return this;}
        easeElasticIn():Property {this._ease = elasticIn;return this;}
        easeElasticOut():Property {this._ease = elasticOut;return this;}
        easeElasticInOut():Property {this._ease = elasticInOut;return this;}
        easeCircIn():Property {this._ease = circIn;return this;}
        easeCircOut():Property {this._ease = circOut;return this;}
        easeCircInOut():Property {this._ease = circInOut;return this;}
        easeCubicIn():Property {this._ease = cubicIn;return this;}
        easeCubicOut():Property {this._ease = cubicOut;return this;}
        easeCubicInOut():Property {this._ease = cubicInOut;return this;}
        easeExpIn():Property {this._ease = expIn;return this;}
        easeExpOut():Property {this._ease = expOut;return this;}
        easeExpInOut():Property {this._ease = expInOut;return this;}
        easeQuadIn():Property {this._ease = quadIn;return this;}
        easeQuadOut():Property {this._ease = quadOut;return this;}
        easeQuadInOut():Property {this._ease = quadInOut;return this;}
        easeQuartIn():Property {this._ease = quartIn;return this;}
        easeQuartOut():Property {this._ease = quartOut;return this;}
        easeQuartInOut():Property {this._ease = quartInOut;return this;}
        easeQuintIn():Property {this._ease = quintIn;return this;}
        easeQuintOut():Property {this._ease = quintOut;return this;}
        easeQuintInOut():Property {this._ease = quintInOut;return this;}
        easeSinIn():Property {this._ease = sinIn;return this;}
        easeSinOut():Property {this._ease = sinOut;return this;}
        easeSinInOut():Property {this._ease = sinInOut;return this;}
        easeBounceIn():Property {this._ease = bounceIn;return this;}
        easeBounceOut():Property {this._ease = bounceOut;return this;}
        easeBounceInOut():Property {this._ease = bounceInOut;return this;}

        setProps(props:PropsType):Property {
            this._props = props;
            this._keys = [];
            for (let key in props) {
                this._keys.push(key);
            }
            return this;
        }

        _setRelative(value:boolean):Property {
            this._relative = value;
            return this;
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
            //
            this._state.from.clear();
            this._state.to.clear();
            //
            for (let i=0; i<this._keys.length; i++) {
                const key = this._keys[i];
                //
                if (props.values.hasOwnProperty(key)) {
                    this._state.from.values[key] = props.values[key];
                } else {
                    let value:number;
                    switch (key) {
                        case 'scaleX':
                            value = this._state.target.scale.x;
                            break;
                        case 'scaleY':
                            value = this._state.target.scale.y;
                            break;
                        case 'anchorX':
                            value = this._state.target.anchor.x;
                            break;
                        case 'anchorY':
                            value = this._state.target.anchor.y;
                            break;
                        case 'pivotX':
                            value = this._state.target.pivot.x;
                            break;
                        case 'pivotY':
                            value = this._state.target.pivot.y;
                            break;
                        default:
                            value = this._state.target[key];
                            break;
                    }
                    this._state.from.values[key] = value;
                }
                //
                this._state.to.values[key] = this._props[key];
                if (this._relative) {
                    this._state.to.values[key] += this._state.from.values[key];
                }
            }
            //
            props.addProps(this._state.to);
        }

        _apply():void {
            if (this._ease) {
                this._state.position = this._ease(this._state.position, 0, 1, 1);
            }
            for (let i=0; i<this._keys.length; i++) {
                const key = this._keys[i];
                this.setValue(key);
            }
        }

        protected setValue(key:string):void {
            const value = this._state.from.values[key] + (this._state.to.values[key] - this._state.from.values[key]) * this._state.position;
            switch (key) {
                case 'scaleX':
                    this._state.target.scale.x = value;
                    break;
                case 'scaleY':
                    this._state.target.scale.y = value;
                    break;
                case 'anchorX':
                    this._state.target.anchor.x = value;
                    break;
                case 'anchorY':
                    this._state.target.anchor.y = value;
                    break;
                case 'pivotX':
                    this._state.target.pivot.x = value;
                    break;
                case 'pivotY':
                    this._state.target.pivot.y = value;
                    break;
                default:
                    this._state.target[key] = value;
                    break;
            }
        }
    }

    class Color extends Property {
        private readonly propName:string;
        private readonly fromRgb:Rgb;
        private readonly toRgb:Rgb;
        private readonly interpolateRgb:Rgb;
        public color:number;
        constructor(propName:string, props:PropsType=null) {
            super(props);
            this._flags |= Flags.COLOR;
            this.propName = propName;
            this.fromRgb = new Rgb();
            this.toRgb = new Rgb();
            this.interpolateRgb = new Rgb();
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
            //
            this.fromRgb.update(this._state.from.values[this.propName]);
            this.toRgb.update(this._state.to.values[this.propName]);
        }

        protected setValue(key:string):void {
            Rgb.interpolation(this.fromRgb, this.toRgb, this._state.position, this.interpolateRgb);
            this.color = this.interpolateRgb.color;
            this._state.target[this.propName] = this.color;
        }
    }

    class Group extends Interval {
        constructor(protected items:Array<Player>) {
            super();
            for (let i=0; i<items.length; i++) {
                items[i]._setParent(this);
            }
        }

        _replay():void {
            super._replay();
            for (let i=0; i<this.items.length; i++) {
                this.items[i]._replay();
            }
        }

        _update(deltaTime:number, rootElapsed:number):void {
            for (let i=0; i<this.items.length; i++) {
                this.items[i]._update(deltaTime, rootElapsed);
            }
            super._update(deltaTime, rootElapsed);
        }
    }

    class Spawn extends Group {
        constructor(items:Array<Player>) {
            super(items);
            this.setName('Spawn');
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
            //
            let maxDuration:number = 0;
            for (let i=0; i<this.items.length; i++) {
                const item = this.items[i];
                if (this._state.duration) {
                    item._state.duration = this._state.duration;
                }
                item._calculate(props);
                maxDuration = Math.max(maxDuration, item._state.duration);
                if (!(item._flags & Flags.STATIC)) item._state.beginTime = this._state.beginTime;
            }
            if (!this._duration) this._state.duration = maxDuration;
        }
    }

    class Sequence extends Group {
        constructor(items:Array<Player>) {
            super(items);
            this.setName('Sequence');
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
            //
            let setDuration:number = 0;
            let unsetCount:number = 0;
            for (let i=0; i<this.items.length; i++) {
                let item = this.items[i];
                if (item._duration || item._flags & Flags.STATIC) {
                    setDuration += item._duration;
                } else {
                    unsetCount++;
                }
            }
            if (!this._duration && unsetCount) {
                dropError('Sequence duration=0 & there are items with duration=0');
                return;
            }
            let unsetDuration:number = unsetCount ? (this._duration-setDuration)/unsetCount : 0;
            let beginTime:number = this._state.beginTime;
            let fullDuration:number = 0;
            for (let i=0; i<this.items.length; i++) {
                let item = this.items[i];
                if (!item._duration && !(item._flags & Flags.STATIC)) {
                    item._state.duration = unsetDuration;
                }
                item._state.beginTime = beginTime;
                item._calculate(props);
                beginTime += item._state.duration;
                fullDuration += item._state.duration;
            }
            if (!this._duration) {
                this._state.duration = fullDuration;
            }
        }
    }

    // properties ********************************************************************************

    // custom
    export function customTo(props:PropsType):Property {
        return new Property().setProps(props);
    }
    export function customAdd(props:PropsType):Property {return customTo(props)._setRelative(true);}

    export function timeout(time:number):Interval {
        const player:Interval = new Interval();
        player.setDuration(time);
        return player;
    }

    // move
    export function moveToX(x:number):Property {
        return new Property().setProps({x: x});
    }
    export function moveToY(y:number):Property {
        return new Property().setProps({y: y});
    }
    export function moveTo(xOrPos:number|object, y:number=0):Property {
        const move:Property = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                x: xOrPos['x'],
                y: xOrPos['y']
            });
        } else {
            move.setProps({
                x: xOrPos,
                y: y
            });
        }
        return move;
    }
    export function moveAddX(x:number):Property {return moveToX(x)._setRelative(true);}
    export function moveAddY(y:number):Property {return moveToY(y)._setRelative(true);}
    export function moveAdd(xOrPos:number|object, y:number=0):Property {return moveTo(xOrPos, y)._setRelative(true);}


    // scale
    export function scaleToX(scaleX:number):Property {
        return new Property().setProps({scaleX: scaleX});
    }
    export function scaleToY(scaleY:number):Property {
        return new Property().setProps({scaleY: scaleY});
    }
    export function scaleTo(xOrPos:number|object, y:number=0):Property {
        const move:Property = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                scaleX: xOrPos['x'],
                scaleY: xOrPos['y']
            });
        } else {
            move.setProps({
                scaleX: xOrPos,
                scaleY: y
            });
        }
        return move;
    }
    export function scaleAddX(x:number):Property {return scaleToX(x)._setRelative(true);}
    export function scaleAddY(y:number):Property {return scaleToY(y)._setRelative(true);}
    export function scaleAdd(xOrPos:number|object, y:number=0):Property {return scaleTo(xOrPos, y)._setRelative(true);}

    // size (width, height)
    export function widthTo(width:number):Property {
        return new Property().setProps({width: width});
    }
    export function heightTo(height:number):Property {
        return new Property().setProps({height: height});
    }
    export function sizeTo(widthOrSize:number|object, height:number=0):Property {
        const move:Property = new Property();
        if (typeof widthOrSize !== 'number') {
            move.setProps({
                width: widthOrSize['width'],
                height: widthOrSize['height']
            });
        } else {
            move.setProps({
                width: widthOrSize,
                height: height
            });
        }
        return move;
    }
    export function widthAdd(width:number):Property {return widthTo(width)._setRelative(true);}
    export function heightAdd(height:number):Property {return heightTo(height)._setRelative(true);}
    export function sizeAdd(widthOrSize:number|object, height:number=0):Property {return sizeAdd(widthOrSize, height)._setRelative(true);}

    // anchor
    export function anchorToX(anchorX:number):Property {
        return new Property().setProps({anchorX: anchorX});
    }
    export function anchorToY(anchorY:number):Property {
        return new Property().setProps({anchorY: anchorY});
    }
    export function anchorTo(xOrPos:number|object, y:number=0):Property {
        const move:Property = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                anchorX: xOrPos['x'],
                anchorY: xOrPos['y']
            });
        } else {
            move.setProps({
                anchorX: xOrPos,
                anchorY: y
            });
        }
        return move;
    }
    export function anchorAddX(x:number):Property {return anchorToX(x)._setRelative(true);}
    export function anchorAddY(y:number):Property {return anchorToY(y)._setRelative(true);}
    export function anchorAdd(xOrPos:number|object, y:number=0):Property {return anchorTo(xOrPos, y)._setRelative(true);}

    // pivot
    export function pivotToX(pivotX:number):Property {
        return new Property().setProps({pivotX: pivotX});
    }
    export function pivotToY(pivotY:number):Property {
        return new Property().setProps({pivotY: pivotY});
    }
    export function pivotTo(xOrPos:number|object, y:number=0):Property {
        const move:Property = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                pivotX: xOrPos['x'],
                pivotY: xOrPos['y']
            });
        } else {
            move.setProps({
                pivotX: xOrPos,
                pivotY: y
            });
        }
        return move;
    }
    export function pivotAddX(x:number):Property {return pivotToX(x)._setRelative(true);}
    export function pivotAddY(y:number):Property {return pivotToY(y)._setRelative(true);}
    export function pivotAdd(xOrPos:number|object, y:number=0):Property {return pivotTo(xOrPos, y)._setRelative(true);}

    // rotate
    export function rotateTo(rotate:number):Property {
        return new Property().setProps({rotation: rotate});
    }
    export function rotateAdd(rotate:number):Property {return rotateTo(rotate)._setRelative(true);}

    // alpha
    export function alphaTo(alpha:number):Property {
        return new Property().setProps({alpha: alpha});
    }
    export function alphaAdd(alpha:number):Property {return alphaTo(alpha)._setRelative(true);}
    export function fadeIn():Property {return alphaTo(0);}
    export function fadeOut():Property {return alphaTo(1);}

    // color
    export function colorTo(propName:string, color:number):Color {
        const colorAnim:Color = new Color(propName);
        colorAnim.setProps({tint: color});
        return colorAnim;
    }
    export function tintTo(color:number):Color {return colorTo('tint', color);}

    // group
    export function spawn(list:Array<Player>):Spawn {
        return new Spawn(list);
    }
    export function sequence(list:Array<Player>):Sequence {
        return new Sequence(list);
    }

    // static
    export function callFunc(callback:Function, context:any=null, params:Array<any>=null):CallFunc {
        return new CallFunc(callback, context, params);
    }

    export function visible(value:boolean):Visible {
        return new Visible(value);
    }
    export function show():Visible {return visible(true);}
    export function hide():Visible {return visible(false);}

    export function removeFromParent():RemoveFromParent {
        return new RemoveFromParent();
    }
    export function addToParent(parent:any):AddToParent {
        return new AddToParent(parent);
    }

    // easing *************************************************************************************

    function regular(t, b, c, d) {
        return t;
    }

    function strongIn(t, b, c, d) {
        return c*(t/=d)*t*t*t*t+b;
    }
    function strongOut(t, b, c, d) {
        return c*((t=t/d-1)*t*t*t*t+1)+b;
    }
    function strongInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t*t+b;
        //
        return c/2*((t-=2)*t*t*t*t+2)+b;
    }

    const backConst:number = 1.70158;
    function backIn(t, b, c, d)  {
        return c*(t/=d)*t*((backConst+1)*t - backConst) + b;
    }
    function backOut(t, b, c, d) {
        return c*((t=t/d-1)*t*((backConst+1)*t + backConst) + 1) + b;
    }
    function backInOut(t, b, c, d) {
        let s = backConst;
        if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        //
        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
    }

    function elasticIn(t, b, c, d) {
        let a = 0;
        let p = 0;
        if (t === 0) return b;
        if ((t /= d) === 1) return b + c;
        if (!p) p = d * 0.3;
        let s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        } else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    function elasticOut(t, b, c, d) {
        let a = 0;
        let p = 0;
        if (t === 0) return b;
        if ((t /= d) === 1) return b + c;
        if (!p) p = d * 0.3;
        let s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        } else{
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
    function elasticInOut(t, b, c, d) {
        let a = 0;
        let p = 0;
        if (t === 0) return b;
        if ((t /= d / 2) === 2) return b + c;
        if (!p) p = d * (0.3 * 1.5);
        let s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        } else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        if (t < 1) {
            return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) /p)) + b;
        }

        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p ) * 0.5 + c + b;
    }

    function circIn(t, b, c, d) {
        return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
    }
    function circOut(t, b, c, d) {
        return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
    }
    function circInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        //
        return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
    }

    function cubicIn(t, b, c, d) {
        return c*(t/=d)*t*t + b;
    }
    function cubicOut(t, b, c, d) {
        return c*((t=t/d-1)*t*t + 1) + b;
    }
    function cubicInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t + b;
        //
        return c/2*((t-=2)*t*t + 2) + b;
    }

    function expIn(t, b, c, d) {
        return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
    }
    function expOut(t, b, c, d) {
        return (t===d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
    }
    function expInOut(t, b, c, d) {
        if (t===0) return b;
        if (t===d) return b+c;
        if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
        //
        return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }

    function quadIn(t, b, c, d) {
        return c*(t/=d)*t + b;
    }
    function quadOut(t, b, c, d) {
        return -c *(t/=d)*(t-2) + b;
    }
    function quadInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        //
        return -c/2 * ((--t)*(t-2) - 1) + b;
    }

    function quartIn(t, b, c, d) {
        return c*(t/=d)*t*t*t + b;
    }
    function quartOut(t, b, c, d) {
        return -c * ((t=t/d-1)*t*t*t - 1) + b;
    }
    function quartInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
        //
        return -c/2 * ((t-=2)*t*t*t - 2) + b;
    }

    function quintIn(t, b, c, d) {
        return c*(t/=d)*t*t*t*t + b;
    }
    function quintOut(t, b, c, d) {
        return c*((t=t/d-1)*t*t*t*t + 1) + b;
    }
    function quintInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
        return c/2*((t-=2)*t*t*t*t + 2) + b;
    }

    function sinIn(t, b, c, d) {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
    }
    function sinOut(t, b, c, d) {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
    }
    function sinInOut(t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    }

    function bounceIn(t, b, c, d) {
        return c-bounceOut(d-t, 0, c, d);
    }
    function bounceOut(t, b, c, d) {
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        } else if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
        } else if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
        } else {
            return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
        }
    }
    function bounceInOut(t, b, c, d) {
        if (t < d/2) return bounceIn(t*2, 0, c, d) * .5 + b;
        return bounceOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
    }

    // rgb

    class Rgb {
        color:number;
        alpha:number;
        red:number;
        green:number;
        blue:number;
        withAlpha:boolean;
        constructor(color:number=0, withAlpha:boolean=true) {
            this.update(color);
        }

        public update(color:number):void {
            this.color = color;
            if (color > 0) {
                if (this.withAlpha) {
                    this.alpha = (color >> 24) & 0xff;
                } else {
                    this.alpha = 255;
                }
                this.red = (color >> 16) & 0xff;
                this.green = (color >> 8) & 0xff;
                this.blue = color & 0xff;
            } else {
                this.alpha = this.withAlpha ? 0 : 255;
                this.red = 0;
                this.green = 0;
                this.blue = 0;
            }
        }

        private updateRgb(red:number, green:number, blue:number, alpha:number):void {
            this.red = red;
            this.green = green;
            this.blue = blue;
            this.alpha = alpha;
            this.color = alpha << 24 | red << 16 | green << 8 | blue;
        }

        static interpolation(from, to, percent, rgb:Rgb=null):Rgb {
            const alpha = from.alpha + (to.alpha - from.alpha) * percent;
            const red = from.red + (to.red - from.red) * percent;
            const green = from.green + (to.green - from.green) * percent;
            const blue = from.blue + (to.blue - from.blue) * percent;
            rgb = rgb || new Rgb();
            rgb.updateRgb(red, green, blue, alpha);
            return rgb;
        }
    }
}
