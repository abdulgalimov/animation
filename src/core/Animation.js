/**
 * Created by Zaur abdulgalimov@gmail.com on 02.06.17.
 */

// Animation ************************************************************************************************

(function(anim){
    var State = anim.State = {
        STOP: 1,
        PLAY: 2,
        PAUSE: 3
    };

    var idCount = 1;
    var Animation = function() {
        this.id = idCount++;
        this._flags = 0;
        //
        this._data = {};
        this._data.from = new anim.util.Model();
        this._data.to = new anim.util.Model();
        this._current = new anim.util.Model();
        //
        this._setState(State.STOP);
    };
    anim.core.Animation = Animation;
    var prototype = Animation.prototype;
    Object.defineProperties(prototype, {
        root: {
            get: function() {
                var p = this;
                while (p._parent) p = p._parent;
                return p;
            }
        },
        elapsed: {
            get: function() {return this._elapsed;}
        },
        name: {
            get: function() {return this._name;}
        }
    });

    prototype._setState = function(state) {
        Object.defineProperty(this, 'state', {
            value: state,
            enumerable: true,
            configurable: true
        })
    };

    prototype._addTicker = function() {
        anim.util.ticker.add(this);
    };
    prototype._removeTicker = function() {
        anim.util.ticker.remove(this);
    };

    prototype._addFlag = function(flag) {
        this._flags |= flag;
    };
    prototype._delFlag = function(flag) {
        this._flags = this._flags & ~flag;
    };

    prototype._setParent = function(parent) {
        Object.defineProperty(this, '_parent', {
            value: parent,
            configurable: true
        });
        return this;
    };

    prototype._calculate = function(prevStep, beginTime) {
        if (prevStep) {
            Object.assign(this._data.to, prevStep._data.to);
        }
        this._data.beginTime = beginTime;
        this._data.repeatCount = 0;
        this._elapsed = 0;
        this._setState(State.STOP);
        //
        if (this._flags & anim.util.Flags.STATIC) {
            this._data.duration = 0;
        } else {
            if (this._duration) {
                this._data.duration = this._duration;
            } else {
                var p = this._parent;
                while (!this._data.duration && p) {
                    this._data.duration = p._duration;
                    p = p._parent;
                }
            }
        }
        //
        var easeParent = this;
        while (!easeParent._ease && easeParent._parent) {
            easeParent = easeParent._parent;
        }
        this._data.ease = easeParent._ease;
        //
        return this;
    };

    prototype._isReverse = function() {
        var reverseParent = this;
        while (!(reverseParent._flags & anim.util.Flags.REVERSE) && reverseParent._parent) {
            reverseParent = reverseParent._parent;
        }
        return !!(reverseParent._flags & anim.util.Flags.REVERSE);
    };

    prototype._update = function() {
        var elapsed = performance.now()-this._startTime;
        if (this._isReverse()) {
            elapsed = this._data.duration-elapsed;
        }
        this._checkTime(elapsed);
        if (this._state === 1) {
            this._removeTicker();
            this._setState(State.STOP);
            this.dispatch('complete');
        }
    };

    prototype._checkTime = function(time) {
        this._elapsed = time;
        if (this._elapsed < this._data.beginTime) {
            this._state = -1;
            return;
        }
        this._state = 0;
        if (this._elapsed > this._data.duration+this._data.beginTime) {
            if (this._loop && this._loop > this._data.repeatCount) {
                var t = this._elapsed - this._data.beginTime;
                var count = Math.floor(t/this._data.duration);
                this._elapsed = this._data.beginTime + this._elapsed - count*this._data.duration;
                if (count !== this._data.repeatCount) {
                    this._data.repeatCount = count;
                    this.dispatch('loop', {count:count});
                    if (this._data.repeatCount < this._loop) this._reset();
                }
            } else {
                this._state = 1;
                this._elapsed = this._data.beginTime + this._data.duration * (this._data.repeatCount+1);
                this.apply(this._elapsed, 1, 0);
                return;
            }
        }
        //
        var percent = (this._elapsed-this._data.beginTime)/this._data.duration;
        this._modify(this._elapsed, percent);
    };
    prototype._modify = function(elapsed, percent) {
        if (this._data.ease) {
            percent = this._data.ease(percent, 0, 1, 1);
        }
        var fluctuation = 0;
        if (this._fluctuation) {
            fluctuation = this._fluctuation.amplitude * Math.abs(Math.sin(percent*Math.PI*this._fluctuation.count));
            if (this._fluctuation.fading) {
                fluctuation *= 1-percent;
            }
        }
        this.apply(elapsed, percent, fluctuation);
    };
    prototype._reset = function() {
        // override me
    };
    prototype.apply = function(elapsed, percent) {
        if (this._hasEvent('change')) {
            this.dispatch('change', {
                elapsed: elapsed,
                percent: percent
            })
        }
    };

    // public api

    prototype.setTarget = function(target) {
        Object.defineProperty(this, '_target', {
            value: target,
            configurable: true
        });
        return this;
    };

    prototype.duration = function(value) {
        Object.defineProperty(this, '_duration', {
            value: value,
            configurable: true
        });
        return this;
    };

    prototype.fluctuation = function(amplitude, count, fading) {
        if (isNaN(amplitude)) {
            console.log('Fluctuation amplitude isNaN', amplitude);
            amplitude = 0;
        }
        count = count||1;
        //
        var fluctuation = {
            amplitude: amplitude,
            count: count,
            fading: !!fading
        };
        try {
            Object.freeze(fluctuation);
        } catch(e) {}
        Object.defineProperty(this, '_fluctuation', {
            value: fluctuation,
            configurable: true
        });
        return this;
    };

    prototype.loop = function() {
        var value = arguments.length > 0 ? +arguments[0] : Number.MAX_VALUE;
        if (isNaN(value)) {
            console.error('Loop value isNaN: ', arguments[0]);
            value = Number.MAX_VALUE;
        }
        Object.defineProperty(this, '_loop', {
            value: value,
            configurable: true
        });
        return this;
    };

    prototype.setName = function(name) {
        this._name = name;
        return this;
    };

    prototype.finish = function() {
        this._calculate(null, 0);
        this._finished = true;
        return this;
    };

    prototype.play = function() {
        if (!this._finished) this.finish();
        this._setState(State.PLAY);
        this._startTime = performance.now();
        this._addTicker();
        this._checkTime(0);
        return this;
    };
    prototype.gotoAndStop = function(time) {
        this._setState(State.STOP);
        this._startTime = performance.now();
        this._checkTime(time);
        return this;
    };
    prototype.gotoAndPlay = function(time) {
        this._setState(State.PLAY);
        this._startTime = performance.now()-time;
        this._addTicker();
        this._checkTime(time);
        return this;
    };
    prototype.pause = function() {
        if (this.state !== State.PLAY) return;
        this._setState(State.PAUSE);
        this._removeTicker();
        return this;
    };
    prototype.resume = function() {
        if (this.state !== State.PAUSE) return;
        this._setState(State.PLAY);
        this._startTime = performance.now()-this._elapsed;
        this._addTicker();
        return this;
    }
})(animation);

