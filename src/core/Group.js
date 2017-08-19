/**
 * Created by Zaur abdulgalimov@gmail.com on 06.06.17.
 */

// Group ************************************************************************************************

(function(anim){
    var Group = function(list) {
        this.superProperty();
        this.list(list);
    };
    anim.core.Group = Group;
    var prototype = anim.util.extend(Group, anim.core.Property, 'Property');

    prototype._calculate = function(prevStep, beginTime) {
        prototype.super._calculate.apply(this, arguments);
    };

    prototype.list = function(list) {
        this._list = list;
        for (var i=0; i<this._list.length; i++) {
            this._list[i]._setParent(this);
        }
        return this;
    };

    prototype._reset = function() {
        for (var i=0; i<this._list.length; i++) {
            this._list[i]._reset();
        }
    };

    prototype.apply = function(elapsed) {
        for (var i=0; i<this._list.length; i++) {
            this._list[i]._checkTime.apply(this._list[i], arguments);
        }
        //
        prototype.super.apply.apply(this, arguments);
    };

})(animation);

// Sequence ************************************************************************************************

(function(anim){
    var Sequence = function(list) {
        this.superGroup(list);
    };
    anim.core.Sequence = Sequence;
    var prototype = anim.util.extend(Sequence, anim.core.Group, 'Group');

    prototype._calculate = function(prevStep, beginTime) {
        prototype.super._calculate.apply(this, arguments);
        //
        var animation;
        var sumDuration = 0;
        for (var i=0; i<this._list.length; i++) {
            animation = this._list[i];
            animation._calculate(prevStep, beginTime);
            //
            sumDuration += animation._data.duration;
            //
            this._data.to.copy(animation._data.to);
            //
            prevStep = animation;
            beginTime += animation._data.duration;
        }
        //
        this._data.duration = sumDuration;
        //
        return this;
    };

    anim.sequence = function(/** items */) {
        var list = [];
        for (var i=0; i<arguments.length; i++) {
            if (Array.isArray(arguments[i])) {
                list = list.concat(arguments[i]);
            } else {
                list.push(arguments[i]);
            }
        }
        return new Sequence(list);
    };
    prototype.duration = function() {
        console.error('Для Sequence свойство duration не определено. Определяется как сумма его дочерних элементов');
        return this;
    };
})(animation);


// Spawn ************************************************************************************************


(function(anim){
    var Spawn = function(list) {
        this.superGroup(list);
    };
    anim.core.Spawn = Spawn;
    var prototype = anim.util.extend(Spawn, anim.core.Group, 'Group');

    prototype._calculate = function(prevStep, beginTime) {
        prototype.super._calculate.apply(this, arguments);
        //
        var animation;
        var maxDuration = 0;
        for (var i=0; i<this._list.length; i++) {
            animation = this._list[i];
            animation._calculate(prevStep, beginTime);
            //
            this._data.to.copy(animation._data.to);
            //
            maxDuration = Math.max(maxDuration, animation._data.duration);
        }
        //
        this._data.duration = this._duration||maxDuration;
        //
        return this;
    };

    anim.spawn = function(/** items */) {
        var list = [];
        for (var i=0; i<arguments.length; i++) {
            if (Array.isArray(arguments[i])) {
                list = list.concat(arguments[i]);
            } else {
                list.push(arguments[i]);
            }
        }
        return new Spawn(list);
    }
})(animation);