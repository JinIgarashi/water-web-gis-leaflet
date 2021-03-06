/*

  gis.js -- Web GIS Library

  Copyright (c) 2014-2016 Jin Igarashi
  Japan Overseas Cooperation Volunteers
  Narok Water and Sewerage Services Company

  this tool use leafletjs, jquery and jquery-ui.

*/
/* ======================================================================
    gis/singleFile.js
   ====================================================================== */

/**
 * 圧縮された一つのファイルから参照されたときに読みこまれるファイル
 */
var gis = {
    /**
     * Constant: VERSION_NUMBER
     */
    VERSION_NUMBER: "Release 0.1",

    /**
     * Constant: singleFile
     * TODO: remove this in 3.0 when we stop supporting build profiles that
     * include gis.js
     */
    singleFile: true,

    /**
     * Method: _getScriptLocation
     * Return the path to this script. This is also implemented in
     * justice.js
     *
     * Returns:
     * {String} Path to this script
     */
    _getScriptLocation: (function() {
        var r = new RegExp("(^|(.*?\\/))(gis[^\\/]*?\\.js)(\\?|$)"),
            s = document.getElementsByTagName('script'),
            src, m, l = "";
        for(var i=0, len=s.length; i<len; i++) {
            src = s[i].getAttribute('src');
            if(src) {
                m = src.match(r);
                if(m) {
                    l = m[1];
                    break;
                }
            }
        }
        return (function() { return l; });
    })()
};
/* ======================================================================
    gis/ui.js
   ====================================================================== */

/**
 * uiコントロールの最上位クラス
 */
gis.ui = function(spec,my){
	var that= {};

	my = my || {};

	/**
	 * UIコントロールを表示するDIVタグID
	 */
	my.divid = spec.divid;

	that.getHeight = function(){
		return $("#" + my.divid).height();
	};

	that.CLASS_NAME =  "gis.ui";
	return that;
};
/* ======================================================================
    gis/ui/control.js
   ====================================================================== */

/**
 * 地図編集コントロールを管理するスーパークラス
 */
gis.ui.control = function(spec,my){
	my = my || {};

	var that = gis.ui(spec,my);

	my.id = spec.id || undefined;
	my.map = spec.map || undefined;

	that.CLASS_NAME =  "gis.ui.control";
	return that;
};
/* ======================================================================
    gis/ui/dialog.js
   ====================================================================== */

gis.ui.dialog = function(spec,my){
	my = my || {};

	var that = gis.ui(spec,my);

	my.divid = spec.divid;

	my.dialogId = spec.divid + '-dialog';

	my.isInit = false;

	my.getHtml = function(){
		return "";
	};

	my.postCreate = function(){

	};

	my.addOptions = function(option){
		return option;
	};

	/**
	 * Dialogを格納するdivを作成しHTMLをセットする
	 * @param html ダイアログのHTML
	 * @param option jquery-ui-dialogのオプション
	 */
	that.create = function(option){
		if (my.isInit === true){
			return;
		}
		$(document.body).append("<div id='" + my.dialogId + "'></div>");
		$("#" + my.dialogId).html(my.getHtml());

		option = my.addOptions(option);
		if (!option){
			option = {};
		}
		if (!option.autoOpen){
			option.autoOpen = false;
		}
		if (!option.modal){
			option.modal = false;
		}
		if (!option.position){
			option.position = [0,0];
		}
		$("#" + my.dialogId).dialog(option);

		my.isInit = true;

		my.postCreate();
	};

	/**
	 * ダイアログを開く
	 */
	that.open = function(){
		$("#" + my.dialogId).dialog('open');
	};

	/**
	 * ダイアログを閉じる
	 */
	that.close = function(){
		$("#" + my.dialogId).dialog('close');
	};

	that.CLASS_NAME =  "gis.ui.dialog";
	return that;
};
/* ======================================================================
    gis/ui/dialog/login.js
   ====================================================================== */

gis.ui.dialog.login = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	my.isSuccess = false;

	my.isInit = false;

	my.successCallback = null;


	my.getHtml = function(){
		var fields = [
		              {id : "password", label : "Password", type : "password", "class" : "validate[required]"}
		              ];

		var html = "<form id='form" + my.id + "' method='post'><table class='dialogstyle'>";
		for (var i = 0 in fields){
			var f = fields[i];
			html += "<tr><th style='width:40%'>" + f.label + "</th>";
			var option = "";
			if (f["class"]){
				option = "class='" + f["class"] + "'";
			}
			var insertHtml = "<input id='" + f.id + "' type='" + f.type + "' style='width:98%' " + option + "/>";
			html += "<td style='width:60%'>" + insertHtml + "</td>";
			html += "</tr>";
		}
		html += "</table></form>"
		return html;
	};

	my.addOptions = function(option){
		option.title = 'Login';
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Login' : my.btnLogin_onClick,
			'Cancel' : function(){
				that.close();
				my.successCallback(my.isSuccess);
			}
		}
		return option;
	};

	my.postCreate = function(){
		$("#form" + my.id).validationEngine('attach',{
			promptPosition:"inline"
		});
	};

	my.loginToServer = function(){
		$.ajax({
			url : './rest/Login?Password=' + $("#password").val(),
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}
    		my.isSuccess = json.value;
    		if (my.isSuccess === false){
    			alert("Password is wrong. Please confirm password.");
    			$("#password").val("");
    			return;
    		}
    		my.successCallback(my.isSuccess);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return false;
    	});
	}

	my.btnLogin_onClick = function(){
		var valid = $("#form" + my.id).validationEngine('validate');
		if (valid !==true){
			return;
		}
		my.loginToServer();
	};

	that.login = function(successCallback){
		if (my.isSuccess === true){
			my.successCallback = successCallback;
			my.successCallback(my.isSuccess);
			return my.isSuccess;
		}

		that.create({});
		that.open();
		my.successCallback = successCallback;
	}

	that.CLASS_NAME =  "gis.ui.dialog.login";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction.js
   ====================================================================== */

