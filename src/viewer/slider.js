/*jslint browser: true*/
/*global log*/

var pnw = pnw || {}; // global namespace

pnw.Slider = function (canvas_id) {
    "use strict";
    this.canvas = window.document.getElementById(canvas_id);
    this.context = this.canvas.getContext('2d');
    this.sliderTimeout = null;

    this.currentPercentage = 0;
    this.currentRemainingTime = 0;
    this.currentMin = 0;
    this.currentMax = 0;
    this.currentSliderPosition = 0;
    this.sliderVisible = false;
};

pnw.Slider.prototype.draw = function () {
    "use strict";

    this.clear();
    this.drawSlider();
    this.drawLabel();
};

pnw.Slider.prototype.setSliderPosition = function (min, max, position) {
    "use strict";

    var that = this;

    this.currentMin = min;
    this.currentMax = max;
    this.currentSliderPosition = position;
    this.sliderVisible = true;

    this.draw();

    // hiding slider after 1 sec
    window.clearTimeout(this.sliderTimeout);
    this.sliderTimeout = window.setTimeout(() => {
        that.clear();
        that.sliderVisible = false;
    }, 1000);

};

pnw.Slider.prototype.setLabel = function (percentage, remaining) {
    "use strict";

    this.currentPercentage = percentage;
    this.currentRemainingTime = remaining;

    this.draw();
};

pnw.Slider.prototype.drawSlider = function () {
    "use strict";

    if (this.sliderVisible !== true) {
        return;
    }


    var p = pnw.MathHelper.clamp(this.currentSliderPosition, this.currentMin, this.currentMax),
        o = parseInt(this.canvas.height / 5, 10),
        h = parseInt(this.canvas.height - (2 * o), 10),
        w = parseInt(this.canvas.width, 10),
        c = parseInt(this.currentMax, 10),
        l = parseInt(w / 20, 10),
        t = parseInt(h * pnw.MathHelper.clamp((p / c), 0, this.currentMax), 10) + o;

    if (isNaN(o) || isNaN(l) || isNaN(t)) {
        log.warn('slider invalid', o, l, t);
        return;
    }

    this.drawBar(l, o, 20, h + 50);
    this.drawKnob(l, t, 20, 50);
};

pnw.Slider.prototype.drawBar = function (left, top, width, height) {
    "use strict";
    this.context.strokeStyle = 'LightGray';
    this.context.fillStyle = 'gray';
    this.roundRect(this.context, left, top, width, height, 10, true, true);
};

pnw.Slider.prototype.drawKnob = function (left, top, width, height) {
    "use strict";
    this.context.strokeStyle = 'gray';
    this.context.fillStyle = 'LightGray';
    this.roundRect(this.context, left, top, width, height, 10, true, true);
};

pnw.Slider.prototype.roundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
    "use strict";
    if (typeof stroke === "undefined") {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }
};

pnw.Slider.prototype.clear = function () {
    "use strict";
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

pnw.Slider.prototype.drawLabel = function () {
    "use strict";

    function formatTime(sec) {
        var totalSec = parseInt(sec, 10),
            hours = parseInt(totalSec / 3600, 10) % 24,
            minutes = parseInt(totalSec / 60, 10) % 60,
            seconds = totalSec % 60,
            h = (hours < 10 ? "0" + hours : hours) + ':',
            m = (minutes < 10 ? "0" + minutes : minutes) + ':',
            s = (seconds < 10 ? "0" + seconds : seconds) + 's',
            result = '';

        if (isNaN(totalSec)) {
            return result;
        }

        if (minutes > 0) {
            result = '~' + h + m + s;
        } else {
            result = '~' + seconds + 's';
        }
        return result;
    }


    var lineHeight = parseFloat(this.canvas.height / 25),
        fontSize = parseInt(lineHeight / 1.5, 10),
        text = "DL: " + this.currentPercentage + '% ' + formatTime(this.currentRemainingTime),
        isVisible = (parseInt(this.currentPercentage, 10) < 100) ? true : false;

    this.context.font = fontSize + "pt Helvetica bold, sans-serif";
    this.context.fillStyle = "White";
    this.context.strokeStyle = "black";


    if (isVisible) {
        this.drawText(text);
    }
};

pnw.Slider.prototype.drawText = function (text) {
    "use strict";

    var lineHeight = parseInt(this.canvas.height / 25, 10),
        right = this.canvas.width - 20;

    this.context.textAlign = 'right';
    this.context.fillText(text, right, 4 * lineHeight);
};
