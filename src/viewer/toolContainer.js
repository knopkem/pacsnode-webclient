/*global log, DistanceTool*/

var pnw = pnw || {}; // global namespace
/*global log  */

pnw.ToolContainer = function () {
    "use strict";
    this.tools = [];
    this.hitSuccess = false;
    this.trashImage = new Image();
    this.trashImage.src = "stylesheets/images/trash.png";
    this.activeToolIndex = -1;
    this.trashCenter = new pnw.Point2D(36, 36);
    this.trashRadius = 16;
};

pnw.ToolContainer.prototype.hitTest = function (event, offset, zoom) {
    "use strict";

    this.activeToolIndex = -1;
    this.hitSuccess = false;

    var i = 0,
        hitPt = new pnw.Point2D();

    hitPt.x = event.gesture.center.pageX;
    hitPt.y = event.gesture.center.pageY;

    for (i = 0; i < this.tools.length; i = i + 1) {
        if (this.tools[i].isHit(hitPt, offset, zoom)) {
            this.hitSuccess = true;
            this.activeToolIndex = i;
            break;
        }
    }
};

pnw.ToolContainer.prototype.isHandlingEvent = function () {
    "use strict";
    return this.hitSuccess;
};

pnw.ToolContainer.prototype.onDragStart = function (event, offset, zoom) {
    "use strict";
};

pnw.ToolContainer.prototype.onDrag = function (event, offset, zoom) {
    "use strict";
    var i = 0,
        pt = new pnw.Point2D();

    pt.x = event.gesture.center.pageX;
    pt.y = event.gesture.center.pageY;

    for (i = 0; i < this.tools.length; i = i + 1) {
        this.tools[i].updatePosition(pt, offset, zoom);
    }

};

pnw.ToolContainer.prototype.onDragEnd = function (event, offset, zoom) {
    "use strict";
    var i = 0,
        pt = new pnw.Point2D();

    pt.x = event.gesture.center.pageX;
    pt.y = event.gesture.center.pageY;

    for (i = 0; i < this.tools.length; i = i + 1) {
        this.tools[i].reset();
    }
    this.hitSuccess = false;

    // remove tool if pt is over trash icon
    if (this.isOverTrashIcon(pt) && this.activeToolIndex > -1) {
        this.tools.splice(this.activeToolIndex, 1);
    }
};

pnw.ToolContainer.prototype.drawTools = function (dicomObject, context, offset, zoom) {
    "use strict";
    var i = 0;

    // the trash icon needs to be drawn first
    if (this.isHandlingEvent()) {
        this.drawTrashIcon(context);
    }

    // draw all tools
    for (i = 0; i < this.tools.length; i = i + 1) {
        this.tools[i].draw(dicomObject, context, offset, zoom);
    }
};

pnw.ToolContainer.prototype.isOverTrashIcon = function (worldPt) {
    'use strict';
    return pnw.Circle.circleHitTest(this.trashCenter, this.trashRadius, worldPt);
};

pnw.ToolContainer.prototype.drawTrashIcon = function (context) {
    'use strict';
    context.drawImage(this.trashImage, this.trashCenter.x - this.trashRadius, this.trashCenter.y - this.trashRadius, 2 * this.trashRadius, 2 * this.trashRadius);
};

pnw.ToolContainer.prototype.centerPoint = function (imageWidth, imageHeight) {
    "use strict";
    return new pnw.Point2D(imageWidth / 2, imageHeight / 2);
};

pnw.ToolContainer.prototype.createDistanceTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.DistanceTool(imageCenter, offset, zoom);
    this.tools.push(tool);
};

pnw.ToolContainer.prototype.createAngleTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.AngleTool(imageCenter, offset, zoom);
    this.tools.push(tool);
};

pnw.ToolContainer.prototype.createCobbAngleTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.CobbAngleTool(imageCenter, offset, zoom);
    this.tools.push(tool);
};

pnw.ToolContainer.prototype.createPointProbeTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.PointProbeTool(imageCenter, offset, zoom);
    this.tools.push(tool);
};

pnw.ToolContainer.prototype.createRectRoiTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.RectangularRoiTool(imageCenter, offset, zoom);
    this.tools.push(tool);
};

pnw.ToolContainer.prototype.createCircRoiTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.CircularRoiTool(imageCenter, offset, zoom);
    this.tools.push(tool);
};

pnw.ToolContainer.prototype.createTextAnnoTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var description = window.prompt("Enter description", "Annotation"),
        imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.TextAnnotateTool(description, imageCenter, offset, zoom);
    if (description) {
        this.tools.push(tool);
    }
};

pnw.ToolContainer.prototype.createShutterTool = function (imageWidth, imageHeight, offset, zoom) {
    "use strict";

    if (this.currentSOP === "") {
        log.warn("cannot create tool, sopInstance not given");
        return;
    }

    var imageCenter = this.centerPoint(imageWidth, imageHeight),
        tool = new pnw.ShutterTool(imageCenter, offset, zoom);

    this.tools.push(tool);
};

pnw.ToolContainer.prototype.getShutter = function () {
    'use strict';
    //return this.shutter;
    var i = 0,
        shutterArray = [];

    // draw all tools
    for (i = 0; i < this.tools.length; i = i + 1) {
        if (this.tools[i] instanceof pnw.ShutterTool) {
            shutterArray.push(this.tools[i]);
        }
    }
    return shutterArray;
};
