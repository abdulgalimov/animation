"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var Anim;
(function (Anim) {
    var GlobalItems = (function () {
        function GlobalItems() {
            this.startTime = 0;
            this.time = 0;
            this.items = [];
        }
        GlobalItems.prototype.update = function (dtime) {
            if (arguments.length === 1) {
                this.time += dtime;
            }
            else {
                if (this.startTime === 0) {
                    this.startTime = Date.now();
                }
                var oldTime = this.time;
                this.time = Date.now() - this.startTime;
                dtime = this.time - oldTime;
            }
            for (var i = 0; i < this.items.length; i++) {
                this.items[i]._updateRoot(dtime);
            }
        };
        GlobalItems.prototype.add = function (player) {
            var index = this.items.indexOf(player);
            if (index === -1)
                this.items.push(player);
        };
        GlobalItems.prototype.del = function (player) {
            var index = this.items.indexOf(player);
            if (index !== -1)
                this.items.splice(index, 1);
        };
        return GlobalItems;
    }());
    var global = new GlobalItems;
    function update() {
        global.update.apply(global, arguments);
    }
    Anim.update = update;
    function dropError(message) {
        throw new Error("AnimError: " + message);
    }
    var PropsContainer = (function () {
        function PropsContainer() {
            this.values = {};
        }
        PropsContainer.prototype.addProps = function (props) {
            for (var key in props.values) {
                this.values[key] = props.values[key];
            }
        };
        PropsContainer.prototype.clear = function () {
            this.values = {};
        };
        return PropsContainer;
    }());
    var State = (function () {
        function State() {
            this.rootStartTime = 0;
            this.beginTime = 0;
            this.elapsedTime = 0;
            this.position = 0;
            this.duration = 0;
            this.from = new PropsContainer();
            this.to = new PropsContainer();
        }
        State.prototype.clear = function () {
            this.beginTime = 0;
            this.elapsedTime = 0;
            this.position = 0;
            this.duration = 0;
            this.from.clear();
            this.to.clear();
        };
        return State;
    }());
    var Flags;
    (function (Flags) {
        Flags[Flags["STATIC"] = 1] = "STATIC";
        Flags[Flags["COLOR"] = 2] = "COLOR";
    })(Flags || (Flags = {}));
    var PlayState;
    (function (PlayState) {
        PlayState[PlayState["STOP"] = 1] = "STOP";
        PlayState[PlayState["PLAY"] = 2] = "PLAY";
        PlayState[PlayState["PAUSE"] = 3] = "PAUSE";
        PlayState[PlayState["RESUME"] = 4] = "RESUME";
        PlayState[PlayState["FINISH"] = 5] = "FINISH";
    })(PlayState = Anim.PlayState || (Anim.PlayState = {}));
    var Events;
    (function (Events) {
        Events["BEGIN"] = "begin";
        Events["CHANGE"] = "change";
        Events["LOOP"] = "loop";
        Events["END"] = "end";
    })(Events = Anim.Events || (Anim.Events = {}));
    var Player = (function () {
        function Player() {
            this._parent = null;
            this._duration = 0;
            this._flags = 0;
            this._pausedTime = 0;
            this._playState = PlayState.STOP;
            this._state = new State();
        }
        Player.prototype._setPlayState = function (state) {
            this._playState = state;
        };
        Player.prototype._dropEvent = function (eventName) {
            var eventData = new EventData(this, eventName);
            this._dropEventData(eventData);
        };
        Player.prototype._dropEventData = function (eventData) {
            if (this._listeners && this._listeners[eventData.eventName]) {
                this._listeners[eventData.eventName].func.call(this._listeners[eventData.eventName].context, eventData);
            }
        };
        Player.prototype._setParent = function (parent) {
            this._parent = parent;
        };
        Player.prototype._updateRoot = function (deltaTime) {
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
        };
        Player.prototype._update = function (parentTime) {
            if (this._parent) {
                this._state.elapsedTime = parentTime - this._state.beginTime;
            }
            if (this._state.elapsedTime >= 0 && this._state.elapsedTime < this._state.duration) {
                if (!this._isProcess) {
                    this._isProcess = true;
                    this._dropEvent(Events.BEGIN);
                    this._dropEvent(Events.CHANGE);
                }
            }
            if (this._loop) {
                if (this._state.elapsedTime > this._state.duration) {
                    var loopCount = Math.floor(this._state.elapsedTime / this._state.duration);
                    var newValue = this._state.elapsedTime - loopCount * this._state.duration;
                    if (loopCount !== this._loopCount) {
                        this._loopCount = loopCount;
                        this._state.elapsedTime = this._state.duration;
                        this._state.position = 1;
                        this._apply();
                        this._dropEvent(Events.LOOP);
                        this._replay();
                    }
                    this._state.elapsedTime = newValue;
                }
            }
            if (this._state.elapsedTime < 0)
                this._state.elapsedTime = 0;
            if (this._state.elapsedTime > this._state.duration)
                this._state.elapsedTime = this._state.duration;
            var p = this._state.duration ? this._state.elapsedTime / this._state.duration : 0;
            if (p !== this._state.position) {
                this._state.position = p;
                this._apply();
            }
            if (this._state.elapsedTime === this._state.duration) {
                if (this._isProcess) {
                    this._isProcess = false;
                    this._dropEvent(Events.CHANGE);
                    this._dropEvent(Events.END);
                }
            }
            else if (this._state.elapsedTime > 0) {
                this._dropEvent(Events.CHANGE);
            }
        };
        Player.prototype._apply = function () {
        };
        Player.prototype._calculate = function (props) {
            this._calculated = true;
            this._state.target = this.target;
            this._state.elapsedTime = 0;
            this._state.position = 0;
            this._isProcess = false;
            if (this._duration) {
                this._state.duration = this._duration;
            }
        };
        Player.prototype._replay = function () {
            this._state.elapsedTime = 0;
            this._state.position = 0;
        };
        Player.prototype._startCalc = function () {
            var props = new PropsContainer();
            props.clear();
            this._calculate(props);
        };
        Object.defineProperty(Player.prototype, "target", {
            get: function () {
                var self = this;
                while (!self._target && self._parent)
                    self = self._parent;
                return self._target;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "position", {
            get: function () { return this._state.position; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "elapsedTime", {
            get: function () { return this._state.elapsedTime; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "duration", {
            get: function () { return this._state.duration; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "isProcess", {
            get: function () { return this._isProcess; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "playState", {
            get: function () { return this._playState; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "loopCount", {
            get: function () { return this._loopCount; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Player.prototype, "name", {
            get: function () { return this._name; },
            enumerable: true,
            configurable: true
        });
        Player.prototype.setName = function (name) {
            if (name === void 0) { name = null; }
            this._name = name;
            return this;
        };
        Player.prototype.setTarget = function (target) {
            this._target = target;
            return this;
        };
        Player.prototype.setDuration = function (duration) {
            this._duration = duration;
            return this;
        };
        Player.prototype.loop = function () {
            this._loop = true;
            return this;
        };
        Player.prototype.setTime = function (time) {
            if (this._parent)
                dropError('Method play available in root anim only');
            if (this._playState !== PlayState.PLAY) {
                if (!this._calculated)
                    this._startCalc();
                this._pausedTime = 0;
                this._state.elapsedTime = time;
                this._update(this._state.elapsedTime);
            }
        };
        Player.prototype.play = function () {
            if (this._parent)
                dropError('Method play available in root anim only');
            if (!this._calculated) {
                this._startCalc();
            }
            else {
                this._replay();
            }
            global.add(this);
            this._loopCount = 0;
            this._pausedTime = 0;
            this._state.rootStartTime = global.time;
            this._setPlayState(PlayState.PLAY);
            return this;
        };
        Player.prototype.stop = function () {
            if (this._parent)
                dropError('Method stop available in root anim only');
            global.del(this);
            this._setPlayState(PlayState.STOP);
            return this;
        };
        Player.prototype.pause = function () {
            if (this._parent)
                dropError('Method pause available in root anim only');
            if (this._playState === PlayState.PLAY) {
                this._setPlayState(PlayState.PAUSE);
            }
        };
        Player.prototype.resume = function () {
            if (this._parent)
                dropError('Method resume available in root anim only');
            if (this._playState === PlayState.PAUSE) {
                this._setPlayState(PlayState.PLAY);
            }
        };
        Player.prototype.togglePause = function () {
            if (this._parent)
                dropError('Method resume available in root anim only');
            switch (this._playState) {
                case PlayState.PAUSE:
                    this._setPlayState(PlayState.PLAY);
                    break;
                case PlayState.PLAY:
                    this._setPlayState(PlayState.PAUSE);
                    break;
            }
        };
        Player.prototype.addListener = function (name, func, context) {
            if (context === void 0) { context = null; }
            if (!this._listeners)
                this._listeners = {};
            this._listeners[name] = {
                func: func,
                context: context
            };
            return this;
        };
        Player.prototype.removeListener = function (name, func) {
            if (!this._listeners)
                return this;
            delete this._listeners[name];
            return this;
        };
        return Player;
    }());
    Anim.Player = Player;
    var Static = (function (_super) {
        __extends(Static, _super);
        function Static() {
            var _this = _super.call(this) || this;
            _this._flags |= Flags.STATIC;
            return _this;
        }
        Static.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            this._state.duration = 0;
            this.activated = false;
        };
        Static.prototype._replay = function () {
            _super.prototype._replay.call(this);
            this.activated = false;
        };
        Static.prototype._update = function (parentTime) {
            _super.prototype._update.call(this, parentTime);
            if (!this.activated && parentTime >= this._state.beginTime) {
                this.activated = true;
                this._activate();
            }
        };
        Static.prototype._activate = function () { };
        return Static;
    }(Player));
    var CallFunc = (function (_super) {
        __extends(CallFunc, _super);
        function CallFunc(callback, context, params) {
            var _this = _super.call(this) || this;
            _this.callback = callback;
            _this.context = context;
            _this.params = params;
            return _this;
        }
        CallFunc.prototype._activate = function () {
            this.callback.apply(this.context, this.params || []);
        };
        return CallFunc;
    }(Static));
    var EventData = (function () {
        function EventData(player, eventName, params) {
            if (params === void 0) { params = []; }
            this.player = player;
            this.eventName = eventName;
            this.params = params;
        }
        return EventData;
    }());
    Anim.EventData = EventData;
    var DropEvent = (function (_super) {
        __extends(DropEvent, _super);
        function DropEvent(eventName, bubbles, params) {
            var _this = _super.call(this) || this;
            _this.eventName = eventName;
            _this.bubbles = bubbles;
            _this.params = params;
            return _this;
        }
        DropEvent.prototype._activate = function () {
            var eventData = new EventData(this, this.eventName, this.params);
            this._dropEventData(eventData);
            if (this.bubbles) {
                var parent_1 = this._parent;
                while (parent_1) {
                    parent_1._dropEventData(eventData);
                    parent_1 = parent_1._parent;
                }
            }
        };
        return DropEvent;
    }(Static));
    var PlayerSetState = (function (_super) {
        __extends(PlayerSetState, _super);
        function PlayerSetState(player, setPlayState) {
            var _this = _super.call(this) || this;
            _this.player = player;
            _this.setPlayState = setPlayState;
            return _this;
        }
        PlayerSetState.prototype._activate = function () {
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
        };
        return PlayerSetState;
    }(Static));
    var Visible = (function (_super) {
        __extends(Visible, _super);
        function Visible(value) {
            var _this = _super.call(this) || this;
            _this.value = value;
            return _this;
        }
        Visible.prototype._activate = function () {
            this._state.target.visible = this.value;
        };
        return Visible;
    }(Static));
    var RemoveFromParent = (function (_super) {
        __extends(RemoveFromParent, _super);
        function RemoveFromParent() {
            return _super.call(this) || this;
        }
        RemoveFromParent.prototype._activate = function () {
            if (this._state.target.parent) {
                this._state.target.parent.removeChild(this._state.target);
            }
        };
        return RemoveFromParent;
    }(Static));
    var AddToParent = (function (_super) {
        __extends(AddToParent, _super);
        function AddToParent(parentCont) {
            var _this = _super.call(this) || this;
            _this.parentCont = parentCont;
            return _this;
        }
        AddToParent.prototype._activate = function () {
            this.parentCont.addChild(this._state.target);
        };
        return AddToParent;
    }(Static));
    var Interval = (function (_super) {
        __extends(Interval, _super);
        function Interval() {
            return _super.call(this) || this;
        }
        return Interval;
    }(Player));
    var Property = (function (_super) {
        __extends(Property, _super);
        function Property() {
            return _super.call(this) || this;
        }
        Property.prototype.easeCustom = function (func) { this._ease = func; return this; };
        Property.prototype.easeRegular = function () { this._ease = regular; return this; };
        Property.prototype.easeStrongOut = function () { this._ease = strongOut; return this; };
        Property.prototype.easeStrongIn = function () { this._ease = strongIn; return this; };
        Property.prototype.easeStrongInOut = function () { this._ease = strongInOut; return this; };
        Property.prototype.easeBackOut = function () { this._ease = backOut; return this; };
        Property.prototype.easeBackIn = function () { this._ease = backIn; return this; };
        Property.prototype.easeBackInOut = function () { this._ease = backInOut; return this; };
        Property.prototype.easeElasticIn = function () { this._ease = elasticIn; return this; };
        Property.prototype.easeElasticOut = function () { this._ease = elasticOut; return this; };
        Property.prototype.easeElasticInOut = function () { this._ease = elasticInOut; return this; };
        Property.prototype.easeCircIn = function () { this._ease = circIn; return this; };
        Property.prototype.easeCircOut = function () { this._ease = circOut; return this; };
        Property.prototype.easeCircInOut = function () { this._ease = circInOut; return this; };
        Property.prototype.easeCubicIn = function () { this._ease = cubicIn; return this; };
        Property.prototype.easeCubicOut = function () { this._ease = cubicOut; return this; };
        Property.prototype.easeCubicInOut = function () { this._ease = cubicInOut; return this; };
        Property.prototype.easeExpIn = function () { this._ease = expIn; return this; };
        Property.prototype.easeExpOut = function () { this._ease = expOut; return this; };
        Property.prototype.easeExpInOut = function () { this._ease = expInOut; return this; };
        Property.prototype.easeQuadIn = function () { this._ease = quadIn; return this; };
        Property.prototype.easeQuadOut = function () { this._ease = quadOut; return this; };
        Property.prototype.easeQuadInOut = function () { this._ease = quadInOut; return this; };
        Property.prototype.easeQuartIn = function () { this._ease = quartIn; return this; };
        Property.prototype.easeQuartOut = function () { this._ease = quartOut; return this; };
        Property.prototype.easeQuartInOut = function () { this._ease = quartInOut; return this; };
        Property.prototype.easeQuintIn = function () { this._ease = quintIn; return this; };
        Property.prototype.easeQuintOut = function () { this._ease = quintOut; return this; };
        Property.prototype.easeQuintInOut = function () { this._ease = quintInOut; return this; };
        Property.prototype.easeSinIn = function () { this._ease = sinIn; return this; };
        Property.prototype.easeSinOut = function () { this._ease = sinOut; return this; };
        Property.prototype.easeSinInOut = function () { this._ease = sinInOut; return this; };
        Property.prototype.easeBounceIn = function () { this._ease = bounceIn; return this; };
        Property.prototype.easeBounceOut = function () { this._ease = bounceOut; return this; };
        Property.prototype.easeBounceInOut = function () { this._ease = bounceInOut; return this; };
        Property.prototype._setFromProps = function (props) {
            this._fromProps = props;
            return this;
        };
        Property.prototype._setToProps = function (props) {
            this._toProps = props;
            this._keys = [];
            for (var key in props) {
                this._keys.push(key);
            }
            return this;
        };
        Property.prototype._setRelative = function (value) {
            this._relative = value;
            return this;
        };
        Property.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            this._state.from.clear();
            this._state.to.clear();
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (this._fromProps) {
                    this._state.from.values[key] = this._fromProps[key];
                }
                else {
                    if (props.values.hasOwnProperty(key)) {
                        this._state.from.values[key] = props.values[key];
                    }
                    else {
                        var value = void 0;
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
                }
                this._state.to.values[key] = this._toProps[key];
                if (this._relative) {
                    this._state.to.values[key] += this._state.from.values[key];
                }
            }
            props.addProps(this._state.to);
        };
        Property.prototype._apply = function () {
            if (this._ease) {
                this._state.position = this._ease(this._state.position, 0, 1, 1);
            }
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                this.setValue(key);
            }
        };
        Property.prototype.setValue = function (key) {
            var value = this._state.from.values[key] + (this._state.to.values[key] - this._state.from.values[key]) * this._state.position;
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
        };
        return Property;
    }(Interval));
    var Color = (function (_super) {
        __extends(Color, _super);
        function Color(propName, withAlpha) {
            if (withAlpha === void 0) { withAlpha = false; }
            var _this = _super.call(this) || this;
            _this._flags |= Flags.COLOR;
            _this.propName = propName;
            _this.fromRgb = new Rgb(0, withAlpha);
            _this.toRgb = new Rgb(0, withAlpha);
            _this.interpolateRgb = new Rgb(0, withAlpha);
            return _this;
        }
        Color.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            this.fromRgb.update(this._state.from.values[this.propName]);
            this.toRgb.update(this._state.to.values[this.propName]);
        };
        Color.prototype.setValue = function (key) {
            Rgb.interpolation(this.fromRgb, this.toRgb, this._state.position, this.interpolateRgb);
            this.color = this.interpolateRgb.color;
            this._state.target[this.propName] = this.color;
        };
        return Color;
    }(Property));
    var Group = (function (_super) {
        __extends(Group, _super);
        function Group(items) {
            var _this = _super.call(this) || this;
            _this.items = items;
            for (var i = 0; i < items.length; i++) {
                items[i]._setParent(_this);
            }
            return _this;
        }
        Group.prototype._replay = function () {
            _super.prototype._replay.call(this);
            for (var i = 0; i < this.items.length; i++) {
                this.items[i]._replay();
            }
        };
        Group.prototype._apply = function () {
            _super.prototype._apply.call(this);
            for (var i = 0; i < this.items.length; i++) {
                this.items[i]._update(this._state.elapsedTime);
            }
        };
        return Group;
    }(Interval));
    var Spawn = (function (_super) {
        __extends(Spawn, _super);
        function Spawn(items) {
            return _super.call(this, items) || this;
        }
        Spawn.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            var maxDuration = 0;
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                if (this._state.duration) {
                    item._state.duration = this._state.duration;
                }
                item._calculate(props);
                maxDuration = Math.max(maxDuration, item._state.duration);
                item._state.beginTime = 0;
            }
            if (!this._duration)
                this._state.duration = maxDuration;
        };
        return Spawn;
    }(Group));
    var Sequence = (function (_super) {
        __extends(Sequence, _super);
        function Sequence(items) {
            return _super.call(this, items) || this;
        }
        Sequence.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            _super.prototype._calculate.call(this, props);
            var setDuration = 0;
            var unsetCount = 0;
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                if (item._duration || item._flags & Flags.STATIC) {
                    setDuration += item._duration;
                }
                else {
                    unsetCount++;
                }
            }
            if (!this._duration && unsetCount) {
                dropError('Sequence duration=0 & there are items with duration=0');
                return;
            }
            var unsetDuration = unsetCount ? (this._duration - setDuration) / unsetCount : 0;
            var fullDuration = 0;
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                if (!item._duration && !(item._flags & Flags.STATIC)) {
                    item._state.duration = unsetDuration;
                }
                item._state.beginTime = fullDuration;
                item._calculate(props);
                fullDuration += item._state.duration;
            }
            if (!this._duration) {
                this._state.duration = fullDuration;
            }
        };
        return Sequence;
    }(Group));
    function dropErrorInvalidArguments(argumentsCount) {
        dropError("Invalid number of arguments. Should be 2(objects) or 4(numbers). Received " + argumentsCount);
    }
    function getPosProps(xOrPos, y) {
        if (y === void 0) { y = 0; }
        if (typeof xOrPos !== 'number') {
            return {
                x: xOrPos['x'],
                y: xOrPos['y']
            };
        }
        else {
            return {
                x: xOrPos,
                y: y
            };
        }
    }
    function prepareFromTo(xName, yName, args) {
        var from = {};
        var to = {};
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
    function customTo(props) {
        return new Property()._setToProps(props);
    }
    Anim.customTo = customTo;
    function customAdd(props) { return customTo(props)._setRelative(true); }
    Anim.customAdd = customAdd;
    function customFromTo(from, to) {
        return customTo(to)._setFromProps(from);
    }
    Anim.customFromTo = customFromTo;
    function timeout(time) {
        var player = new Interval();
        player.setDuration(time);
        return player;
    }
    Anim.timeout = timeout;
    function moveToX(x) {
        return customTo({ x: x });
    }
    Anim.moveToX = moveToX;
    function moveToY(y) {
        return customTo({ y: y });
    }
    Anim.moveToY = moveToY;
    function moveTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        return customTo(getPosProps.apply(null, arguments));
    }
    Anim.moveTo = moveTo;
    function moveAddX(x) { return moveToX(x)._setRelative(true); }
    Anim.moveAddX = moveAddX;
    function moveAddY(y) { return moveToY(y)._setRelative(true); }
    Anim.moveAddY = moveAddY;
    function moveAdd(xOrPos, y) {
        if (y === void 0) { y = 0; }
        return moveTo(xOrPos, y)._setRelative(true);
    }
    Anim.moveAdd = moveAdd;
    function moveFromToX(from, to) { return customFromTo({ x: from }, { x: to }); }
    Anim.moveFromToX = moveFromToX;
    function moveFromToY(from, to) { return customFromTo({ y: from }, { y: to }); }
    Anim.moveFromToY = moveFromToY;
    function moveFromTo() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return prepareFromTo('x', 'y', args);
    }
    Anim.moveFromTo = moveFromTo;
    function scaleToX(scaleX) {
        return customTo({ scaleX: scaleX });
    }
    Anim.scaleToX = scaleToX;
    function scaleToY(scaleY) {
        return customTo({ scaleY: scaleY });
    }
    Anim.scaleToY = scaleToY;
    function scaleTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var props = getPosProps.apply(null, arguments);
        return customTo({
            scaleX: props.x,
            scalyY: props.y
        });
    }
    Anim.scaleTo = scaleTo;
    function scaleAddX(x) { return scaleToX(x)._setRelative(true); }
    Anim.scaleAddX = scaleAddX;
    function scaleAddY(y) { return scaleToY(y)._setRelative(true); }
    Anim.scaleAddY = scaleAddY;
    function scaleAdd(xOrPos, y) {
        if (y === void 0) { y = 0; }
        return scaleTo(xOrPos, y)._setRelative(true);
    }
    Anim.scaleAdd = scaleAdd;
    function scaleFromToX(from, to) { return customFromTo({ scaleX: from }, { scaleX: to }); }
    Anim.scaleFromToX = scaleFromToX;
    function scaleFromToY(from, to) { return customFromTo({ scaleY: from }, { scaleY: to }); }
    Anim.scaleFromToY = scaleFromToY;
    function scaleFromTo() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return prepareFromTo('scaleX', 'scaleY', args);
    }
    Anim.scaleFromTo = scaleFromTo;
    function widthTo(width) {
        return customTo({ width: width });
    }
    Anim.widthTo = widthTo;
    function heightTo(height) {
        return customTo({ height: height });
    }
    Anim.heightTo = heightTo;
    function sizeTo(widthOrSize, height) {
        if (height === void 0) { height = 0; }
        var props;
        if (typeof widthOrSize !== 'number') {
            props = {
                width: widthOrSize['width'],
                height: widthOrSize['height']
            };
        }
        else {
            props = {
                width: widthOrSize,
                height: height
            };
        }
        return customTo(props);
    }
    Anim.sizeTo = sizeTo;
    function widthAdd(width) { return widthTo(width)._setRelative(true); }
    Anim.widthAdd = widthAdd;
    function heightAdd(height) { return heightTo(height)._setRelative(true); }
    Anim.heightAdd = heightAdd;
    function sizeAdd(widthOrSize, height) {
        if (height === void 0) { height = 0; }
        return sizeAdd(widthOrSize, height)._setRelative(true);
    }
    Anim.sizeAdd = sizeAdd;
    function widthFromTo(from, to) { return customFromTo({ width: from }, { width: to }); }
    Anim.widthFromTo = widthFromTo;
    function heightFromTo(from, to) { return customFromTo({ width: from }, { width: to }); }
    Anim.heightFromTo = heightFromTo;
    function sizeFromTo() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
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
    Anim.sizeFromTo = sizeFromTo;
    function anchorToX(anchorX) {
        return customTo({ anchorX: anchorX });
    }
    Anim.anchorToX = anchorToX;
    function anchorToY(anchorY) {
        return customTo({ anchorY: anchorY });
    }
    Anim.anchorToY = anchorToY;
    function anchorTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var props = getPosProps.apply(null, arguments);
        return customTo({
            anchorX: props.x,
            anchorY: props.y
        });
    }
    Anim.anchorTo = anchorTo;
    function anchorAddX(x) { return anchorToX(x)._setRelative(true); }
    Anim.anchorAddX = anchorAddX;
    function anchorAddY(y) { return anchorToY(y)._setRelative(true); }
    Anim.anchorAddY = anchorAddY;
    function anchorAdd(xOrPos, y) {
        if (y === void 0) { y = 0; }
        return anchorTo(xOrPos, y)._setRelative(true);
    }
    Anim.anchorAdd = anchorAdd;
    function anchorFromToX(from, to) { return customFromTo({ anchorX: from }, { anchorX: to }); }
    Anim.anchorFromToX = anchorFromToX;
    function anchorFromToY(from, to) { return customFromTo({ anchorY: from }, { anchorY: to }); }
    Anim.anchorFromToY = anchorFromToY;
    function anchorFromTo() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return prepareFromTo('anchorX', 'anchorY', args);
    }
    Anim.anchorFromTo = anchorFromTo;
    function pivotToX(pivotX) {
        return customTo({ pivotX: pivotX });
    }
    Anim.pivotToX = pivotToX;
    function pivotToY(pivotY) {
        return customTo({ pivotY: pivotY });
    }
    Anim.pivotToY = pivotToY;
    function pivotTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var props = getPosProps.apply(null, arguments);
        return customTo({
            pivotX: props.x,
            pivotY: props.y
        });
    }
    Anim.pivotTo = pivotTo;
    function pivotAddX(x) { return pivotToX(x)._setRelative(true); }
    Anim.pivotAddX = pivotAddX;
    function pivotAddY(y) { return pivotToY(y)._setRelative(true); }
    Anim.pivotAddY = pivotAddY;
    function pivotAdd(xOrPos, y) {
        if (y === void 0) { y = 0; }
        return pivotTo(xOrPos, y)._setRelative(true);
    }
    Anim.pivotAdd = pivotAdd;
    function pivotFromToX(from, to) { return customFromTo({ pivotX: from }, { pivotX: to }); }
    Anim.pivotFromToX = pivotFromToX;
    function pivotFromToY(from, to) { return customFromTo({ pivotY: from }, { pivotY: to }); }
    Anim.pivotFromToY = pivotFromToY;
    function pivotFromTo() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return prepareFromTo('pivotX', 'pivotY', args);
    }
    Anim.pivotFromTo = pivotFromTo;
    function rotateTo(rotate) {
        return customTo({ rotation: rotate });
    }
    Anim.rotateTo = rotateTo;
    function rotateAdd(rotate) { return rotateTo(rotate)._setRelative(true); }
    Anim.rotateAdd = rotateAdd;
    function rotateFromTo(from, to) { return customFromTo({ rotation: from }, { rotation: to }); }
    Anim.rotateFromTo = rotateFromTo;
    function alphaTo(alpha) {
        return customTo({ alpha: alpha });
    }
    Anim.alphaTo = alphaTo;
    function alphaAdd(alpha) { return alphaTo(alpha)._setRelative(true); }
    Anim.alphaAdd = alphaAdd;
    function fadeIn() { return alphaTo(0); }
    Anim.fadeIn = fadeIn;
    function fadeOut() { return alphaTo(1); }
    Anim.fadeOut = fadeOut;
    function alphaFromTo(from, to) { return customFromTo({ alpha: from }, { alpha: to }); }
    Anim.alphaFromTo = alphaFromTo;
    function colorTo(propName, color, withAlpha) {
        if (withAlpha === void 0) { withAlpha = false; }
        var colorAnim = new Color(propName, withAlpha);
        colorAnim._setToProps({ tint: color });
        return colorAnim;
    }
    Anim.colorTo = colorTo;
    function tintTo(color) { return colorTo('tint', color); }
    Anim.tintTo = tintTo;
    function spawn(list) {
        return new Spawn(list);
    }
    Anim.spawn = spawn;
    function sequence(list) {
        return new Sequence(list);
    }
    Anim.sequence = sequence;
    function callFunc(callback, context, params) {
        if (context === void 0) { context = null; }
        if (params === void 0) { params = null; }
        return new CallFunc(callback, context, params);
    }
    Anim.callFunc = callFunc;
    function log() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return callFunc(console.log, console, args);
    }
    Anim.log = log;
    function warn() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return callFunc(console.warn, console, args);
    }
    Anim.warn = warn;
    function error() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return callFunc(console.error, console, args);
    }
    Anim.error = error;
    function event(name, bubbles) {
        if (bubbles === void 0) { bubbles = false; }
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return new DropEvent(name, bubbles, args);
    }
    Anim.event = event;
    function playerPlay(player) {
        return new PlayerSetState(player, PlayState.PLAY);
    }
    Anim.playerPlay = playerPlay;
    function playerPause(player) {
        return new PlayerSetState(player, PlayState.PAUSE);
    }
    Anim.playerPause = playerPause;
    function playerResume(player) {
        return new PlayerSetState(player, PlayState.RESUME);
    }
    Anim.playerResume = playerResume;
    function playerStop(player) {
        return new PlayerSetState(player, PlayState.STOP);
    }
    Anim.playerStop = playerStop;
    function visible(value) {
        return new Visible(value);
    }
    Anim.visible = visible;
    function show() { return visible(true); }
    Anim.show = show;
    function hide() { return visible(false); }
    Anim.hide = hide;
    function removeFromParent() {
        return new RemoveFromParent();
    }
    Anim.removeFromParent = removeFromParent;
    function addToParent(parent) {
        return new AddToParent(parent);
    }
    Anim.addToParent = addToParent;
    function regular(t, b, c, d) {
        return t;
    }
    function strongIn(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    }
    function strongOut(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    }
    function strongInOut(t, b, c, d) {
        if ((t /= d / 2) < 1)
            return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
    var backConst = 1.70158;
    function backIn(t, b, c, d) {
        return c * (t /= d) * t * ((backConst + 1) * t - backConst) + b;
    }
    function backOut(t, b, c, d) {
        return c * ((t = t / d - 1) * t * ((backConst + 1) * t + backConst) + 1) + b;
    }
    function backInOut(t, b, c, d) {
        var s = backConst;
        if ((t /= d / 2) < 1)
            return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    }
    function elasticIn(t, b, c, d) {
        var a = 0;
        var p = 0;
        if (t === 0)
            return b;
        if ((t /= d) === 1)
            return b + c;
        if (!p)
            p = d * 0.3;
        var s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    function elasticOut(t, b, c, d) {
        var a = 0;
        var p = 0;
        if (t === 0)
            return b;
        if ((t /= d) === 1)
            return b + c;
        if (!p)
            p = d * 0.3;
        var s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
    function elasticInOut(t, b, c, d) {
        var a = 0;
        var p = 0;
        if (t === 0)
            return b;
        if ((t /= d / 2) === 2)
            return b + c;
        if (!p)
            p = d * (0.3 * 1.5);
        var s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        if (t < 1) {
            return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        }
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
    }
    function circIn(t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    }
    function circOut(t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    }
    function circInOut(t, b, c, d) {
        if ((t /= d / 2) < 1)
            return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    }
    function cubicIn(t, b, c, d) {
        return c * (t /= d) * t * t + b;
    }
    function cubicOut(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    }
    function cubicInOut(t, b, c, d) {
        if ((t /= d / 2) < 1)
            return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    }
    function expIn(t, b, c, d) {
        return (t === 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    }
    function expOut(t, b, c, d) {
        return (t === d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
    function expInOut(t, b, c, d) {
        if (t === 0)
            return b;
        if (t === d)
            return b + c;
        if ((t /= d / 2) < 1)
            return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
    function quadIn(t, b, c, d) {
        return c * (t /= d) * t + b;
    }
    function quadOut(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    }
    function quadInOut(t, b, c, d) {
        if ((t /= d / 2) < 1)
            return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
    function quartIn(t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    }
    function quartOut(t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    }
    function quartInOut(t, b, c, d) {
        if ((t /= d / 2) < 1)
            return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
    function quintIn(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    }
    function quintOut(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    }
    function quintInOut(t, b, c, d) {
        if ((t /= d / 2) < 1)
            return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    }
    function sinIn(t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    }
    function sinOut(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    }
    function sinInOut(t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    }
    function bounceIn(t, b, c, d) {
        return c - bounceOut(d - t, 0, c, d);
    }
    function bounceOut(t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        }
        else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        }
        else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        }
        else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    }
    function bounceInOut(t, b, c, d) {
        if (t < d / 2)
            return bounceIn(t * 2, 0, c, d) * .5 + b;
        return bounceOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    }
    var Rgb = (function () {
        function Rgb(color, withAlpha) {
            if (color === void 0) { color = 0; }
            if (withAlpha === void 0) { withAlpha = true; }
            this.update(color);
        }
        Rgb.prototype.update = function (color) {
            this.color = color;
            if (color > 0) {
                if (this.withAlpha) {
                    this.alpha = (color >> 24) & 0xff;
                }
                else {
                    this.alpha = 0;
                }
                this.red = (color >> 16) & 0xff;
                this.green = (color >> 8) & 0xff;
                this.blue = color & 0xff;
            }
            else {
                this.alpha = this.withAlpha ? 255 : 0;
                this.red = 0;
                this.green = 0;
                this.blue = 0;
            }
        };
        Rgb.prototype.updateRgb = function (red, green, blue, alpha) {
            this.red = red;
            this.green = green;
            this.blue = blue;
            this.alpha = alpha;
            this.color = alpha << 24 | red << 16 | green << 8 | blue;
        };
        Rgb.interpolation = function (from, to, percent, rgb) {
            if (rgb === void 0) { rgb = null; }
            var alpha = Math.round(from.alpha + (to.alpha - from.alpha) * percent);
            var red = Math.round(from.red + (to.red - from.red) * percent);
            var green = Math.round(from.green + (to.green - from.green) * percent);
            var blue = Math.round(from.blue + (to.blue - from.blue) * percent);
            rgb = rgb || new Rgb();
            rgb.updateRgb(red, green, blue, alpha);
            return rgb;
        };
        return Rgb;
    }());
})(Anim = exports.Anim || (exports.Anim = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQW5pbWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUVBLElBQWMsSUFBSSxDQSt6Q2pCO0FBL3pDRCxXQUFjLElBQUk7SUFDZDtRQUFBO1lBQ0ksY0FBUyxHQUFVLENBQUMsQ0FBQztZQUNyQixTQUFJLEdBQVUsQ0FBQyxDQUFDO1lBQ2hCLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBMEI3QixDQUFDO1FBekJHLDRCQUFNLEdBQU4sVUFBTyxLQUFLO1lBQ1IsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7YUFDdEI7aUJBQU07Z0JBQ0gsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsRUFBRTtvQkFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7aUJBQy9CO2dCQUNELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3RDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFDLE9BQU8sQ0FBQzthQUM3QjtZQUVELEtBQUssSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEM7UUFDTCxDQUFDO1FBRUQseUJBQUcsR0FBSCxVQUFJLE1BQWE7WUFDYixJQUFNLEtBQUssR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZ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