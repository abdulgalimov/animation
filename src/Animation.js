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
            this.targets = {};
        }
        PropsContainer.prototype.get = function (target, key) {
            return this.targets[target.__anim_id] ? this.targets[target.__anim_id][key] : 0;
        };
        PropsContainer.prototype.has = function (target, key) {
            return this.targets[target.__anim_id] && this.targets[target.__anim_id].hasOwnProperty(key);
        };
        PropsContainer.prototype.set = function (target, key, value) {
            if (!this.targets[target.__anim_id])
                this.targets[target.__anim_id] = {};
            this.targets[target.__anim_id][key] = value;
        };
        PropsContainer.prototype.add = function (target, key, value) {
            if (!this.targets[target.__anim_id])
                this.targets[target.__anim_id] = {};
            if (!this.targets[target.__anim_id][key])
                this.targets[target.__anim_id][key] = 0;
            this.targets[target.__anim_id][key] += value;
        };
        PropsContainer.prototype.addProps = function (props) {
            for (var key in props.targets) {
                if (!this.targets[key])
                    this.targets[key] = {};
                for (var key2 in props.targets[key]) {
                    this.targets[key][key2] = props.targets[key][key2];
                }
            }
        };
        PropsContainer.prototype.clear = function () {
            this.targets = {};
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
            if (!this._target.__anim_id) {
                Object.defineProperty(this._target, '__anim_id', {
                    value: 'anim_' + (Player.IdCount++),
                    configurable: false,
                    enumerable: false
                });
            }
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
        Player.IdCount = 0;
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
            var target = this._state.target;
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                if (this._fromProps) {
                    this._state.from.set(target, key, this._fromProps[key]);
                }
                else {
                    if (props.has(target, key)) {
                        this._state.from.set(target, key, props.get(target, key));
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
                        this._state.from.set(target, key, value);
                    }
                }
                this._state.to.set(target, key, this._toProps[key]);
                if (this._relative) {
                    this._state.to.add(target, key, this._state.from.get(target, key));
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
            var target = this._state.target;
            var value = this._state.from.get(target, key) + (this._state.to.get(target, key) - this._state.from.get(target, key)) * this._state.position;
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
            this.fromRgb.update(this._state.from.get(this._state.target, this.propName));
            this.toRgb.update(this._state.to.get(this._state.target, this.propName));
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
                x: xOrPos.x,
                y: xOrPos.y
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
})(Anim || (Anim = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQW5pbWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSxJQUFPLElBQUksQ0F5MkNWO0FBejJDRCxXQUFPLElBQUk7SUFDUDtRQUFBO1lBQ0ksY0FBUyxHQUFVLENBQUMsQ0FBQztZQUNyQixTQUFJLEdBQVUsQ0FBQyxDQUFDO1lBQ2hCLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBMEI3QixDQUFDO1FBekJHLDRCQUFNLEdBQU4sVUFBTyxLQUFLO1lBQ1IsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7YUFDdEI7aUJBQU07Z0JBQ0gsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsRUFBRTtvQkFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7aUJBQy9CO2dCQUNELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3RDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFDLE9BQU8sQ0FBQzthQUM3QjtZQUVELEtBQUssSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEM7UUFDTCxDQUFDO1FBRUQseUJBQUcsR0FBSCxVQUFJLE1BQWE7WUFDYixJQUFNLEtBQUssR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNo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QUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM1QztRQUNELE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFDRCxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsS0FBSyxDQUFDO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsQ0FBQztZQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDNUIsSUFBSSxDQUFDLENBQUM7UUFDTixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3ZCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDTixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNiO2FBQU07WUFDSCxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM1QztRQUNELElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNQLE9B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QUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUNELG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFBRSxPQUFPLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV6QyxPQUFPLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDdkIsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBQ0Qsa0JBQWtCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDeEIsT0FBTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUNELG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFH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