// events ************************************************************************************************

(function(anim){
    var prototype = anim.core.Animation.prototype;

    prototype._hasEvent = function(eventName, callback, context) {
        if (!this._events) return -1;
        var list = !this._events[eventName];
        if (!list) return -1;
        //
        if (!callback) return true;
        //
        var event;
        for (var i=0; i<list.length; i++) {
            event = list[i];
            if (event.callback === callback && event.context === context) {
                return i;
            }
        }
        return -1;
    };

    prototype.on = function(eventName, callback, context, args) {
        if (!this._events) this._events = {};
        if (this._hasEvent(eventName, callback, context) > -1) return this;
        if (!this._events[eventName]) this._events[eventName] = [];
        //
        this._events[eventName].push({
            callback: callback,
            context: context,
            args: args
        });
        return this;
    };

    prototype.dispatch = function(eventName, data) {
        if (!this._events || !this._events[eventName]) return;
        var list = this._events[eventName];
        var event;
        for (var i=0; i<list.length; i++) {
            event = list[i];
            if (event.args) data.args = event.args;
            event.callback.call(event.context, data, this);
        }
    };

    prototype.off = function(eventName, callback, context) {
        if (!this._events) return this;
        var index = this._hasEvent(eventName, callback, context);
        if (index > -1) {
            this._events[eventName].splice(i, 1);
        }
        return this;
    };

})(animation);

