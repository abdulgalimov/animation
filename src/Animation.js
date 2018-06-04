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
        function Property(props) {
            if (props === void 0) { props = null; }
            var _this = _super.call(this) || this;
            _this.setName('property');
            _this.setProps(props);
            return _this;
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
        Property.prototype.setProps = function (props) {
            this._props = props;
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
                this._state.to.values[key] = this._props[key];
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
            var _this = _super.call(this, {}) || this;
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
            var _this = _super.call(this, items) || this;
            _this.setName('Spawn');
            return _this;
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
                if (!(item._flags & Flags.STATIC))
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
            var _this = _super.call(this, items) || this;
            _this.setName('Sequence');
            return _this;
        }
        Sequence.prototype._calculate = function (props) {
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
            var beginTime = 0;
            var fullDuration = 0;
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
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
        };
        return Sequence;
    }(Group));
    function customTo(props) {
        return new Property().setProps(props);
    }
    Anim.customTo = customTo;
    function customAdd(props) { return customTo(props)._setRelative(true); }
    Anim.customAdd = customAdd;
    function timeout(time) {
        var player = new Interval();
        player.setDuration(time);
        return player;
    }
    Anim.timeout = timeout;
    function moveToX(x) {
        return new Property().setProps({ x: x });
    }
    Anim.moveToX = moveToX;
    function moveToY(y) {
        return new Property().setProps({ y: y });
    }
    Anim.moveToY = moveToY;
    function moveTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var move = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                x: xOrPos['x'],
                y: xOrPos['y']
            });
        }
        else {
            move.setProps({
                x: xOrPos,
                y: y
            });
        }
        return move;
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
    function scaleToX(scaleX) {
        return new Property().setProps({ scaleX: scaleX });
    }
    Anim.scaleToX = scaleToX;
    function scaleToY(scaleY) {
        return new Property().setProps({ scaleY: scaleY });
    }
    Anim.scaleToY = scaleToY;
    function scaleTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var move = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                scaleX: xOrPos['x'],
                scaleY: xOrPos['y']
            });
        }
        else {
            move.setProps({
                scaleX: xOrPos,
                scaleY: y
            });
        }
        return move;
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
    function widthTo(width) {
        return new Property().setProps({ width: width });
    }
    Anim.widthTo = widthTo;
    function heightTo(height) {
        return new Property().setProps({ height: height });
    }
    Anim.heightTo = heightTo;
    function sizeTo(widthOrSize, height) {
        if (height === void 0) { height = 0; }
        var move = new Property();
        if (typeof widthOrSize !== 'number') {
            move.setProps({
                width: widthOrSize['width'],
                height: widthOrSize['height']
            });
        }
        else {
            move.setProps({
                width: widthOrSize,
                height: height
            });
        }
        return move;
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
    function anchorToX(anchorX) {
        return new Property().setProps({ anchorX: anchorX });
    }
    Anim.anchorToX = anchorToX;
    function anchorToY(anchorY) {
        return new Property().setProps({ anchorY: anchorY });
    }
    Anim.anchorToY = anchorToY;
    function anchorTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var move = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                anchorX: xOrPos['x'],
                anchorY: xOrPos['y']
            });
        }
        else {
            move.setProps({
                anchorX: xOrPos,
                anchorY: y
            });
        }
        return move;
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
    function pivotToX(pivotX) {
        return new Property().setProps({ pivotX: pivotX });
    }
    Anim.pivotToX = pivotToX;
    function pivotToY(pivotY) {
        return new Property().setProps({ pivotY: pivotY });
    }
    Anim.pivotToY = pivotToY;
    function pivotTo(xOrPos, y) {
        if (y === void 0) { y = 0; }
        var move = new Property();
        if (typeof xOrPos !== 'number') {
            move.setProps({
                pivotX: xOrPos['x'],
                pivotY: xOrPos['y']
            });
        }
        else {
            move.setProps({
                pivotX: xOrPos,
                pivotY: y
            });
        }
        return move;
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
    function rotateTo(rotate) {
        return new Property().setProps({ rotation: rotate });
    }
    Anim.rotateTo = rotateTo;
    function rotateAdd(rotate) { return rotateTo(rotate)._setRelative(true); }
    Anim.rotateAdd = rotateAdd;
    function alphaTo(alpha) {
        return new Property().setProps({ alpha: alpha });
    }
    Anim.alphaTo = alphaTo;
    function alphaAdd(alpha) { return alphaTo(alpha)._setRelative(true); }
    Anim.alphaAdd = alphaAdd;
    function fadeIn() { return alphaTo(0); }
    Anim.fadeIn = fadeIn;
    function fadeOut() { return alphaTo(1); }
    Anim.fadeOut = fadeOut;
    function colorTo(propName, color, withAlpha) {
        if (withAlpha === void 0) { withAlpha = false; }
        var colorAnim = new Color(propName, withAlpha);
        colorAnim.setProps({ tint: color });
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
        return new CallFunc(console.log, console, args);
    }
    Anim.log = log;
    function warn() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new CallFunc(console.warn, console, args);
    }
    Anim.warn = warn;
    function error() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new CallFunc(console.error, console, args);
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
    function animPlay(player) {
        return new PlayerSetState(player, PlayState.PLAY);
    }
    Anim.animPlay = animPlay;
    function animPause(player) {
        return new PlayerSetState(player, PlayState.PAUSE);
    }
    Anim.animPause = animPause;
    function animResume(player) {
        return new PlayerSetState(player, PlayState.RESUME);
    }
    Anim.animResume = animResume;
    function animStop(player) {
        return new PlayerSetState(player, PlayState.STOP);
    }
    Anim.animStop = animStop;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5pbWF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQW5pbWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSxJQUFPLElBQUksQ0E4cUNWO0FBOXFDRCxXQUFPLElBQUk7SUFDUDtRQUFBO1lBQ0ksY0FBUyxHQUFVLENBQUMsQ0FBQztZQUNyQixTQUFJLEdBQVUsQ0FBQyxDQUFDO1lBQ2hCLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBMEI3QixDQUFDO1FBekJHLDRCQUFNLEdBQU4sVUFBTyxLQUFLO1lBQ1IsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7YUFDdEI7aUJBQU07Z0JBQ0gsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLENBQUMsRUFBRTtvQkFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7aUJBQy9CO2dCQUNELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3RDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFDLE9BQU8sQ0FBQzthQUM3QjtZQUVELEtBQUssSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEM7UUFDTCxDQUFDO1FBRUQseUJBQUcsR0FBSCxVQUFJLE1BQWE7WUFDYixJQUFNLEtBQUssR0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNo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LENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxDQUFDO1lBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUM1QixJQUFJLENBQUMsQ0FBQztRQUNOLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkIsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNOLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2I7YUFBTTtZQUNILENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1AsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDakc7UUFFRCxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFD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Q0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUN6RSxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUNqRSxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUN6RSxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUNyRSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7WUFDdkIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2QyxPQUFPLEdBQUcsQ0FBQztRQUNmLENBQUM7UUFDTCxVQUFDO0lBQUQsQ0FBQyxBQS9DRCxJQStDQztBQUNMLENBQUMsRUE5cUNNLElBQUksS0FBSixJQUFJLFFBOHFDViJ9