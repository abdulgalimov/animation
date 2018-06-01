/**
 * Created by Zaur on 02.06.17.
 */

var animation = animation||new (function Animation() {});

(function(anim){
    var Movie = function(keys) {
        this.superProperty(keys);
    };
    anim.core.Movie = Movie;
    anim.util.extend(Movie, anim.core.Property, 'Property');

    anim.moveTo = function() {
        var x, y;
        if (arguments.length === 1) {
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            x = arguments[0];
            y = arguments[1];
        }
        return new Movie(['x', 'y']).to([x, y]);
    };
    anim.moveAdd = function() {
        var x, y;
        if (arguments.length === 1) {
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            x = arguments[0];
            y = arguments[1];
        }
        return new Movie(['x', 'y']).to([x, y], true);
    };
    anim.moveFromTo = function() {
        var fromX, fromY, toX, toY;
        if (arguments.length === 2) {
            fromX = arguments[0].x;
            fromY = arguments[0].y;
            toX = arguments[1].x;
            toY = arguments[1].y;
        } else {
            fromX = arguments[0];
            fromY = arguments[1];
            toX = arguments[2];
            toY = arguments[3];
        }
        return new Movie(['x', 'y']).from([fromX, fromY]).to([toX, toY]);
    };

    anim.moveToX = function(x) {
        return new Movie(['x']).to([x]);
    };
    anim.moveAddX = function(x) {
        return new Movie(['x']).to([x], true);
    };
    anim.moveFromToX = function(from, to) {
        return new Movie(['x']).from([from]).to([to]);
    };

    anim.moveToY = function(y) {
        return new Movie(['y']).to([y]);
    };
    anim.moveAddY = function(y) {
        return new Movie(['y']).to([y], true);
    };
    anim.moveFromToY = function(from, to) {
        return new Movie(['y']).from([from]).to([to]);
    };

})(animation);


(function(anim){
    var Scale = function(keys) {
        this.superProperty(keys);
        this._addFlag(anim.util.Flags.CUSTOM_PROPERTY);
    };
    anim.core.Scale = Scale;
    var prototype = anim.util.extend(Scale, anim.core.Property, 'Property');

    prototype._getTargetValue = function(key) {
        if (key === 'scaleX') return this.target.scale.x;
        if (key === 'scaleY') return this.target.scale.y;
        return 0;
    };
    prototype._setTargetValue = function(key, value) {
        if (key === 'scaleX') this.target.scale.x = value;
        else if (key === 'scaleY') this.target.scale.y = value;
        return 0;
    };

    anim.scaleTo = function() {
        var x, y;
        if (arguments.length === 1) {
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            x = arguments[0];
            y = arguments[1];
        }
        return new Scale(['scaleX', 'scaleY']).to([x, y]);
    };
    anim.scaleAdd = function() {
        var x, y;
        if (arguments.length === 1) {
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            x = arguments[0];
            y = arguments[1];
        }
        return new Scale(['scaleX', 'scaleY']).to([x, y], true);
    };
    anim.scaleFromTo = function() {
        var fromX, fromY, toX, toY;
        if (arguments.length === 2) {
            fromX = arguments[0].x;
            fromY = arguments[0].y;
            toX = arguments[1].x;
            toY = arguments[1].y;
        } else {
            fromX = arguments[0];
            fromY = arguments[1];
            toX = arguments[2];
            toY = arguments[3];
        }
        return new Scale(['scaleX', 'scaleY']).from([fromX, fromY]).to([toX, toY]);
    };

})(animation);


(function(anim){
    var Rotation = function(keys) {
        console.log('new Rotation', this);
        this.superProperty(keys);
    };
    anim.core.Rotation = Rotation;
    anim.util.extend(Rotation, anim.core.Property, 'Property');

    anim.rotateTo = function(rotation) {
        return new Rotation(['rotation']).to([rotation]);
    };
    anim.rotateAdd = function(rotation) {
        return new Rotation(['rotation']).to([rotation], true);
    };
    anim.rotateFromTo = function(from, to) {
        return new Rotation(['rotation']).from([from]).to([to]);
    };

})(animation);


(function(anim){
    var Alpha = function(keys) {
        this.superProperty(keys);
    };
    anim.core.Alpha = Alpha;
    anim.util.extend(Alpha, anim.core.Property, 'Property');

    anim.alphaTo = function(alpha) {
        return new Alpha(['alpha']).to([alpha]);
    };
    anim.alphaAdd = function(alpha) {
        return new Alpha(['alpha']).to([alpha], true);
    };
    anim.alphaFromTo = function(from, to) {
        return new Alpha(['alpha']).from([from]).to([to]);
    };

})(animation);

(function(anim){
    var Anchor = function(keys) {
        this.superProperty(keys);
        this._addFlag(anim.util.Flags.CUSTOM_PROPERTY);
    };
    anim.core.Anchor = Anchor;
    var prototype = anim.util.extend(Anchor, anim.core.Property, 'Property');

    prototype._getTargetValue = function(key) {
        if (key === 'anchorX') return this.target.anchor.x;
        if (key === 'anchorY') return this.target.anchor.y;
        return 0;
    };
    prototype._setTargetValue = function(key, value) {
        if (key === 'anchorX') this.target.anchor.x = value;
        else if (key === 'anchorY') this.target.anchor.y = value;
    };

    anim.anchorTo = function() {
        var x, y;
        if (arguments.length === 1) {
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            x = arguments[0];
            y = arguments[1];
        }
        return new Anchor(['anchorX', 'anchorY']).to([x, y]);
    };
    anim.anchorAdd = function() {
        var x, y;
        if (arguments.length === 1) {
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            x = arguments[0];
            y = arguments[1];
        }
        return new Anchor(['anchorX', 'anchorY']).to([x, y], true);
    };
    anim.anchorFromTo = function() {
        var fromX, fromY, toX, toY;
        if (arguments.length === 2) {
            fromX = arguments[0].x;
            fromY = arguments[0].y;
            toX = arguments[1].x;
            toY = arguments[1].y;
        } else {
            fromX = arguments[0];
            fromY = arguments[1];
            toX = arguments[2];
            toY = arguments[3];
        }
        return new Anchor(['anchorX', 'anchorY']).from([fromX, fromY]).to([toX, toY]);
    };

})(animation);


(function(anim){
    var Visible = function(value) {
        this.superStatic();
        this.value(value);
    };
    anim.core.Visible = Visible;
    var prototype = anim.util.extend(Visible, anim.core.Static, 'Static');

    prototype.value = function(value) {
        this._value = value;
        return this;
    };

    prototype.apply = function() {
        this.target.visible = this._value;
    };

    anim.visible = function(value) {
        return new Visible(value);
    };
    anim.show = function() {
        return new Visible(true);
    };
    anim.hide = function() {
        return new Visible(false);
    };

})(animation);

(function(anim){
    var RemoveFromParent = function(value) {
        this.superStatic();
        this.value(value);
    };
    anim.core.RemoveFromParent = RemoveFromParent;
    var prototype = anim.util.extend(RemoveFromParent, anim.core.Static, 'Static');

    prototype.value = function(value) {
        this._value = value;
        return this;
    };

    prototype.apply = function() {
        if (this.target.parent) {
            this.target.parent.removeChild(this.target);
        }
    };

    anim.removeFromParent = function(value) {
        return new RemoveFromParent();
    };

})(animation);