/**
 * Created by Zaur on 04.06.17.
 */

(function(anim){

    function regular(t, b, c, d) {
        return t;
    }

    function strongIn(t, b, c, d)  {
        return c*(t/=d)*t*t*t*t+b;
    }
    function strongOut(t, b,c, d) {
        return c*((t=t/d-1)*t*t*t*t+1)+b;
    }
    function strongInOut(t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t*t+b;
        //
        return c/2*((t-=2)*t*t*t*t+2)+b;
    }

    function backIn(t, b, c, d)  {
        var s = 1.70158;
        return c*(t/=d)*t*((s+1)*t - s) + b;
    }
    function backOut(t, b, c, d) {
        var s = 1.70158;
        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    }
    function backInOut(t, b, c, d) {
        var s = 1.70158;
        if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        //
        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
    }

    function elasticIn(t, b, c, d, a, p) {
        a = a||0;
        p = p||0;
        if (t === 0) return b;
        if ((t /= d) === 1) return b + c;
        if (!p) p = d * 0.3;
        var s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        } else {
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    function elasticOut(t, b, c, d, a, p) {
        a = a||0;
        p = p||0;
        if (t === 0) return b;
        if ((t /= d) === 1) return b + c;
        if (!p) p = d * 0.3;
        var s;
        if (!a || a < Math.abs(c)) {
            a = c;
            s = p / 4;
        } else{
            s = p / (2 * Math.PI) * Math.asin(c / a);
        }
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    }
    function elasticInOut(t, b, c, d, a, p) {
        a = a||0;
        p = p||0;
        if (t === 0) return b;
        if ((t /= d / 2) === 2) return b + c;
        if (!p) p = d * (0.3 * 1.5);
        var s;
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



    anim.core.Animation.prototype.easeRegular = function() {
        this._ease = regular;
        return this;
    };

    anim.core.Animation.prototype.easeStrongIn = function() {
        this._ease = strongIn;
        return this;
    };
    anim.core.Animation.prototype.easeStrongOut = function() {
        this._ease = strongOut;
        return this;
    };
    anim.core.Animation.prototype.easeStrongInOut = function() {
        this._ease = strongInOut;
        return this;
    };

    anim.core.Animation.prototype.easeBackIn = function() {
        this._ease = backIn;
        return this;
    };
    anim.core.Animation.prototype.easeBackOut = function() {
        this._ease = backOut;
        return this;
    };
    anim.core.Animation.prototype.easeBackInOut = function() {
        this._ease = backInOut;
        return this;
    };

    anim.core.Animation.prototype.easeElasticIn = function() {
        this._ease = elasticIn;
        return this;
    };
    anim.core.Animation.prototype.easeElasticOut = function() {
        this._ease = elasticOut;
        return this;
    };
    anim.core.Animation.prototype.easeElasticInOut = function() {
        this._ease = elasticInOut;
        return this;
    };

    anim.core.Animation.prototype.easeCircIn = function() {
        this._ease = circIn;
        return this;
    };
    anim.core.Animation.prototype.easeCircOut = function() {
        this._ease = circOut;
        return this;
    };
    anim.core.Animation.prototype.easeCircInOut = function() {
        this._ease = circInOut;
        return this;
    };

    anim.core.Animation.prototype.easeCubicIn = function() {
        this._ease = cubicIn;
        return this;
    };
    anim.core.Animation.prototype.easeCubicOut = function() {
        this._ease = cubicOut;
        return this;
    };
    anim.core.Animation.prototype.easeCubicInOut = function() {
        this._ease = cubicInOut;
        return this;
    };

    anim.core.Animation.prototype.easeExpIn = function() {
        this._ease = expIn;
        return this;
    };
    anim.core.Animation.prototype.easeExpOut = function() {
        this._ease = expOut;
        return this;
    };
    anim.core.Animation.prototype.easeExpInOut = function() {
        this._ease = expInOut;
        return this;
    };

    anim.core.Animation.prototype.easeQuadIn = function() {
        this._ease = quadIn;
        return this;
    };
    anim.core.Animation.prototype.easeQuadOut = function() {
        this._ease = quadOut;
        return this;
    };
    anim.core.Animation.prototype.easeQuadInOut = function() {
        this._ease = quadInOut;
        return this;
    };

    anim.core.Animation.prototype.easeQuartIn = function() {
        this._ease = quartIn;
        return this;
    };
    anim.core.Animation.prototype.easeQuartOut = function() {
        this._ease = quartOut;
        return this;
    };
    anim.core.Animation.prototype.easeQuartInOut = function() {
        this._ease = quartInOut;
        return this;
    };

    anim.core.Animation.prototype.easeQuintIn = function() {
        this._ease = quintIn;
        return this;
    };
    anim.core.Animation.prototype.easeQuintOut = function() {
        this._ease = quintOut;
        return this;
    };
    anim.core.Animation.prototype.easeQuintInOut = function() {
        this._ease = quintInOut;
        return this;
    };

    anim.core.Animation.prototype.easeSinIn = function() {
        this._ease = sinIn;
        return this;
    };
    anim.core.Animation.prototype.easeSinOut = function() {
        this._ease = sinOut;
        return this;
    };
    anim.core.Animation.prototype.easeSinInOut = function() {
        this._ease = sinInOut;
        return this;
    };

    anim.core.Animation.prototype.easeBounceIn = function() {
        this._ease = bounceIn;
        return this;
    };
    anim.core.Animation.prototype.easeBounceOut = function() {
        this._ease = bounceOut;
        return this;
    };
    anim.core.Animation.prototype.easeBounceInOut = function() {
        this._ease = bounceInOut;
        return this;
    };
})(animation);
