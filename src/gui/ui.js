/*jslint browser: true*/
/*global Hashtable, pnw, ViewMaster, log, $ */

// global
var gDataStore = {
    studyUID: null,
    seriesUID: null,
    studyIdent: new Hashtable()
};

var gDicomViewer = null,
    gTransitionEffect = 'none';

var scroll_stop_time = (new Date()).getTime(); // initialize the variable
var is_scrolling = false;
var is_init = false;
//log.setLevel('debug');
log.setLevel('warn');

function formatStudy(pData) {
    "use strict";
    return "<h3>" + pData.DCM_PatientName + " (" + pData.DCM_PatientSex + ") - " + pData.DCM_PatientID + " - " + pData.DCM_PatientsBirthDate + "</h3>" + "<p>" + "<b>Study date: </b>" + pData.DCM_StudyDate + "  <b>Description: </b>" + pData.DCM_StudyDescription + "  <b>Modalities: </b>" + pData.DCM_ModalitiesInStudy + "</p>" + "<p>" + "<b>Study time: </b>" + pData.DCM_StudyTime + "  <b>Acc.No: </b>" + pData.DCM_AccessionNumber + "  <b>Ref.Physician: </b>" + pData.DCM_ReferringPhysicianName + "</p>" + "<span class='ui-li-count'>" + pData.DCM_NumberOfStudyRelatedSeries + "</span>";
}

function formatSeries(pData, i) {
    "use strict";
    return "<a href='#'>" + "<img src=/queryThumbnail?stdUID=" + gDataStore.studyUID + "&serUID=" + i + " class='ui-li-thumb' >" + "<h2>" + "Description: " + pData.DCM_SeriesDescription + "</h2>" + "<p><b>Series Date: </b>" + pData.DCM_SeriesDate + "  <b>Modality: </b>" + pData.DCM_Modality + "  <b>Protocol: </b>" + pData.DCM_ProtocolName + "</p>" + "<span class='ui-li-count'>" + pData.DCM_NumberOfSeriesRelatedInstances + "</span>";
}

/*  ********************************* ALL PAGES ***************************************************** */

$(document).on("pagebeforechange", function (event, data) {
    "use strict";
    var elapsed_time = ((new Date()).getTime()) - scroll_stop_time;
    if (is_init && ((elapsed_time < 200) || is_scrolling)) {
        event.preventDefault();
        is_scrolling = false;
        scroll_stop_time = (new Date()).getTime();
        return false;
    }
});

/*  ********************************* STUDIES ***************************************************** */

$(document).on("pageinit", "#studies", function () {
    "use strict";

    $(".iscroll-wrapper", this).bind({
        iscroll_onscrollmove: function () {
            is_scrolling = true;
        },
        iscroll_onscrollend: function () {
            is_scrolling = false;
            scroll_stop_time = (new Date()).getTime();
        }
    });

    var queryStudyLevel = function (e, data) {
        var $ul = $("#pn-study-listview-dynamic"),
            $input = $(data.input),
            value = $input.val(),
            html = "";

        is_init = true;
        gDataStore.studyIdent.clear();
        if (value && value.length > 0) {
            $.ajax({
                    url: "/queryStudyInfo",
                    dataType: "json",
                    data: {
                        patName: value + "*"
                    }
                })
                .then(function (response) {
                    $.each(response, function (i, val) {
                        var pData = val,
                            content = formatStudy(pData);

                        html += "<li id='" + i + "' data-theme='b'><a href='#'>" + content + "</li>";
                        gDataStore.studyIdent.put(i, pData);
                    });

                    if (e.handled !== true) {
                        $('#pn-study-listview-dynamic').on("click", 'li', function () {
                            gDataStore.studyUID = this.id;
                            $.mobile.pageContainer.pagecontainer('change', "#series", {
                                transition: gTransitionEffect,
                                reload: true
                            });
                        });
                    }
                    $ul.html(html);
                    $ul.listview("refresh");
                    $ul.trigger("updatelayout");
                });
        }
    };

    $("#pn-study-listview").on("filterablebeforefilter", queryStudyLevel);

    // auto trigger search
    var filter_el = $("#pn-study-listview").prev().children(".ui-input-search").children("input");
    filter_el.val('*');
    filter_el.trigger("change");

});

/*  ********************************* SERIES ***************************************************** */

