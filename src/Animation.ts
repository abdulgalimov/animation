

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

    function dropError(message) {
        throw new Error(`AnimError: ${message}`);
    }

    export type Properties = {
        [key:string]:number
    };
    export type Targets = {
        [key:string]:Properties
    };
    class PropsContainer {
        private targets: Targets = {};

        get(target:any, key:string):number {
            return this.targets[target.__anim_id] ? this.targets[target.__anim_id][key] : 0;
        }
        has(target:any, key:string):boolean {
            return this.targets[target.__anim_id] && this.targets[target.__anim_id].hasOwnProperty(key);
        }
        set(target:any, key:string, value:number):void {
            if (!this.targets[target.__anim_id]) this.targets[target.__anim_id] = {};
            this.targets[target.__anim_id][key] = value;
        }
        add(target:any, key:string, value:number):void {
            if (!this.targets[target.__anim_id]) this.targets[target.__anim_id] = {};
            if (!this.targets[target.__anim_id][key]) this.targets[target.__anim_id][key] = 0;
            this.targets[target.__anim_id][key] += value;
        }

        addProps(props:PropsContainer):void {
            for (let key in props.targets) {
                if (!this.targets[key]) this.targets[key] = {};
                for (let key2 in props.targets[key]) {
                    this.targets[key][key2] = props.targets[key][key2];
                }
            }
        }
        clear():void {
            this.targets = {};
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
        PLAY = 2,
        PAUSE = 3,
        RESUME = 4,
        FINISH = 5
    }


    export enum Events {
        BEGIN = 'begin',
        CHANGE = 'change',
        LOOP = 'loop',
        END = 'end'
    }
    type EventNameType = Events.BEGIN|Events.CHANGE|Events.LOOP|Events.END;
    type ListenerCallback = (event:EventData)=>void;
    type ListenersType = {
        [key:string]: {
            func: ListenerCallback,
            context: any
        };
    };



    export class Player {
        private _name:string;
        /**@hidden*/
        public _parent:Player = null;
        /**@hidden*/
        public _duration:number = 0;
        protected _target:any;
        /**@hidden*/
        public _state:State;
        /**@hidden*/
        public _flags:number = 0;
        private _pausedTime:number = 0;
        private _playState:PlayState = PlayState.STOP;
        private _listeners:ListenersType;
        private _isProcess:boolean;
        private _loop:Boolean;
        private _loopCount:number;
        /**@hidden*/
        constructor() {
            this._state = new State();
        }

        private _setPlayState(state:PlayState) {
            this._playState = state;
        }

        private _dropEvent(eventName:EventNameType):void {
            const eventData:EventData = new EventData(this, eventName);
            this._dropEventData(eventData);
        }

        /**@hidden*/
        _dropEventData(eventData:EventData):void {
            if (this._listeners && this._listeners[eventData.eventName]) {
                this._listeners[eventData.eventName].func.call(
                    this._listeners[eventData.eventName].context,
                    eventData
                );
            }
        }

        /**@hidden*/
        _setParent(parent:Player):void {
            this._parent = parent;
        }

        /**@hidden*/
        _updateRoot(deltaTime:number):void {
            switch (this._playState) {
                case PlayState.STOP:
                    break;
                case PlayState.PLAY:
                    this._state.elapsedTime = global.time - this._state.rootStartTime - this._pausedTime;
                    this._update(this._state.elapsedTime);
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

        /**@hidden*/
        _update(parentTime:number):void {
            if (this._parent) {
                this._state.elapsedTime = parentTime - this._state.beginTime;
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
            if (this._loop) {
                if (this._state.elapsedTime > this._state.duration) {
                    let loopCount:number = Math.floor(this._state.elapsedTime/this._state.duration);
                    let newValue:number = this._state.elapsedTime - loopCount * this._state.duration;
                    if (loopCount !== this._loopCount) {
                        this._loopCount = loopCount;
                        this._state.elapsedTime = this._state.duration;
                        this._state.position = 1;
                        this._apply();
                        this._dropEvent(Events.LOOP);
                        this._replay();
                    }
                    //
                    this._state.elapsedTime = newValue;
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

        /**@hidden*/
        _apply():void {

        }

        private _calculated:boolean;
        /**@hidden*/
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

        /**@hidden*/
        _replay():void {
            this._state.elapsedTime = 0;
            this._state.position = 0;
        }

        private _startCalc():void {
            const props:PropsContainer = new PropsContainer();
            props.clear();
            this._calculate(props);
        }

        /** public API **************************************************** */

        get target():any {
            let self:Player = this;
            while (!self._target && self._parent) self = self._parent;
            return self._target;
        }

        /**
         * Position 0..1
         * @returns {number}
         */
        get position():number {return this._state.position;}

        /**
         * Time in milliseconds
         * @returns {number}
         */
        get elapsedTime():number {return this._state.elapsedTime;}
        /**
         * Duration in milliseconds
         * @returns {number}
         */
        get duration():number {return this._state.duration;}

        /**
         * Player is playing now
         * @returns {boolean}
         */
        get isProcess():boolean {return this._isProcess;}

        /**
         * Get PlayState
         * @returns {Anim.PlayState}
         */
        get playState():PlayState {return this._playState;}
        get loopCount():number {return this._loopCount;}

        public get name():string {return this._name;}
        public setName(name:string=null):Player {
            this._name = name;
            return this;
        }

        private static IdCount:number = 0;
        /**
         * Set animation target object
         * @param target
         * @returns {Anim.Player}
         */
        public setTarget(target:any):Player {
            this._target = target;
            if (!this._target.__anim_id) {
                Object.defineProperty(this._target, '__anim_id', {
                    value: 'anim_'+(Player.IdCount++),
                    configurable: false,
                    enumerable: false
                })
            }
            return this;
        }

        /**
         * Set duration
         * @param {number} duration Milliseconds
         * @returns {Anim.Player}
         */
        public setDuration(duration:number):Player {
            this._duration = duration;
            return this;
        }

        /**
         * Loop animation
         * @returns {Anim.Player}
         */
        public loop():Player {
            this._loop = true;
            return this;
        }

        /**
         * Goto to time animation
         * @param {number} time Milliseconds
         */
        public setTime(time:number):void {
            if (this._parent) dropError('Method play available in root anim only');
            //
            if (this._playState !== PlayState.PLAY) {
                if (!this._calculated) this._startCalc();
                //
                this._pausedTime = 0;
                this._state.elapsedTime = time;
                this._update(this._state.elapsedTime);
            }
        }

        /**
         * Play animation
         * @returns {Anim.Player}
         */
        public play():Player {
            if (this._parent) dropError('Method play available in root anim only');
            //
            if (!this._calculated) {
                this._startCalc();
            } else {
                this._replay();
            }
            //
            global.add(this);
            this._loopCount = 0;
            this._pausedTime = 0;
            this._state.rootStartTime = global.time;
            this._setPlayState(PlayState.PLAY);
            //
            return this;
        }

        /**
         * Stop animation
         * @returns {Anim.Player}
         */
        public stop():Player {
            if (this._parent) dropError('Method stop available in root anim only');
            //
            global.del(this);
            this._setPlayState(PlayState.STOP);
            return this;
        }

        /**
         * Pause animation, only if `playState === PlayState.PLAY`
         */
        public pause():void {
            if (this._parent) dropError('Method pause available in root anim only');
            //
            if (this._playState === PlayState.PLAY) {
                this._setPlayState(PlayState.PAUSE);
            }
        }

        /**
         * Resume animation, only if `playState === PlayState.PAUSE`
         */
        public resume():void {
            if (this._parent) dropError('Method resume available in root anim only');
            //
            if (this._playState === PlayState.PAUSE) {
                this._setPlayState(PlayState.PLAY);
            }
        }

        /**
         * **Pause** animation, if `playState === PlayState.PLAY` <br>
         * or **Resume** animation , if `playState === PlayState.PAUSE`
         */
        public togglePause():void {
            if (this._parent) dropError('Method resume available in root anim only');
            //
            switch (this._playState) {
                case PlayState.PAUSE:
                    this._setPlayState(PlayState.PLAY);
                    break;
                case PlayState.PLAY:
                    this._setPlayState(PlayState.PAUSE);
                    break;
            }
        }

        /**
         * Add Listener
         * @param {string} name
         * @param {(event: Anim.EventData) => void} func
         * @param context
         * @returns {Anim.Player}
         */
        public addListener(name:string, func:(event:EventData)=>void, context:any=null):Player {
            if (!this._listeners) this._listeners = {};
            this._listeners[name] = {
                func: func,
                context: context
            };
            return this;
        }

        /**
         * Remove Listener
         * @param {string} name
         * @param {(event: Anim.EventData) => void} func
         * @returns {Anim.Player}
         */
        public removeListener(name:string, func:(event:EventData)=>void):Player {
            if (!this._listeners) return this;
            delete this._listeners[name];
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

        _replay():void {
            super._replay();
            this.activated = false;
        }

        _update(parentTime:number):void {
            super._update(parentTime);
            //
            if (!this.activated && parentTime >= this._state.beginTime) {
                this.activated = true;
                this._activate();
            }

        }

        _activate() {/** override me */}
    }

    class CallFunc extends Static {
        constructor(private callback:Function, private context:any, private params:Array<any>) {
            super();
        }
        _activate() {
            this.callback.apply(this.context, this.params||[]);
        }
    }

    export class EventData {
        constructor(
            public readonly player:Player,
            public readonly eventName:string,
            public readonly params:any[]=[])
        {

        }
    }
    class DropEvent extends Static {
        constructor(private eventName:string, private bubbles:boolean, private params:any[]) {
            super();
        }
        _activate() {
            const eventData:EventData = new EventData(this, this.eventName, this.params);
            this._dropEventData(eventData);
            if (this.bubbles) {
                let parent:Player = this._parent;
                while (parent) {
                    parent._dropEventData(eventData);
                    parent = parent._parent;
                }
            }
        }
    }

    class PlayerSetState extends Static {
        constructor(private readonly player:Player, private readonly setPlayState:PlayState) {
            super();
        }
        _activate() {
            switch (this.setPlayState) {
                case PlayState.PLAY:
                    this.player.play();
                    break;
                case PlayState.PAUSE:
                    this.player.pause();
                    break;
                case PlayState.RESUME:
                    this.player.resume();
                    break;
                case PlayState.STOP:
                    this.player.stop();
                    break;
            }
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
        private _keys:Array<string>;
        private _relative:boolean;
        private _ease:EaseFuncType;
        private _toProps:Properties;
        private _fromProps:Properties;
        constructor() {
            super();
        }

        easeCustom(func:EaseFuncType):Property {this._ease = func;return this;}

        easeRegular():Property {this._ease          = regular;return this;}
        easeStrongOut():Property {this._ease        = strongOut;return this;}
        easeStrongIn():Property {this._ease         = strongIn;return this;}
        easeStrongInOut():Property {this._ease      = strongInOut;return this;}
        easeBackOut():Property {this._ease          = backOut;return this;}
        easeBackIn():Property {this._ease           = backIn;return this;}
        easeBackInOut():Property {this._ease        = backInOut;return this;}
        easeElasticIn():Property {this._ease        = elasticIn;return this;}
        easeElasticOut():Property {this._ease       = elasticOut;return this;}
        easeElasticInOut():Property {this._ease     = elasticInOut;return this;}
        easeCircIn():Property {this._ease           = circIn;return this;}
        easeCircOut():Property {this._ease          = circOut;return this;}
        easeCircInOut():Property {this._ease        = circInOut;return this;}
        easeCubicIn():Property {this._ease          = cubicIn;return this;}
        easeCubicOut():Property {this._ease         = cubicOut;return this;}
        easeCubicInOut():Property {this._ease       = cubicInOut;return this;}
        easeExpIn():Property {this._ease            = expIn;return this;}
        easeExpOut():Property {this._ease           = expOut;return this;}
        easeExpInOut():Property {this._ease         = expInOut;return this;}
        easeQuadIn():Property {this._ease           = quadIn;return this;}
        easeQuadOut():Property {this._ease          = quadOut;return this;}
        easeQuadInOut():Property {this._ease        = quadInOut;return this;}
        easeQuartIn():Property {this._ease          = quartIn;return this;}
        easeQuartOut():Property {this._ease         = quartOut;return this;}
        easeQuartInOut():Property {this._ease       = quartInOut;return this;}
        easeQuintIn():Property {this._ease          = quintIn;return this;}
        easeQuintOut():Property {this._ease         = quintOut;return this;}
        easeQuintInOut():Property {this._ease       = quintInOut;return this;}
        easeSinIn():Property {this._ease            = sinIn;return this;}
        easeSinOut():Property {this._ease           = sinOut;return this;}
        easeSinInOut():Property {this._ease         = sinInOut;return this;}
        easeBounceIn():Property {this._ease         = bounceIn;return this;}
        easeBounceOut():Property {this._ease        = bounceOut;return this;}
        easeBounceInOut():Property {this._ease      = bounceInOut;return this;}

        _setFromProps(props:Properties):Property {
            this._fromProps = props;
            return this;
        }

        _setToProps(props:Properties):Property {
            this._toProps = props;
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
            const target = this._state.target;
            //
            for (let i=0; i<this._keys.length; i++) {
                const key = this._keys[i];
                //
                if (this._fromProps) {
                    this._state.from.set(target, key, this._fromProps[key]);
                } else {
                    if (props.has(target, key)) {
                        this._state.from.set(target, key, props.get(target, key));
                    } else {
                        let value: number;
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
                        this._state.from.set(target, key, value);
                    }
                }
                //
                this._state.to.set(target, key, this._toProps[key]);
                if (this._relative) {
                    this._state.to.add(target, key, this._state.from.get(target, key));
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
            const target = this._state.target;
            const value = this._state.from.get(target, key) + (this._state.to.get(target, key) - this._state.from.get(target, key)) * this._state.position;
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
        constructor(propName:string, withAlpha:boolean=false) {
            super();
            this._flags |= Flags.COLOR;
            this.propName = propName;
            this.fromRgb = new Rgb(0, withAlpha);
            this.toRgb = new Rgb(0, withAlpha);
            this.interpolateRgb = new Rgb(0, withAlpha);
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
            //
            this.fromRgb.update(this._state.from.get(this._state.target, this.propName));
            this.toRgb.update(this._state.to.get(this._state.target, this.propName));
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

        _apply():void {
            super._apply();
            //
            for (let i=0; i<this.items.length; i++) {
                this.items[i]._update(this._state.elapsedTime);
            }
        }
    }

    class Spawn extends Group {
        constructor(items:Array<Player>) {
            super(items);
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
                item._state.beginTime = 0;
            }
            if (!this._duration) this._state.duration = maxDuration;
        }
    }

    class Sequence extends Group {
        constructor(items:Array<Player>) {
            super(items);
        }

        _calculate(props:PropsContainer):void {
            super._calculate(props);
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
            //let beginTime:number = 0;
            let fullDuration:number = 0;
            for (let i=0; i<this.items.length; i++) {
                let item = this.items[i];
                if (!item._duration && !(item._flags & Flags.STATIC)) {
                    item._state.duration = unsetDuration;
                }
                item._state.beginTime = fullDuration;//beginTime;
                item._calculate(props);
                //beginTime += item._state.duration;
                fullDuration += item._state.duration;
            }
            if (!this._duration) {
                this._state.duration = fullDuration;
            }
        }
    }

    // properties ********************************************************************************

    function dropErrorInvalidArguments(argumentsCount:number):void {
        dropError(`Invalid number of arguments. Should be 2(objects) or 4(numbers). Received ${argumentsCount}`);
    }

    function getPosProps(xOrPos:number|Position, y:number=0):Properties {
        if (typeof xOrPos !== 'number') {
            return {
                x: xOrPos.x,
                y: xOrPos.y
            };
        } else {
            return {
                x: xOrPos,
                y: y
            };
        }
    }

    function prepareFromTo(xName:string, yName:string, args:any[]):Property {
        const from = {};
        const to = {};
        switch (args.length) {
            case 2:
                from[xName] = args[0].x;
                from[yName] = args[0].y;
                to[xName] = args[1].x;
                to[yName] = args[1].y;
                break;
            case 4:
                from[xName] = args[0];
                from[yName] = args[1];
                to[xName] = args[2];
                to[yName] = args[3];
                break;
            default:
                dropErrorInvalidArguments(args.length);
                return null;
        }
        return customFromTo(from, to);
    }


    // custom
    export function customTo(props:Properties):Property {
        return new Property()._setToProps(props);
    }
    export function customAdd(props:Properties):Property {return customTo(props)._setRelative(true);}

    export function customFromTo(from:Properties, to:Properties):Property {
        return customTo(to)._setFromProps(from);
    }

    export function timeout(time:number):Interval {
        const player:Interval = new Interval();
        player.setDuration(time);
        return player;
    }

    export interface Position {
        x:number;
        y:number;
    }

    export interface Size {
        width:number;
        height:number;
    }

    // move
    export function moveToX(x:number):Property {
        return customTo({x: x});
    }
    export function moveToY(y:number):Property {
        return customTo({y: y});
    }
    export function moveTo(xOrPos:number|Position, y:number=0):Property {
        return customTo(getPosProps.apply(null, arguments));
    }
    export function moveAddX(x:number):Property {return moveToX(x)._setRelative(true);}
    export function moveAddY(y:number):Property {return moveToY(y)._setRelative(true);}
    export function moveAdd(xOrPos:number|Position, y:number=0):Property {return moveTo(xOrPos, y)._setRelative(true);}
    export function moveFromToX(from:number, to:number):Property {return customFromTo({x:from}, {x:to});}
    export function moveFromToY(from:number, to:number):Property {return customFromTo({y:from}, {y:to});}
    export function moveFromTo(...args:any[]):Property {return prepareFromTo('x', 'y', args);}


    // scale
    export function scaleToX(scaleX:number):Property {
        return customTo({scaleX: scaleX});
    }
    export function scaleToY(scaleY:number):Property {
        return customTo({scaleY: scaleY});
    }
    export function scaleTo(xOrPos:number|Position, y:number=0):Property {
        let props = getPosProps.apply(null, arguments);
        return customTo({
            scaleX: props.x,
            scalyY: props.y
        });
    }
    export function scaleAddX(x:number):Property {return scaleToX(x)._setRelative(true);}
    export function scaleAddY(y:number):Property {return scaleToY(y)._setRelative(true);}
    export function scaleAdd(xOrPos:number|Position, y:number=0):Property {return scaleTo(xOrPos, y)._setRelative(true);}
    export function scaleFromToX(from:number, to:number):Property {return customFromTo({scaleX:from}, {scaleX:to});}
    export function scaleFromToY(from:number, to:number):Property {return customFromTo({scaleY:from}, {scaleY:to});}
    export function scaleFromTo(...args:any[]):Property { return prepareFromTo('scaleX', 'scaleY', args);}

    // size (width, height)
    export function widthTo(width:number):Property {
        return customTo({width: width});
    }
    export function heightTo(height:number):Property {
        return customTo({height: height});
    }
    export function sizeTo(widthOrSize:number|Size, height:number=0):Property {
        let props:Properties;
        if (typeof widthOrSize !== 'number') {
            props = {
                width: widthOrSize['width'],
                height: widthOrSize['height']
            };
        } else {
            props = {
                width: widthOrSize,
                height: height
            };
        }
        return customTo(props);
    }
    export function widthAdd(width:number):Property {return widthTo(width)._setRelative(true);}
    export function heightAdd(height:number):Property {return heightTo(height)._setRelative(true);}
    export function sizeAdd(widthOrSize:number|Size, height:number=0):Property {return sizeAdd(widthOrSize, height)._setRelative(true);}
    export function widthFromTo(from:number, to:number):Property {return customFromTo({width:from}, {width:to});}
    export function heightFromTo(from:number, to:number):Property {return customFromTo({width:from}, {width:to});}
    export function sizeFromTo(...args:any[]):Property {
        switch (args.length) {
            case 2:
                return customFromTo({
                    width: args[0].width,
                    height: args[0].height
                }, {
                    width: args[1].width,
                    height: args[2].height
                });
            case 4:
                return customFromTo({
                    width: args[0],
                    height: args[1]
                }, {
                    width: args[2],
                    height: args[3]
                });
            default:
                dropErrorInvalidArguments(args.length);
                return null;
        }
    }

    // anchor
    export function anchorToX(anchorX:number):Property {
        return customTo({anchorX: anchorX});
    }
    export function anchorToY(anchorY:number):Property {
        return customTo({anchorY: anchorY});
    }
    export function anchorTo(xOrPos:number|Position, y:number=0):Property {
        const props = getPosProps.apply(null, arguments);
        return customTo({
            anchorX: props.x,
            anchorY: props.y
        });
    }
    export function anchorAddX(x:number):Property {return anchorToX(x)._setRelative(true);}
    export function anchorAddY(y:number):Property {return anchorToY(y)._setRelative(true);}
    export function anchorAdd(xOrPos:number|Position, y:number=0):Property {return anchorTo(xOrPos, y)._setRelative(true);}
    export function anchorFromToX(from:number, to:number):Property {return customFromTo({anchorX:from}, {anchorX:to});}
    export function anchorFromToY(from:number, to:number):Property {return customFromTo({anchorY:from}, {anchorY:to});}
    export function anchorFromTo(...args:any[]):Property { return prepareFromTo('anchorX', 'anchorY', args);}

    // pivot
    export function pivotToX(pivotX:number):Property {
        return customTo({pivotX: pivotX});
    }
    export function pivotToY(pivotY:number):Property {
        return customTo({pivotY: pivotY});
    }
    export function pivotTo(xOrPos:number|Position, y:number=0):Property {
        const props = getPosProps.apply(null, arguments);
        return customTo({
            pivotX: props.x,
            pivotY: props.y
        });
    }
    export function pivotAddX(x:number):Property {return pivotToX(x)._setRelative(true);}
    export function pivotAddY(y:number):Property {return pivotToY(y)._setRelative(true);}
    export function pivotAdd(xOrPos:number|Position, y:number=0):Property {return pivotTo(xOrPos, y)._setRelative(true);}
    export function pivotFromToX(from:number, to:number):Property {return customFromTo({pivotX:from}, {pivotX:to});}
    export function pivotFromToY(from:number, to:number):Property {return customFromTo({pivotY:from}, {pivotY:to});}
    export function pivotFromTo(...args:any[]):Property { return prepareFromTo('pivotX', 'pivotY', args);}

    // rotate
    export function rotateTo(rotate:number):Property {
        return customTo({rotation: rotate});
    }
    export function rotateAdd(rotate:number):Property {return rotateTo(rotate)._setRelative(true);}
    export function rotateFromTo(from:number, to:number):Property {return customFromTo({rotation:from}, {rotation:to});}

    // alpha
    export function alphaTo(alpha:number):Property {
        return customTo({alpha: alpha});
    }
    export function alphaAdd(alpha:number):Property {return alphaTo(alpha)._setRelative(true);}
    export function fadeIn():Property {return alphaTo(0);}
    export function fadeOut():Property {return alphaTo(1);}
    export function alphaFromTo(from:number, to:number):Property {return customFromTo({alpha:from}, {alpha:to});}

    // color
    export function colorTo(propName:string, color:number, withAlpha:boolean=false):Color {
        const colorAnim:Color = new Color(propName, withAlpha);
        colorAnim._setToProps({tint: color});
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
    export function log(...args: any[]):CallFunc {
        return callFunc(console.log, console, args);
    }
    export function warn(...args: any[]):CallFunc {
        return callFunc(console.warn, console, args);
    }
    export function error(...args: any[]):CallFunc {
        return callFunc(console.error, console, args);
    }
    export function event(name:string, bubbles:boolean=false, ...args: any[]):DropEvent {
        return new DropEvent(name, bubbles, args);
    }

    export function playerPlay(player:Player):PlayerSetState {
        return new PlayerSetState(player, PlayState.PLAY);
    }
    export function playerPause(player:Player):PlayerSetState {
        return new PlayerSetState(player, PlayState.PAUSE);
    }
    export function playerResume(player:Player):PlayerSetState {
        return new PlayerSetState(player, PlayState.RESUME);
    }
    export function playerStop(player:Player):PlayerSetState {
        return new PlayerSetState(player, PlayState.STOP);
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
                    this.alpha = 0;
                }
                this.red = (color >> 16) & 0xff;
                this.green = (color >> 8) & 0xff;
                this.blue = color & 0xff;
            } else {
                this.alpha = this.withAlpha ? 255 : 0;
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
            const alpha = Math.round(from.alpha + (to.alpha - from.alpha) * percent);
            const red = Math.round(from.red + (to.red - from.red) * percent);
            const green = Math.round(from.green + (to.green - from.green) * percent);
            const blue = Math.round(from.blue + (to.blue - from.blue) * percent);
            rgb = rgb || new Rgb();
            rgb.updateRgb(red, green, blue, alpha);
            return rgb;
        }
    }
}
