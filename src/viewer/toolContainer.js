//import  log, DistanceTool

class ToolContainer {
    constructor() {
        this.tools = [];
        this.hitSuccess = false;
        this.trashImage = new Image();
        this.trashImage.src = "stylesheets/images/trash.png";
        this.activeToolIndex = -1;
        this.trashCenter = new pnw.Point2D(36, 36);
        this.trashRadius = 16;
    },

    hitTest(event, offset, zoom) {
        

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

    isHandlingEvent() {
        return this.hitSuccess;
    },
    onDragStart(event, offset, zoom) {
        // nothing
    },
    onDrag(event, offset, zoom) {
        
        var i = 0,
            pt = new pnw.Point2D();

        pt.x = event.gesture.center.pageX;
        pt.y = event.gesture.center.pageY;

        for (i = 0; i < this.tools.length; i = i + 1) {
            this.tools[i].updatePosition(pt, offset, zoom);
        }

    },
    onDragEnd(event, offset, zoom) {
        
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
    },
    drawTools(dicomObject, context, offset, zoom) {
        
        var i = 0;

        // the trash icon needs to be drawn first
        if (this.isHandlingEvent()) {
            this.drawTrashIcon(context);
        }

        // draw all tools
        for (i = 0; i < this.tools.length; i = i + 1) {
            this.tools[i].draw(dicomObject, context, offset, zoom);
        }
    },
    isOverTrashIcon(worldPt) {
        return pnw.Circle.circleHitTest(this.trashCenter, this.trashRadius, worldPt);
    },
    drawTrashIcon(context) {
        context.drawImage(this.trashImage, this.trashCenter.x - this.trashRadius, this.trashCenter.y - this.trashRadius, 2 * this.trashRadius, 2 * this.trashRadius);
    },
    centerPoint(imageWidth, imageHeight) {
        return new pnw.Point2D(imageWidth / 2, imageHeight / 2);
    },
    createDistanceTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.DistanceTool(imageCenter, offset, zoom);
        this.tools.push(tool);
    },
    createAngleTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.AngleTool(imageCenter, offset, zoom);
        this.tools.push(tool);
    },
    createCobbAngleTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.CobbAngleTool(imageCenter, offset, zoom);
        this.tools.push(tool);
    },
    createPointProbeTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.PointProbeTool(imageCenter, offset, zoom);
        this.tools.push(tool);
    },
    createRectRoiTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.RectangularRoiTool(imageCenter, offset, zoom);
        this.tools.push(tool);
    },
    createCircRoiTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.CircularRoiTool(imageCenter, offset, zoom);
        this.tools.push(tool);
    },
    createTextAnnoTool(imageWidth, imageHeight, offset, zoom) {
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
    },
    createShutterTool(imageWidth, imageHeight, offset, zoom) {
        if (this.currentSOP === "") {
            log.warn("cannot create tool, sopInstance not given");
            return;
        }

        var imageCenter = this.centerPoint(imageWidth, imageHeight),
            tool = new pnw.ShutterTool(imageCenter, offset, zoom);

        this.tools.push(tool);
    },
    getShutter() {
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
    }
}
