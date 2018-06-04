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
    var GlobalItems = /** @class */ (function () {
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
            //
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
    function log() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        console.log.apply(console, args);
    }
    function dropError(message) {
        throw new Error("AnimError: " + message);
    }
    var PropsContainer = /** @class */ (function () {
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
    var State = /** @class */ (function () {
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
        PlayState[PlayState["FINISH"] = 4] = "FINISH";
    })(PlayState = Anim.PlayState || (Anim.PlayState = {}));
    var Events;
    (function (Events) {
        Events["BEGIN"] = "begin";
        Events["CHANGE"] = "change";
        Events["END"] = "end";
    })(Events = Anim.Events || (Anim.Events = {}));
    var Player = /** @class */ (function () {
        function Player() {
            this._parent = null;
            this._duration = 0;
            this._flags = 0;
            this._pausedTime = 0;
            this._playState = PlayState.STOP;
            this._state = new State();
        }
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
        Player.prototype._setPlayState = function (state) {
            this._playState = state;
        };
        Player.prototype._dropEvent = function (event) {
            if (this._listeners && this._listeners[event]) {
                this._listeners[event].func.call(this._listeners[event].context, this);
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
        };
        Player.prototype._update = function (deltaTime, rootElapsed) {
            if (this._parent) {
                this._state.elapsedTime = rootElapsed - this._state.beginTime;
                if (this._loop) {
                    if (this._state.elapsedTime > this._state.duration) {
                        var newValue = this._state.elapsedTime - Math.floor(this._state.elapsedTime / this._state.duration) * this._state.duration;
                        this._replay();
                        this._state.elapsedTime = newValue;
                    }
                }
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
            if (this._state.elapsedTime < 0)
                this._state.elapsedTime = 0;
            if (this._state.elapsedTime > this._state.duration)
                this._state.elapsedTime = this._state.duration;
            var p = this._state.duration ? this._state.elapsedTime / this._state.duration : 0;
            if (this._name === 'c1' || this._name === 'r1') {
                console.log('pp', p, this._state.elapsedTime, this._name);
            }
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
            //if (!this._target) dropError('Target undefined');
            if (this._parent)
                dropError('Method play available in root anim only');
            //
            if (this._playState !== PlayState.PLAY) {
                if (!this._calculated)
                    this._startCalc();
                //
                this._pausedTime = 0;
                this._state.elapsedTime = time;
                this._update(0, this._state.elapsedTime);
            }
        };
        Player.prototype._startCalc = function () {
            var props = new PropsContainer();
            props.clear();
            this._calculate(props);
        };
        Player.prototype.play = function () {
            // if (!this._target) dropError('Target undefined');
            if (this._parent)
                dropError('Method play available in root anim only');
            //
            if (!this._calculated) {
                this._startCalc();
            }
            else {
                this._replay();
            }
            //
            global.add(this);
            this._pausedTime = 0;
            this._state.rootStartTime = global.time;
            this._setPlayState(PlayState.PLAY);
            //
            return this;
        };
        Player.prototype.stop = function () {
            if (this._parent)
                dropError('Method play available in root anim only');
            global.del(this);
            this._setPlayState(PlayState.STOP);
            return this;
        };
        Player.prototype.pause = function () {
            if (this._playState === PlayState.PLAY) {
                this._setPlayState(PlayState.PAUSE);
            }
        };
        Player.prototype.resume = function () {
            if (this._playState === PlayState.PAUSE) {
                this._setPlayState(PlayState.PLAY);
            }
        };
        Player.prototype.togglePause = function () {
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
    var Static = /** @class */ (function (_super) {
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
        Static.prototype._update = function (deltaTime, rootElapsed) {
            _super.prototype._update.call(this, deltaTime, rootElapsed);
            if (!this.activated && rootElapsed >= this._state.beginTime) {
                this.activated = true;
                this._activate();
            }
        };
        Static.prototype._activate = function () { };
        return Static;
    }(Player));
    var CallFunc = /** @class */ (function (_super) {
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
    var Visible = /** @class */ (function (_super) {
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
    var RemoveFromParent = /** @class */ (function (_super) {
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
    var AddToParent = /** @class */ (function (_super) {
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
    var Interval = /** @class */ (function (_super) {
        __extends(Interval, _super);
        function Interval() {
            return _super.call(this) || this;
        }
        return Interval;
    }(Player));
    var Property = /** @class */ (function (_super) {
        __extends(Property, _super);
        function Property(props) {
            if (props === void 0) { props = null; }
            var _this = _super.call(this) || this;
            _this.setName('property');
            _this.setProps(props);
            return _this;
        }
        Property.prototype.easeRegular = function () { this._ease = regular; return this; };
        Property.prototype.easeCustom = function (func) { this._ease = func; return this; };
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
            //
            this._state.from.clear();
            this._state.to.clear();
            //
            for (var i = 0; i < this._keys.length; i++) {
                var key = this._keys[i];
                //
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
                //
                this._state.to.values[key] = this._props[key];
                if (this._relative) {
                    this._state.to.values[key] += this._state.from.values[key];
                }
            }
            //
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
    var Color = /** @class */ (function (_super) {
        __extends(Color, _super);
        function Color(propName, props) {
            if (props === void 0) { props = null; }
            var _this = _super.call(this, props) || this;
            _this._flags |= Flags.COLOR;
            _this.propName = propName;
            _this.fromRgb = new Rgb();
            _this.toRgb = new Rgb();
            _this.interpolateRgb = new Rgb();
            return _this;
        }
        Color.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            //
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
    var Group = /** @class */ (function (_super) {
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
        Group.prototype._update = function (deltaTime, rootElapsed) {
            for (var i = 0; i < this.items.length; i++) {
                this.items[i]._update(deltaTime, rootElapsed);
            }
            _super.prototype._update.call(this, deltaTime, rootElapsed);
        };
        return Group;
    }(Interval));
    var Spawn = /** @class */ (function (_super) {
        __extends(Spawn, _super);
        function Spawn(items) {
            var _this = _super.call(this, items) || this;
            _this.setName('Spawn');
            return _this;
        }
        Spawn.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            //
            var maxDuration = 0;
            for (var i = 0; i < this.items.length; i++) {
                var item = this.items[i];
                if (this._state.duration) {
                    item._state.duration = this._state.duration;
                }
                item._calculate(props);
                maxDuration = Math.max(maxDuration, item._state.duration);
                if (!(item._flags & Flags.STATIC))
                    item._state.beginTime = this._state.beginTime;
            }
            if (!this._duration)
                this._state.duration = maxDuration;
        };
        return Spawn;
    }(Group));
    var Sequence = /** @class */ (function (_super) {
        __extends(Sequence, _super);
        function Sequence(items) {
            var _this = _super.call(this, items) || this;
            _this.setName('Sequence');
            return _this;
        }
        Sequence.prototype._calculate = function (props) {
            _super.prototype._calculate.call(this, props);
            //
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
            var beginTime = this._state.beginTime;
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
    // properties ********************************************************************************
    // custom
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
    // move
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
    // scale
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
    // size (width, height)
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
    // anchor
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
    // pivot
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
    // rotate
    function rotateTo(rotate) {
        return new Property().setProps({ rotation: rotate });
    }
    Anim.rotateTo = rotateTo;
    function rotateAdd(rotate) { return rotateTo(rotate)._setRelative(true); }
    Anim.rotateAdd = rotateAdd;
    // alpha
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
    // color
    function colorTo(propName, color) {
        var colorAnim = new Color(propName);
        colorAnim.setProps({ tint: color });
        return colorAnim;
    }
    Anim.colorTo = colorTo;
    function tintTo(color) { return colorTo('tint', color); }
    Anim.tintTo = tintTo;
    // group
    function spawn(list) {
        return new Spawn(list);
    }
    Anim.spawn = spawn;
    function sequence(list) {
        return new Sequence(list);
    }
    Anim.sequence = sequence;
    // static
    function callFunc(callback, context, params) {
        if (context === void 0) { context = null; }
        if (params === void 0) { params = null; }
        return new CallFunc(callback, context, params);
    }
    Anim.callFunc = callFunc;
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
    // easing *************************************************************************************
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
        //
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
        //
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
        //
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
        //
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
        //
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
        //
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
        //
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
    // rgb
    var Rgb = /** @class */ (function () {
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
                    this.alpha = 255;
                }
                this.red = (color >> 16) & 0xff;
                this.green = (color >> 8) & 0xff;
                this.blue = color & 0xff;
            }
            else {
                this.alpha = this.withAlpha ? 0 : 255;
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
            var alpha = from.alpha + (to.alpha - from.alpha) * percent;
            var red = from.red + (to.red - from.red) * percent;
            var green = from.green + (to.green - from.green) * percent;
            var blue = from.blue + (to.blue - from.blue) * percent;
            rgb = rgb || new Rgb();
            rgb.updateRgb(red, green, blue, alpha);
            return rgb;
        };
        return Rgb;
    }());
})(Anim || (Anim = {}));