$(document).on("pageinit", "#series", function () {
    "use strict";
    if (gDataStore.studyUID === null) {
        log.warn("redirecting to study");
        $.mobile.pageContainer.pagecontainer('change', "#studies", {
            transition: 'none',
            reload: true
        });
    }

});


$(document).on("pagebeforeshow", "#series", function () {
    "use strict";

    if ((gDataStore.studyUID === null)) {
        return;
    }

    var $ul = $("#pn-series-listview"),
        value = gDataStore.studyUID,
        html = "",
        pData = gDataStore.studyIdent.get(value);

    $ul.html("");

    $('#label').text(pData.DCM_PatientName + " - " + pData.DCM_PatientID + " - " + pData.DCM_StudyDescription);

    $ul.html("<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>");
    $ul.listview("refresh");
    $.ajax({
            url: "/querySeriesInfo",
            dataType: "json",
            data: {
                stdUID: value
            }
        })
        .then(function (response) {
            $.each(response, function (i, val) {
                var pData = val,
                    content = formatSeries(pData, i);

                html += "<li id='" + i + "' data-theme='b'>" + content + "</li>";
            });

            $('#pn-series-listview').off("click", 'li');
            $('#pn-series-listview').on("click", 'li', function () {
                gDataStore.seriesUID = this.id;
                $.mobile.pageContainer.pagecontainer('change', "#images", {
                    transition: gTransitionEffect,
                    reload: true
                });
            });
            $ul.html(html);
            $ul.listview("refresh");
            $ul.trigger("updatelayout");
        });

});

/*  ********************************* IMAGES ***************************************************** */

$(document).on("pageinit", "#images", function () {
    "use strict";

    if ((gDataStore.studyUID === null) || (gDataStore.seriesUID === null)) {
        log.warn("redirecting to study");
        $.mobile.pageContainer.pagecontainer('change', "#studies", {
            transition: gTransitionEffect,
            reload: true
        });
    }

    if (!gDicomViewer) {
        gDicomViewer = new pnw.ViewMaster("viewerCanvas", "overlayCanvas");
    }

    $('#tool-listview').on("click", 'li', function () {
        switch (this.id) {
        case 'li-stack':
            gDicomViewer.setInteractionMode(0);
            break;
        case 'li-pan':
            gDicomViewer.setInteractionMode(1);
            break;
        case 'li-zoom':
            gDicomViewer.setInteractionMode(2);
            break;
        case 'li-window':
            gDicomViewer.setInteractionMode(3);
            break;
        case 'li-select':
            gDicomViewer.setInteractionMode(4);
            break;
        default:
            log.warn("default not implemented");
            break;
        }
        $('#tool-panel-left').panel("close");

    });

    $('#tool-listview-2').on("click", 'li', function () {
        switch (this.id) {
        case 'li-distance':
            gDicomViewer.createTool(0);
            break;
        case 'li-angle':
            gDicomViewer.createTool(1);
            break;
        case 'li-cobb-angle':
            gDicomViewer.createTool(2);
            break;
        case 'li-point':
            gDicomViewer.createTool(3);
            break;
        case 'li-roi-1':
            gDicomViewer.createTool(4);
            break;
        case 'li-roi-2':
            gDicomViewer.createTool(5);
            break;
        case 'li-anno':
            gDicomViewer.createTool(6);
            break;
        case 'li-shutter':
            gDicomViewer.createTool(7);
            break;
        default:
            log.warn("default not implemented");
            break;
        }
        $('#tool-panel-right').panel("close");

    });

    $(window).on("resize", function () {
        gDicomViewer.onResize($(window).width(), $(window).height());
        $('#overlayCanvas').width($(window).width()).height($(window).height());
    });
});

$(document).on("pagebeforeshow", "#images", function () {
    "use strict";

    if ((gDataStore.studyUID === null) || (gDataStore.seriesUID === null)) {
        return;
    }

    var baseUrl = "/?stdUID=" + gDataStore.studyUID + "&serUID=" + gDataStore.seriesUID + "&imgUID=";
    gDicomViewer.init(baseUrl, gDataStore.studyUID, gDataStore.seriesUID);
    gDicomViewer.onResize($(window).width(), $(window).height());
    $('#overlayCanvas').width($(window).width()).height($(window).height());
});