gis.ui.control.toolbarAction = function(spec,my){
	my = my || {};

	var that = gis.ui.control(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id;
	my.html = spec.html;
	my.tooltip = spec.tooltip;

	my.loginDialog = spec.loginDialog || null;

	my.ImmediateSubAction = null;

	my.Action = null;

	that.init = function(){
		my.ImmediateSubAction = L.ToolbarAction.extend({
	        initialize: function(map, myAction) {
	            this.map = map;
	            this.myAction = myAction;
	            L.ToolbarAction.prototype.initialize.call(this);
	        },
	        addHooks: function() {
	            this.myAction.disable();
	        }
	    });

		my.Action = my.ImmediateSubAction.extend({
			options: {
	            toolbarIcon: {
	                html: my.html,
	                tooltip: my.tooltip
	            }
	        },
	        addHooks: function () {

	        	if (my.loginDialog !== null){
	        		my.loginDialog.login(function(isSuccess){
	        			if (isSuccess === true){
	        				that.callback();
	        			}
	        		});
	        	}else{
	        		that.callback();
	        	}
	        	if (this.myAction !== undefined){
	        		this.myAction.disable();
	        	}
	        }
	    });
	};

	that.callback = function(){
		return;
	};

	that.getAction = function(){
		that.init();
		return my.Action;
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction";
	return that;
};
/* ======================================================================
    gis/ui/control/boxzoom.js
   ====================================================================== */

gis.ui.control.boxzoom = function(spec,my){
	my = my || {};

	var that = gis.ui.control(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'boxzoom';

	my.control = null;

	that.init = function(){
		my.control = L.Control.boxzoom({ position:'topleft' }).addTo(my.map);
	};

	that.CLASS_NAME =  "gis.ui.control.boxzoom";
	return that;
};
/* ======================================================================
    gis/ui/dialog/uncaptureByGps.js
   ====================================================================== */

gis.ui.dialog.uncaptureByGps = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	my.zones = [{value:"A", display:"A(Narok)"},{value:"B", display:"B(Narok)"},{value:"C", display:"C(Ololulunga)"},{value:"D", display:"D(Kilgoris)"}];


	my.getHtml = function(){
		var html = "";
		for (var i = i in my.zones){
			var zone = my.zones[i];
			html += "<input type='checkbox' name='zone' value='" + zone.value + "' checked>" + zone.display + "<br>"
		}
		return html;
	};

	my.addOptions = function(option){
		option.title = 'List of Uncaptured Meters';
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Download' : function(){
				my.download();
			},
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.download = function(){
		var zones = [];
		$('[name="zone"]:checked').each(function(){
			zones.push($(this).val());
		});
		if (zones.length === 0){
			alert("Check a zone at least.");
			return;
		}
		$.ajax({
			url : './rest/Meters/Uncaptured?zonecd=' + JSON.stringify(zones),
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};

	that.CLASS_NAME =  "gis.ui.dialog.uncaptureByGps";
	return that;
};
/* ======================================================================
    gis/ui/dialog/differentVillage.js
   ====================================================================== */

gis.ui.dialog.differentVillage = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	my.zones = [{value:"A", display:"A(Narok)"},{value:"B", display:"B(Narok)"},{value:"C", display:"C(Ololulunga)"},{value:"D", display:"D(Kilgoris)"}];

	my.getHtml = function(){
		var html = "";
		for (var i = i in my.zones){
			var zone = my.zones[i];
			html += "<input type='checkbox' name='zone' value='" + zone.value + "' checked>" + zone.display + "<br>"
		}
		return html;
	};

	my.addOptions = function(option){
		option.title = 'List of Meters for Changing Villages';
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Download' : function(){
				my.download();
			},
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.download = function(){
		var zones = [];
		$('[name="zone"]:checked').each(function(){
			zones.push($(this).val());
		});
		if (zones.length === 0){
			alert("Check a zone at least.");
			return;
		}
		$.ajax({
			url : './rest/Meters/VillageChange?zonecd=' + JSON.stringify(zones),
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};

	that.CLASS_NAME =  "gis.ui.dialog.differentVillage";
	return that;
};
/* ======================================================================
    gis/ui/dialog/adjustmentReport.js
   ====================================================================== */

gis.ui.dialog.adjustmentReport = function(spec,my){
	my = my || {};
	my.id = 'adjustmentReport';
	
	var that = gis.ui.dialog(spec,my);

	my.idymfrom = my.id + "-ymfrom";
	my.idymto = my.id + "-ymto";
	
	my.getHtml = function(){
		var now = new Date();
		var nowYear = now.getFullYear();
		var nowMonth = now.getMonth() + 1;
		var nowdate = "01/" + ('0' + nowMonth).slice(-2) + "/" + nowYear;
		
		var previous = new Date();
		previous.setDate(previous.getDate()-31);
		var preYear = previous.getFullYear();
		var preMonth = previous.getMonth() + 1;
		var predate = "01/" + ('0' + preMonth).slice(-2) + "/" + preYear;
		
		var html = "From:" + "<input type='text' id='" + my.idymfrom + "' value='" + predate + "' style='width:150px' readonly>" +
				" To:" + "<input type='text' id='" + my.idymto  + "' value='" + nowdate + "' style='width:150px' readonly>";

		return html;
	};

	my.addOptions = function(option){
		option.title = 'Download Adjustment Report';
		option.width = 450,
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Download' : function(){
				my.download();
			},
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.postCreate = function(){
		$("#" + my.idymfrom).datepicker({changeMonth:true,changeYear:true,dateFormat:'dd/mm/yy'});
		$("#" + my.idymto).datepicker({changeMonth:true,changeYear:true,dateFormat:'dd/mm/yy'});
	};

	my.download = function(){
		var fromdatestr = $("#" + my.idymfrom).val();
		var todatestr = $("#" + my.idymto).val();
		
		var fromdate = fromdatestr.substr(6,4) + fromdatestr.substr(3,2);
		var todate = todatestr.substr(6,4) + todatestr.substr(3,2);

		var intfromdate = Number(fromdate);
		var inttodate = Number(todate);
		
		if (intfromdate === inttodate){
			alert("From and To cannot be same.");
			return;
		}else if (intfromdate > inttodate){
			alert("Plese select From before To.");
			return;
		}
		
		$.ajax({
			url : './rest/BillingSync/AdjustmentReport?fromym=' + fromdate + '&toym=' + todate,
			type : 'GET',
			dataType : 'json',
			contentType : false,
			processData : false,
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};


	that.CLASS_NAME =  "gis.ui.dialog.adjustmentReport";
	return that;
};
/* ======================================================================
    gis/ui/control/sidebar.js
   ====================================================================== */

gis.ui.control.sidebar = function(spec,my){
	my = my || {};

	var that = gis.ui.control(spec,my);

	my.divid = spec.divid || 'sidebar';
	my.url = spec.url || './js/lib/gis/settings/sidebar.html';
	
	my.control = null;

	that.init = function(){
		$.ajax({
			url : my.url,
			type : 'GET',
			dataType : 'html',
			cache : true,
			async : false
    	}).done(function(html){
    		$("#map").before(html);
    		$("#map").addClass("sidebar-map");
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return false;
    	});
		
		my.control = L.control.sidebar(my.divid).addTo(my.map);
	};

	that.CLASS_NAME =  "gis.ui.control.sidebar";
	return that;
};
/* ======================================================================
    gis/ui/dialog/zoomToVillage.js
   ====================================================================== */

gis.ui.dialog.zoomToVillage = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	my.map = spec.map;
	my.villages = null;
	my.isInit = false;
	my.comboboxId = 'cmbvillage_' + my.id;

	my.getHtml = function(){
		my.getVillages();
		var html = "<select id='" + my.comboboxId + "' style='width:100%'>";
		for (var i = 0 in my.villages){
			var v = my.villages[i];
			html += "<option value='" + v.villageid + "'>" + v.villageid + ":" + v.name + "</option>";
		}
		html += "</select>";
		return html;
	};

	my.addOptions = function(option){
		option.title = 'Zoom To Village';
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'View' : my.btnZoomToVillage_onClick,
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.getVillages = function(){
		$.ajax({
			url : './rest/Villages/',
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}
    		var villages = json.value
    		my.villages = {};
    		for (var i = 0 in villages){
    			var v = villages[i];
    			if (v.wkt === null){
    				continue;
    			}
    			my.villages[v.villageid] = v;
    		}
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return false;
    	});
	}

	my.btnZoomToVillage_onClick = function(){
		var id = $("#" + my.comboboxId).val();
		var village = my.villages[id];
		var layer = omnivore.wkt.parse(village.wkt);
		my.map.fitBounds(layer.getBounds());
    	my.map.zoomIn();
		that.close();
	};

	that.CLASS_NAME =  "gis.ui.dialog.zoomToVillage";
	return that;
};
/* ======================================================================
    gis/ui/dialog/consumptionReport.js
   ====================================================================== */

gis.ui.dialog.consumptionReport = function(spec,my){
	my = my || {};
	my.id = 'consumptionReport';
	
	var that = gis.ui.dialog(spec,my);

	my.getHtml = function(){
		var now = new Date();
		var nowYear = now.getFullYear();

		var inserthtml = "<select id='" + my.id + "-month' style='width:40%'>";
		for (var i = 1; i <= 12; i++){
			inserthtml += "<option value='" + i + "'>" + i + "</option>";
		}
		inserthtml += "</select>";

		inserthtml += "<select id='" + my.id + "-year' style='width:60%'>";
		for (var i = nowYear; i > nowYear - 5; i--){
			inserthtml += "<option value='" + i + "'>" + i + "</option>";
		}
		inserthtml += "</select>";

		var html = "<table class='dialogstyle' style='width:100%'>" +
		"<tr><td>Month/Year</td><td>" + inserthtml + "</td></tr>" +
		"</table>";

		return html;
	};

	my.addOptions = function(option){
		option.title = 'Download Consumption Report';
		option.width = 400,
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Download' : function(){
				my.download();
			},
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.postCreate = function(){
		var now = new Date();
		var nowYear = now.getFullYear();
		var nowMonth = now.getMonth() + 1;
		$("#" + my.id + "-year").val(nowYear);
		$("#" + my.id + "-month").val(nowMonth);
	};

	my.download = function(){
		var year = $("#" + my.id + "-year").val();
		var month = $("#" + my.id + "-month").val();

		$.ajax({
			url : './rest/BillingSync/ConsumptionReport?yearmonth=' + year + ("0" + month).slice(-2),
			type : 'GET',
			dataType : 'json',
			contentType : false,
			processData : false,
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};


	that.CLASS_NAME =  "gis.ui.dialog.consumptionReport";
	return that;
};
/* ======================================================================
    gis/ui/control/measure.js
   ====================================================================== */

gis.ui.control.measure = function(spec,my){
	my = my || {};

	var that = gis.ui.control(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'measure';

	my.control = null;
	
	that.init = function(){
		my.control = new L.Control.Measure({
			position: 'topright',
			primaryLengthUnit: 'meters', secondaryLengthUnit: 'feet',
			primaryAreaUnit: 'sqmeters', secondaryAreaUnit: 'acres',
			activeColor: '#ABE67E',
			completedColor: '#C8F2BE',
			popupOptions: { className: 'leaflet-measure-resultpopup', autoPanPadding: [10, 10]},
			localization: 'en',
			decPoint: '.', thousandsSep: ','
		}).addTo(my.map);
	};

	that.CLASS_NAME =  "gis.ui.control.measure";
	return that;
};
/* ======================================================================
    gis/ui/control/mousePosition.js
   ====================================================================== */

/**
 * マウスの表示位置座標を取得するコントロール
 */
gis.ui.control.mousePosition = function(spec,my){
	my = my || {};

	var that = gis.ui.control(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'mousePosition';

	that.init = function(){
		L.control.coordinates({
		    position:"bottomright", //optional default "bootomright"
		    decimals:6, //optional default 4
		    decimalSeperator:".", //optional default "."
		    labelTemplateLat:"Latitude: {y}", //optional default "Lat: {y}"
		    labelTemplateLng:"Longitude: {x}", //optional default "Lng: {x}"
		    enableUserInput:false, //optional default true
		    useDMS:false, //optional default false
		    useLatLngOrder: false, //ordering of labels, default false-> lng-lat
		    markerType: L.marker, //optional default L.marker
		    markerProps: {}, //optional default {},
		    //labelFormatterLng : function(lng){return lng+" lng"}, //optional default none,
		    //labelFormatterLat : function(lat){return lat+" lat"}, //optional default none,
		    //customLabelFcn: function(latLonObj, opts) { *"Geohash: " + encodeGeoHash(latLonObj.lat, latLonObj.lng)} //optional default none
		}).addTo(my.map);
	};

	that.CLASS_NAME =  "gis.ui.control.mousePosition";
	return that;
};
/* ======================================================================
    gis/ui/layer.js
   ====================================================================== */

/**
 * uiコントロールの最上位クラス
 */
gis.ui.layer = function(spec,my){
	var that= {};

	my = my || {};

	my.map = spec.map;
	my.defineurl = spec.defineurl;

	my.getLayer = function(e){
		var layer = null;
		if (e.type === "WMS"){
			layer = L.tileLayer.wms(e.url,{
				layers:e.layers,
				format: 'image/png',
				transparent:true,
				crs: L.CRS.EPSG4326,
				maxZoom:e.maxZoom,
				attribution: e.attribution,
			}).addTo(my.map);
		}else if (e.type === "TMS"){
			layer = L.tileLayer(e.url, {
			    tms: true,
			    crs: L.CRS.EPSG3857,
				maxZoom:e.maxZoom,
				attribution: e.attribution,
			}).addTo(my.map);
		}else if (e.type === "OSM"){
			layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			    attribution: e.attribution,
				maxZoom:e.maxZoom
			}).addTo(my.map);
		}
		return layer;
	};

	that.init = function(){
		$.ajax({
			url : my.defineurl,
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
		}).done(function(layers_define) {
			var baseMaps = {};
			var overlays = {};

			for (var i = 0 in layers_define){
				var obj = layers_define[i];
				var layer = my.getLayer(obj);

				if (obj.isBaseLayer && obj.isBaseLayer === true){
					baseMaps[obj.name] = layer;
				}else{
					if (!obj.group){
						overlays[obj.name] = layer;
					}else{
						if (!overlays[obj.group]){
							overlays[obj.group] = {};
						}
						overlays[obj.group][obj.name] = layer
					}
				}

				if (obj.visible !== true){
					my.map.removeLayer(layer);
				}
			}

			var options = {
					  exclusiveGroups: ["Area"],
					  groupCheckboxes: false
					};
			L.control.groupedLayers(baseMaps,overlays,options).addTo(my.map);
		});
	};

	that.CLASS_NAME =  "gis.ui.layer";
	return that;
};
/* ======================================================================
    gis/ui/dialog/mrsheet.js
   ====================================================================== */

gis.ui.dialog.mrsheet = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	my.villages = {};

	my.areas = {};
	my.checkboxIdAndAreaMap = {};

	my.getHtml = function(){
		my.getVillages();
		var html = "";
		my.areas = {};
		for (var i = 0 in my.villages){
			var v = my.villages[i];
			if (!my.areas[v.area]){
				my.areas[v.area] = [];
			}
			my.areas[v.area].push(v);
		}

		html = "<ul>";
		for (var area in my.areas){
			html += "<li><label><input type='checkbox' id='checkAll" + area + "'>" + area + "</label></li>";
			html += "<ul id='checkboxArea" + area + "'>";
			for (var i = 0 in my.areas[area]){
				var v = my.areas[area][i];
				html += "<li><label><input type='checkbox' name='villages' value='" + v.villageid + "' checked>" + v.villageid + ":" + v.name + "</label></li>";
			}
			html += "</ul>";
		}
		html += "</ul>";

		return html;

	};

	my.postCreate = function(){
		my.setEventForCheckbox();
	};

	my.addOptions = function(option){
		option.title = 'Meter Reading Sheets';
		option.modal = true,
		option.height = 500,
		option.width = 500,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Download' : function(){
				my.download();
			},
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.setEventForCheckbox = function(){
		for (var area in my.areas){
			my.checkboxIdAndAreaMap["checkboxArea" + area] = area
			$("#checkboxArea" + area).click(function () {
				var _id = $(this).attr("id");
				var _area = my.checkboxIdAndAreaMap[_id];
				var checkboxCount = $("#" + _id + " input[type=checkbox]").length;
		        var selectedCount = $("#" + _id + " input[type=checkbox]:checked").length;
		        if (checkboxCount === selectedCount) {
		            $("#checkAll" + _area).prop("indeterminate", false).prop("checked", true );
		        } else if (0 === selectedCount) {
		            $("#checkAll" + _area).prop("indeterminate", false).prop("checked", false);
		        } else {
		            $("#checkAll" + _area).prop("indeterminate", true ).prop("checked", false);
		        }
			}).click();
			my.checkboxIdAndAreaMap["checkAll" + area] = area
			$("#checkAll" + area).click(function () {
				var _id = $(this).attr("id");
				var _area = my.checkboxIdAndAreaMap[_id];
				var checked = $("#" + _id).prop("checked");
				$("#checkboxArea" + _area + "  input[type=checkbox]").each(function(){
					$(this).prop("checked", checked);
				});
			});
		}
	};

	my.getVillages = function(){
		$.ajax({
			url : './rest/Villages/',
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}
    		var villages = json.value
    		my.villages = {};
    		for (var i = 0 in villages){
    			var v = villages[i];
    			my.villages[v.villageid] = v;
    		}
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return false;
    	});
	}

	my.download = function(){
		var villages = [];
		$('[name="villages"]:checked').each(function(){
			villages.push($(this).val());
		});
		if (villages.length === 0){
			alert("Check a village at least.");
			return;
		}
		$.ajax({
			url : './rest/Meters/MReading?villageid=' + JSON.stringify(villages),
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};

	that.CLASS_NAME =  "gis.ui.dialog.mrsheet";
	return that;
};
/* ======================================================================
    gis/ui/dialog/billingUpload.js
   ====================================================================== */

gis.ui.dialog.billingUpload = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	my.getHtml = function(){
		var now = new Date();
		var nowYear = now.getFullYear();

		var inserthtml = "<select id='" + my.id + "-month' style='width:40%'>";
		for (var i = 1; i <= 12; i++){
			inserthtml += "<option value='" + i + "'>" + i + "</option>";
		}
		inserthtml += "</select>";

		inserthtml += "<select id='" + my.id + "-year' style='width:60%'>";
		for (var i = nowYear; i > nowYear - 5; i--){
			inserthtml += "<option value='" + i + "'>" + i + "</option>";
		}
		inserthtml += "</select>";

		var html = "<table class='dialogstyle' style='width:100%'>" +
		"<tr><td>Month/Year</td><td>" + inserthtml + "</td></tr>" +
		"<tr><td colspan='2'><input type='file' id='" + my.id + "-file' style='width:100%'></td></tr>";

		return html;
	};

	my.addOptions = function(option){
		option.title = 'Upload Billing Data';
		option.width = 400,
		option.modal = true,
		option.position = { my: "center", at: "center", of: window },
		option.buttons = {
			'Upload' : function(){
				my.upload();
			},
			'Close' : function(){
				that.close();
			}
		}
		return option;
	};

	my.postCreate = function(){
		var now = new Date();
		var nowYear = now.getFullYear();
		var nowMonth = now.getMonth() + 1;
		$("#" + my.id + "-year").val(nowYear);
		$("#" + my.id + "-month").val(nowMonth);
	};

	my.upload = function(){
		var year = $("#" + my.id + "-year").val();
		var month = $("#" + my.id + "-month").val();
		var file = $("#" + my.id + "-file").val();

		if (file === ""){
			alert("Choose a csv file from Billing System which you want to upload.");
			return;
		}
		var fileobj = $("#" + my.id + "-file").prop('files')[0];
		var filename = fileobj.name;

		if (!confirm("Would you like to upload " + filename + " of " + month + " / " + year + " ?")){
			return;
		}

		var form = new FormData();
		form.append("file",fileobj);
		form.append("yearmonth",year + ("0" + month).slice(-2));

		$.ajax({
			url : './rest/BillingSync',
			data : form,
			type : 'POST',
			dataType : 'json',
			contentType : false,
			processData : false,
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		alert("It succeeded to insert " + json.value + " records.");

    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};


	that.CLASS_NAME =  "gis.ui.dialog.billingUpload";
	return that;
};
/* ======================================================================
    gis/ui/dialog/search.js
   ====================================================================== */

/**
 * WKTを編集レイヤに表示するコントロール
 */
gis.ui.dialog.search = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'search';

	my.map = spec.map;

	/**
	 * コントロールの表示名
	 */
	my.label = spec.label || 'Search Data';

	my.tableId = "table-" + my.id;
	my.pagerId = "pager-" + my.id;

	my.selectedRow = null;

	my.marker = null;
	
	my.addOptions = function(option){
		option.title = my.label;
		option.modal = true,
		option.height = my.height,
		option.width = my.width
		option.position = { my: "center", at: "center", of: window },
		option.buttons = my.getButtons()
		return option;
	};

	my.postCreate = function(){
		my.getData();
	};
	
	my.getButtons = function(){
		var buttons = {
				'View' : my.btnView_onClick,
				'Close' : function(){
					that.close();
				}
		}
		return buttons;
	};

	my.getData = function(){
		$.ajax({
			url : my.url,
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}
    		//テーブルの作成
           $("#" + my.tableId).jqGrid({
	           data:json.value, //表示したいデータ
	           datatype : "local", //データの種別 他にjsonやxmlも選べます。
	           //しかし、私はlocalが推奨です。
	           colNames : my.colNames, //列の表示名
	           colModel : my.colModelSettings, //列ごとの設定
	           rowNum : 10, //一ページに表示する行数
	           height : 270, //高さ
	           width : 910, //幅
	           pager : my.pagerId, //footerのページャー要素のid
	           viewrecords: true //footerの右下に表示する。
	           });
           $("#" + my.tableId).jqGrid('navGrid','#' + my.pagerId,{
        	   add:false, //おまじない
        	   edit:false, //おまじない
        	   del:false, //おまじない
        	   search:{ //検索オプション
        	   odata : ['equal', 'not equal', 'less', 'less or equal',
        	   'greater','greater or equal', 'begins with',
        	   'does not begin with','is in','is not in','ends with',
        	   'does not end with','contains','does not contain']
        	   } //検索の一致条件を入れられる
        	   });
         //filterバー追加
           $("#" + my.tableId).filterToolbar({
           defaultSearch:'cn' //一致条件を入れる。
           //選択肢['eq','ne','lt','le','gt','ge','bw','bn','in','ni','ew','en','cn','nc']
           });
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return false;
    	});
	};

	my.getHtml = function(){
		var html = "<table id='" + my.tableId + "'></table><div id = '" + my.pagerId + "'></div>";
		return html;
	};

	my.getPopupContent = function(data){
		return ""
	};

	my.createPopup = function(marker,data){
		return marker.bindPopup(my.getPopupContent(data)).openPopup();
	}

	my.btnView_onClick = function(){
		var selrows = $("#" + my.tableId).getGridParam('selrow');
		if (selrows.length === 0 || selrows.length > 1){
			alert("Please select a record.");
			return;
		}
		var row = $("#" + my.tableId).getRowData(selrows[0]);
		if (row.coordinates === ''){
			alert("Your selected record is not yet captured by GPS.")
			return;
		}
		//var layer = omnivore.wkt(row.wkt);
		var coordinates = row.coordinates.split(",")
		if (my.marker !== null){
			my.map.removeLayer(my.marker);
		}
		my.marker = L.marker(coordinates).addTo(my.map);
		my.map.setView(coordinates,18);
		my.createPopup(my.marker,row);
		that.close();
	};



	that.CLASS_NAME =  "gis.ui.dialog.search";
	return that;
};
/* ======================================================================
    gis/ui/toolbar.js
   ====================================================================== */

gis.ui.toolbar = function(spec,my){
	my = my || {};

	var that = gis.ui(spec,my);

	my.map = spec.map || undefined;

	my.loginDialog = gis.ui.dialog.login({ divid : my.id });

	my.zoomactions = [
	                 gis.ui.control.toolbarAction.narok({map : my.map}).getAction(),
	                 gis.ui.control.toolbarAction.ololulunga({map : gistools.map}).getAction(),
	                 gis.ui.control.toolbarAction.kilgoris({map : gistools.map}).getAction(),
	                 gis.ui.control.toolbarAction.lolgorien({map : gistools.map}).getAction()
	                 ];

	my.billingactions = [
		                 gis.ui.control.toolbarAction.billingUpload({map : my.map, loginDialog:my.loginDialog}).getAction(),
		                 gis.ui.control.toolbarAction.mrsheet({map : gistools.map, loginDialog:my.loginDialog}).getAction(),
		                 gis.ui.control.toolbarAction.consumptionReport({map : gistools.map, loginDialog:my.loginDialog}).getAction(),
		                 gis.ui.control.toolbarAction.adjustmentReport({map : gistools.map, loginDialog:my.loginDialog}).getAction()
		                 ];

	my.placeactions = [
	                   	 gis.ui.control.toolbarAction.customer({map : my.map}).getAction(),
	                   	 gis.ui.control.toolbarAction.place({map : my.map}).getAction(),
	                   	gis.ui.control.toolbarAction.zoomToVillage({map : my.map}).getAction()
	                   ];
	
	my.gisactions = [
	                 	gis.ui.control.toolbarAction.uncaptureByGps({map : gistools.map, loginDialog:my.loginDialog}).getAction(),
	                 	gis.ui.control.toolbarAction.differentVillage({map : gistools.map, loginDialog:my.loginDialog}).getAction()
	                 ];

	that.init =function(){

		var searchMainActions = L.ToolbarAction.extend({
            options: {
                toolbarIcon: {
                	html:'<img border="0" src="./js/lib/leaflet/custom-images/search.png" width="25" height="25">',
                	tooltip:'Search Location'
                },
                subToolbar: new L.Toolbar({
                    actions: my.placeactions
                })
            }
        });

		var billingMainActions = L.ToolbarAction.extend({
            options: {
                toolbarIcon: {
                	html:'<img border="0" src="./js/lib/leaflet/custom-images/money.png" width="25" height="25">'
                },
                subToolbar: new L.Toolbar({
                    actions: my.billingactions
                })
            }
        });
		
		var gisMainActions = L.ToolbarAction.extend({
            options: {
                toolbarIcon: {
                	html:'<img border="0" src="./js/lib/leaflet/custom-images/gis.png" width="25" height="25">'
                },
                subToolbar: new L.Toolbar({
                    actions: my.gisactions
                })
            }
        });

		var zoomMainActions = L.ToolbarAction.extend({
            options: {
                toolbarIcon: {
                	html:'<img border="0" src="./js/lib/leaflet/custom-images/zoom-in.jpg" width="25" height="25">'
                },
                subToolbar: new L.Toolbar({
                    actions: my.zoomactions
                })
            }
        });

		var worksheetAction = gis.ui.control.toolbarAction.worksheet({map : gistools.map}).getAction();
		var printAction = gis.ui.control.toolbarAction.print({map : gistools.map}).getAction();

		new L.Toolbar.Control({
            position: 'topleft',
            actions: [zoomMainActions,searchMainActions,worksheetAction,billingMainActions,gisMainActions,printAction]
        }).addTo(my.map);
	};

	that.CLASS_NAME =  "gis.ui.toolbar";
	return that;
};
/* ======================================================================
    gis/ui/dialog/search/customerView.js
   ====================================================================== */

/**
 * WKTを編集レイヤに表示するコントロール
 */
gis.ui.dialog.search.customerView = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog.search(spec,my);

	my.id = spec.id || 'customerView';
	my.label = spec.label || 'Search Customer';
	my.height = 510;
	my.width = 940;
	my.tableId = "table-" + my.id;
	my.pagerId = "pager-" + my.id;
	my.url = './rest/Customers/';
	my.colModelSettings= [
       {name:"villageid",index:"villageid",width:60,align:"center",classes:"villageid_class"},
       {name:"villagename",index:"villagename",width:150,align:"left",classes:"villagename_class"},
       {name:"zone",index:"zone",width:50,align:"center",classes:"zone_class"},
       {name:"con",index:"con",width:70,align:"left",classes:"con_class"},
       {name:"name",index:"name",width:300,align:"left",classes:"name_class"},
       {name:"status",index:"status",width:60,align:"center",classes:"status_class"},
       {name:"serialno",index:"serialno",width:150,align:"left",classes:"serialno_class"},
       {name:"coordinates",index:"coordinates",width:300,align:"left",classes:"coordinates_class"}
   ]
	my.colNames = ["Village ID","Village Name","Zone","Con","Customer Name","Status","Meter S/N","Location"];

	my.getPopupContent = function(data){
		return data.con + data.zone + "<br>" + data.name;
	};
	
	my.getButtons = function(){
		var buttons = {
				'Statement' : my.btnStatement_onClick,
				'View' : my.btnView_onClick,
				'Close' : function(){
					that.close();
				}
		}
		return buttons;
	};
	
	my.btnStatement_onClick = function(){
		var selrows = $("#" + my.tableId).getGridParam('selrow');
		if (selrows.length === 0 || selrows.length > 1){
			alert("Please select a record.");
			return;
		}
		var row = $("#" + my.tableId).getRowData(selrows[0]);
		
		$.ajax({
			url : './rest/BillingSync/Statement?zone=' + row.zone + '&connectionno=' + row.con,
			type : 'GET',
			dataType : 'json',
			contentType : false,
			processData : false,
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    		that.close();
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};

	that.CLASS_NAME =  "gis.ui.dialog.search.customerView";
	return that;
};
/* ======================================================================
    gis/ui/dialog/search/placeView.js
   ====================================================================== */

/**
 * WKTを編集レイヤに表示するコントロール
 */
gis.ui.dialog.search.placeView = function(spec,my){
	my = my || {};

	var that = gis.ui.dialog.search(spec,my);

	my.id = spec.id || 'placeView';
	my.label = spec.label || 'Search Place';
	my.height = 510;
	my.width = 930;
	my.tableId = "table-" + my.id;
	my.pagerId = "pager-" + my.id;
	my.url = './rest/Places/';
	my.colModelSettings= [
       {name:"placeid",index:"placeid",width:50,align:"right",classes:"placeid_class"},
       {name:"name",index:"name",width:200,align:"left",classes:"name_class"},
       {name:"category",index:"category",width:150,align:"left",classes:"category_class"},
       {name:"coordinates",index:"coordinates",width:150,align:"left",classes:"coordinates_class"}
   ]
	my.colNames = ["Place ID","Place Name","Category","Location"];

	my.getPopupContent = function(data){
		return data.name;
	};

	that.CLASS_NAME =  "gis.ui.dialog.search.customerView";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/adjustmentReport.js
   ====================================================================== */

gis.ui.control.toolbarAction.adjustmentReport = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-adjustmentReport';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/adjustment.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Download Adjustment Report';

	my.dialog = gis.ui.dialog.adjustmentReport({ divid : my.id });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.adjustmentReport";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/billingUpload.js
   ====================================================================== */

gis.ui.control.toolbarAction.billingUpload = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-billingUpload';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/upload.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Upload Billing Data';

	my.dialog = gis.ui.dialog.billingUpload({ divid : my.id });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.billingUpload";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/consumptionReport.js
   ====================================================================== */

gis.ui.control.toolbarAction.consumptionReport = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-consumptionReport';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/water_consumption.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Download Monthly Consumption Data by Villages';

	my.dialog = gis.ui.dialog.consumptionReport({ divid : my.id });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.consumptionReport";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/customer.js
   ====================================================================== */

gis.ui.control.toolbarAction.customer = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-customer';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/customer.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Search Location of Customer';

	my.dialog = gis.ui.dialog.search.customerView({ divid : my.id ,map : my.map});

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};


	that.CLASS_NAME =  "gis.ui.control.toolbarAction.customer";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/differentVillage.js
   ====================================================================== */

gis.ui.control.toolbarAction.differentVillage = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-differentVillage';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/village.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Download Meter List of changing village';

	my.dialog = gis.ui.dialog.differentVillage({ divid : my.id });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.differentVillage";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/kilgoris.js
   ====================================================================== */

gis.ui.control.toolbarAction.kilgoris = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction.kilgoris';

	my.html = spec.html || 'Kilgoris';
	my.tooltip = spec.tooltip || 'Zoom To Kilgoris';
	my.bounds = [[-0.99405233,34.85809698],[-1.01409134,34.8914455]];


	that.callback = function(){
		my.map.fitBounds(my.bounds);
    	my.map.zoomIn();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.kilgoris";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/lolgorien.js
   ====================================================================== */

gis.ui.control.toolbarAction.lolgorien = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction.lolgorien';

	my.html = spec.html || 'Lolgorien';
	my.tooltip = spec.tooltip || 'zoom To Lolgorien';
	my.bounds = [[-1.22284266,34.79099915],[-1.2428443,34.82599266]];


	that.callback = function(){
		my.map.fitBounds(my.bounds);
    	my.map.zoomIn();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.lolgorien";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/mrsheet.js
   ====================================================================== */

gis.ui.control.toolbarAction.mrsheet = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	my.id = spec.id ||'toolbarAction-mrsheet';
	my.html = spec.html ||'<img border="0" src="./js/lib/leaflet/custom-images/meter.png" width="25" height="25">';
	my.tooltip = spec.tooltip ||'Download Meter Reading Sheet';

	my.dialog = gis.ui.dialog.mrsheet({ divid : my.id });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.mrsheet";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/narok.js
   ====================================================================== */

gis.ui.control.toolbarAction.narok = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction.narok';

	my.html = spec.html || 'Narok';
	my.tooltip = spec.tooltip || 'zoom To Narok';
	my.bounds = [[-1.11488791,35.84686198],[-1.05119559,35.89526577]];


	that.callback = function(){
		my.map.fitBounds(my.bounds);
    	my.map.zoomIn();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.narok";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/ololulunga.js
   ====================================================================== */

gis.ui.control.toolbarAction.ololulunga = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction.ololulunga';

	my.html = spec.html || 'Ololulunga';
	my.tooltip = spec.tooltip || 'Zoom To Ololulunga';
	my.bounds = [[-1.02494673,35.64209445],[-0.99425264,35.68120044]];

	that.callback = function(){
		my.map.fitBounds(my.bounds);
    	my.map.zoomIn();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.ololulunga";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/place.js
   ====================================================================== */

gis.ui.control.toolbarAction.place = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-place';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/place.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Search Location of Place';

	my.dialog = gis.ui.dialog.search.placeView({ divid : my.id ,map : my.map});

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};


	that.CLASS_NAME =  "gis.ui.control.toolbarAction.place";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/print.js
   ====================================================================== */

gis.ui.control.toolbarAction.print = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction.print';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/print.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Print Map';


	that.callback = function(){
		window.print();
	};


	that.CLASS_NAME =  "gis.ui.control.toolbarAction.print";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/uncaptureByGps.js
   ====================================================================== */

gis.ui.control.toolbarAction.uncaptureByGps = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-uncaptureByGps';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/gps.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Download Uncaptured Meters by GPS';

	my.dialog = gis.ui.dialog.uncaptureByGps({ divid : my.id });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};


	that.CLASS_NAME =  "gis.ui.control.toolbarAction.uncaptureByGps";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/worksheet.js
   ====================================================================== */

gis.ui.control.toolbarAction.worksheet = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction.worksheet';

	my.html = spec.html ||'<img border="0" src="./js/lib/leaflet/custom-images/worksheet.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Export O&M Worksheet';

	that.callback = function(){
		var bbox = my.map.getBounds().getWest() + ',' + my.map.getBounds().getSouth() + ',' + my.map.getBounds().getEast() + ',' + my.map.getBounds().getNorth();
		$.ajax({
			url : './rest/MapPdf/OM?bbox=' + bbox,
			type : 'GET',
			dataType : 'json',
			cache : false,
			async : false
    	}).done(function(json){
    		if (json.code !== 0){
    			alert(json.message);
    			return;
    		}

    		window.open(json.value);
    	}).fail(function(xhr){
			console.log(xhr.status + ';' + xhr.statusText);
			return;
    	});
	};


	that.CLASS_NAME =  "gis.ui.control.toolbarAction.worksheet";
	return that;
};
/* ======================================================================
    gis/ui/control/toolbarAction/zoomToVillage.js
   ====================================================================== */

gis.ui.control.toolbarAction.zoomToVillage = function(spec,my){
	my = my || {};

	var that = gis.ui.control.toolbarAction(spec,my);

	/**
	 * コントロールのID
	 */
	my.id = spec.id || 'toolbarAction-zoomToVillage';

	my.html = spec.html || '<img border="0" src="./js/lib/leaflet/custom-images/village.png" width="25" height="25">';
	my.tooltip = spec.tooltip || 'Zoom To Village';

	my.dialog = gis.ui.dialog.zoomToVillage({ divid : my.id, map : my.map });

	that.callback = function(){
		my.dialog.create({});
		my.dialog.open();
	};

	that.CLASS_NAME =  "gis.ui.control.toolbarAction.zoomToVillage";
	return that;
};