// Interval ************************************************************************************************

(function(anim){
    var Interval = function() {
        this.superAnimation();
    };
    anim.core.Interval = Interval;
    var prototype = anim.util.extend(Interval, anim.core.Animation, 'Animation');

    prototype._calculate = function() {
        prototype.super._calculate.apply(this, arguments);
    };

})(animation);

// Timeout ************************************************************************************************

(function(anim){
    var Timeout = function(time) {
        this.superInterval();
        this.duration(time);
    };
    anim.core.Timeout = Timeout;
    var prototype = anim.util.extend(Timeout, anim.core.Interval, 'Interval');

    prototype._calculate = function() {
        prototype.super._calculate.apply(this, arguments);
    };

    anim.timeout = function(time) {
        return new Timeout(time);
    }

})(animation);

// Property ************************************************************************************************

(function(anim){

    var Property = function(keys) {
        this.superInterval();
        if (keys) {
            this._keysList = keys;
            this._keys = {};
            if (keys) for (var i = 0; i < keys.length; i++) {
                this._keys[keys[i]] = 1;
            }
        }
        //
        this._info = {};
        this._info.from = new anim.util.Model();
        this._info.from.setRelative(true);
        this._info.to = new anim.util.Model();
        //
    };
    anim.core.Property = Property;
    var prototype = anim.util.extend(Property, anim.core.Interval, 'Interval');

    prototype._calculate = function(prevStep, beginTime) {
        prototype.super._calculate.apply(this, arguments);
        //
        if (this._keysList) for (var i=0; i<this._keysList.length; i++) {
            var key = this._keysList[i];
            var targetValue;
            if (prevStep && prevStep._data.to.hasOwnProperty(key)) {
                targetValue = prevStep._data.to[key];
            } else {
                if (this._flags & anim.util.Flags.CUSTOM_PROPERTY) {
                    targetValue = this._getTargetValue(key);
                } else {
                    targetValue = this.root._target[key];
                }
            }
            if (this._info.from.isRelative) {
                this._data.from[key] = targetValue;
            } else {
                this._data.from[key] = this._info.from[key];
            }
            //
            this._data.to[key] = this._info.to[key];
            if (this._info.to.isRelative) {
                this._data.to[key] += targetValue;
            }
        }
        //
        return this;
    };

    prototype._getTargetValue = function(key) {
        console.log('_getTargetValue:override me, key='+key);
    };
    prototype._setTargetValue = function(key, value) {
        console.log('_setTargetValue:override me, key='+key+', value='+value);
    };

    prototype.from = function(values) {
        for (var i=0; i<values.length; i++) {
            this._info.from[this._keysList[i]] = values[i];
        }
        this._info.from.setRelative(false);
        return this;
    };
    prototype.to = function(values, relative) {
        for (var i=0; i<values.length; i++) {
            this._info.to[this._keysList[i]] = values[i];
        }
        if (relative) this._info.to.setRelative(true);
        return this;
    };

    prototype.apply = function(elapsed, percent, fluctuation) {
        var key;
        if (this._keysList) for (var i=0; i<this._keysList.length;  i++) {
            key = this._keysList[i];
            this._current[key] = this._data.from[key] + percent * (this._data.to[key]-this._data.from[key]) + fluctuation;
            //
            if (this._flags & anim.util.Flags.CUSTOM_PROPERTY) {
                this._setTargetValue(key, this._current[key]);
            } else {
                this.root._target[key] = this._current[key];
            }
        }
        //
        prototype.super.apply.apply(this, arguments);
    };


})(animation);

