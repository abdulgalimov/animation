/**
 * Created by Zaur abdulgalimov@gmail.com on 19.08.17.
 */

var animation = animation||new (function Animation() {});

(function(anim){
    anim.util = {};
    anim.util.Flags = {
        FROM: 0x01,
        STATIC: 0x02,
        CUSTOM_PROPERTY: 0x04,
        REVERSE: 0x08
    };
    anim.util.extend = function(childClass, superClass, superClassName) {
        childClass.prototype = Object.create(superClass.prototype);
        childClass.prototype.constructor = childClass;
        childClass.prototype['super'+superClassName] = function() {
            superClass.apply(this, arguments);
        };
        childClass.prototype.super = superClass.prototype;
        return childClass.prototype;
    };
    //
    var Model = function() {
    };
    Object.defineProperties(Model.prototype, {
        setRelative: {
            value: function(value) {
                Object.defineProperty(this, 'isRelative', {
                    value: value,
                    configurable: true,
                    enumerable: true
                })
            }
        },
        copy: {
            value: function(model) {
                for (var key in model) {
                    this[key] = model[key];
                }
            }
        }
    });
    anim.util.Model = Model;
    //
    anim.core = {};
})(animation);


(function(anim){
    var Ticker = function() {
        this._targets = [];
        this._registered = false;
    };
    var prototype = Ticker.prototype;
    prototype.registerStarter = function(startCallback) {
        this.startCallback = startCallback;
    };

    prototype.update = function() {
        for (var i=0; i<this._targets.length; i++) {
            this._targets[i]._update();
        }
    };
    prototype.add = function(target) {
        if (~this._targets.indexOf(target)) return;
        this._targets.push(target);
        //
        if (!this._registered) {
            this._registered = true;
            this.startCallback(true);
        }
    };
    prototype.remove = function(target) {
        var index = this._targets.indexOf(target);
        if (!~index) return;
        this._targets.splice(index, 1);
        if (!this._targets.length && this._registered) {
            this._registered = false;
            this.startCallback(true);
        }
    };
    anim.util.ticker = new Ticker();

})(animation);