// Static ************************************************************************************************

(function(anim){
    var Static = function() {
        this.superAnimation();
        this.duration(0);
        this._addFlag(anim.util.Flags.STATIC);
    };
    anim.core.Static = Static;
    var prototype = anim.util.extend(Static, anim.core.Animation, 'Animation');

    prototype._calculate = function() {
        prototype.super._calculate.apply(this, arguments);
        this._data.progress = false;
    };

    prototype._reset = function() {
        this._data.progress = false;
    };

    prototype.duration = function() {
        prototype.super.duration.call(this, 0);
    };

    prototype._checkTime = function(elapsed) {
        if (elapsed < this._data.beginTime) return;
        if (elapsed >= this._data.duration+this._data.beginTime && !this._data.progress) {
            this._data.progress = true;
            this.apply(0, 0);
        }
    };

})(animation);

// CallFunc ************************************************************************************************

(function(anim){
    var CallFunc = function(func, context, args) {
        this.superStatic();
        this.func(func);
        this.context(context);
        this.args(args);
    };
    anim.core.CallFunc = CallFunc;
    var prototype = anim.util.extend(CallFunc, anim.core.Static, 'Static');

    prototype.func = function(func) {
        this._func = func;
        return this;
    };

    prototype.context = function(context) {
        this._context = context;
        return this;
    };

    prototype.args = function(args) {
        this._args = args;
        return this;
    };

    prototype.apply = function() {
        if (this._func) {
            this._func.apply(this._context, this._args);
        }
        prototype.super.apply.apply(this, arguments);
    };

    anim.callFunc = function(func, context, args) {
        return new CallFunc(func, context, args);
    };

})(animation);

// Reverse ************************************************************************************************

(function(anim){
    var Reverse = function(targetAnim) {
        this.superInterval();
        this._addFlag(anim.util.Flags.REVERSE);
        this._animation = targetAnim;
        this._animation._setParent(this);
    };
    anim.core.Reverse = Reverse;
    var prototype = anim.util.extend(Reverse, anim.core.Interval, 'Interval');

    prototype._calculate = function() {
        prototype.super._calculate.apply(this, arguments);
        this._animation._calculate.apply(this._animation, arguments);
        if (!this._data.duration && this._animation._data.duration) {
            this._data.duration = this._animation._data.duration;
        }
    };
    prototype._reset = function() {
        prototype.super._reset.apply(this, arguments);
        this._animation._reset.apply(this._animation, arguments);
    };
    prototype._modify = function(elapsed, percent) {
        this._animation._modify.call(this._animation, elapsed, percent);
    };

    anim.reverse = function(targetAnim) {
        return new Reverse(targetAnim);
    }

})(animation);

// Custom ************************************************************************************************

(function(anim){
    var Custom = function(keys) {
        this.superProperty(keys);
    };
    anim.core.Custom = Custom;
    anim.util.extend(Custom, anim.core.Property, 'Property');

    anim.customTo = function(obj) {
        var keys = [];
        var values = [];
        for (var key in obj) {
            keys.push(key)
            values.push(obj[key]);
        }
        return new Custom(keys).to(values);
    };
    anim.customAdd = function(obj) {
        var keys = [];
        var values = [];
        for (var key in obj) {
            keys.push(key)
            values.push(obj[key]);
        }
        return new Custom(keys).to(values, true);
    };
    anim.alphaFromTo = function(from, to) {
        var keys = [];
        var valuesFrom = [];
        for (var key in from) {
            keys.push(key)
            valuesFrom.push(from[key]);
        }
        var valuesTo = [];
        for (var key in from) {
            valuesTo.push(to[key]);
        }
        return new Custom(keys).from(valuesFrom).to(valuesTo);
    };

})(animation);