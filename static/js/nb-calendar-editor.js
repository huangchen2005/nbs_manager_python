/**
 * Extension for Calendar with support of editable input field.
 * Author: Liao XiongJie. (liaoxj@networkbench.com). 
 * Date  : Nov, 2007.
 */
var __DEBUG_MODE = false;
Calendar.ie_version = Calendar.is_ie && /msie[\s]*([0-9\.]+)\;/i.test(navigator.appVersion) ? parseFloat(RegExp.$1) : null;

NBCalendar = function() {}

NBCalendar.__if_editing = null;	//the input field editing
NBCalendar.__if_cursor = null;	//the cursor position in the input field editing
NBCalendar.__if_seltext = null;	//selection text of input field
NBCalendar.__if_capture;		//capture cursor
NBCalendar.__if_allselected = false;

NBCalendar.setup = function (params) {
	var inputField;

	if(params.dateRange && params.dateRange.length) {
		for(var i = 0; i < params.dateRange.length; i++) {
			var date = params.dateRange[i];
			if(date && typeof date == "string") {
				var dateFmt = params.inputField ? params.ifFormat : params.daFormat;
				params.dateRange[i] = Date.parseDate(date, dateFmt || "%Y/%m/%d");
			}
		}

		params.dateStatusFunc0 = params.dateStatusFunc;
		params.dateStatusFunc = NBCalendar.__check_date;
	}

	if(params.button == null) {
		//create a default button to invoke the calendar
		inputField = params.inputField;
		if(inputField) {
			if(typeof inputField == "string") {
				inputField = document.getElementById(inputField);
			}

			var container = document.createElement("SPAN");
			container.style.display = "inline-block";
			container.style.padding = "0px";
			var icoButton = document.createElement("IMG");
			icoButton.border = 0;
			icoButton.src = "/static/images/icon_calendar.gif";
			icoButton.align = "top";
			icoButton.style.marginTop = icoButton.style.marginBottom = icoButton.style.marginRight = "0px";
			icoButton.style.marginLeft = "2px";

			var pnode = inputField.parentNode;
			pnode.insertBefore(container, inputField.nextSibling);
			pnode.removeChild(inputField);
			container.appendChild(inputField);
			inputField.style.border = "0px";
			
			container.appendChild(icoButton);
			if(inputField.className) {
				container.className = inputField.className;
			} else {
				container.style.backgroundColor = inputField.style.backgroundColor;
				if(!(container.style.border = inputField.style.border))
					container.style.border = "1px solid black";

				container.style.margin = inputField.style.margin;
				container.style.marginTop = inputField.style.marginTop;
				container.style.marginBottom = inputField.style.marginBottom;
				container.style.marginLeft = inputField.style.marginLeft;
				container.style.marginRight = inputField.style.marginRight;
			}
			
			inputField.style.marginTop = inputField.style.marginBottom = inputField.style.marginLeft = inputField.style.marginRight = "0px";

			//calculate width
			if(params.ifFormat) {
				var length = params.ifFormat.length + 2;
				inputField.style.width = parseInt(length * 6.5 + 2) + "px";
			}
			params.button = icoButton;
		}
	}

	if(typeof params.align == "undefined") {params.align = null;}	//fix a BUG(?) in calendar.js (see line 1437)

	Calendar.setup(params);
	
	inputField = params.inputField;
	if(inputField && params.button && !inputField.disabled && !inputField.readOnly) {
		var ifFormat = params.ifFormat ? params.ifFormat : "";
		var ifName = inputField.id || inputField.name;
		var ifOnEdit = ifName + "__onedit";
		var ifOnUpdate = ifName + "__onupdate";

		window[ifName + "__target"] = inputField;
		if(params.onEdit)
			window[ifOnEdit] = params.onEdit;

		if(params.onUpdate)
			window[ifOnUpdate] = params.onUpdate;

		Calendar.addEvent(inputField, "mousedown", NBCalendar.__if_onmousedown);
		Calendar.addEvent(inputField, "click", NBCalendar.__if_onclick);
		Calendar.addEvent(inputField, Calendar.is_opera ? "keypress" : "keydown", new Function("event", "return NBCalendar.__if_onkeydown(event, \"" + ifFormat + "\", window[\"" + ifOnEdit + "\"] || NBCalendar.__if_onedit);"));
		Calendar.addEvent(inputField, "keyup", NBCalendar.__if_onkeyup);
		Calendar.addEvent(inputField, "focus", NBCalendar.__if_onfocus);
		Calendar.addEvent(inputField, "blur", new Function("event", "return NBCalendar.__if_onblur(event, \"" + ifFormat + "\", window[\"" + ifOnEdit + "\"] || NBCalendar.__if_onedit, window[\"" + ifOnUpdate + "\"]);"));
		Calendar.addEvent(inputField, "contextmenu", NBCalendar.__if_oncontextmenu);
	}
}

NBCalendar.__if_onmousedown = function(ev) {
	var target = Calendar.getTargetElement(ev);
	if(!target || !target.value) return;	
	
	if(__DEBUG_MODE) log("mousedown on " + target.id);

	NBCalendar.__if_editing = target;
}

NBCalendar.__if_onclick = function(ev) {
	var target = Calendar.getTargetElement(ev);
	if(!target || !target.value) return;	
	
	if(__DEBUG_MODE) log("click on " + target.id);

	NBCalendar.__select_current_part(target);
}

NBCalendar.__if_onfocus = function(ev) {
	var target = Calendar.getTargetElement(ev);
	if(!target || !target.value) return;	
	
	if(NBCalendar.__if_editing != target) {
		if(__DEBUG_MODE) log("focus on " + target.id);
		//avoid the violation with onclick event, that is, this will only be triggered by focusing event via key
		NBCalendar.__if_cursor = 0;
		NBCalendar.__if_editing = target;
		//NBCalendar.__select_current_part(target, true, false);
		target.select();
		NBCalendar.__if_allselected = true;
		return Calendar.stopEvent(ev);
	}
}

NBCalendar.__if_onkeydown = function(ev, ifFormat, onedit) {
	//only digital characters, arrows & backspace are allowed
	var kc = ev.keyCode;
	if(kc == 9) {
		return true;	//enable key of TAB
	}

	var target = Calendar.getTargetElement(ev);
	if(!target || !target.value) return Calendar.stopEvent(ev);
	
	if(kc == 37 || kc == 8) {
		//left arrow or backspace: move to previous part
		//trigger onEdit
		var subtext = NBCalendar.__if_current_subtext();
		//get the date format pattern part wich subtext matches
		var pattern;
		if(!ifFormat) ifFormat = "%Y-%m-%d %H:%M";
		var a = target.value.split(/\W+/);
		var b = ifFormat.match(/%./g);
		var offset = 0;
		for(var i = 0; i < a.length; i++) {
			if(a[i] == "") continue;
			offset = target.value.indexOf(a[i], offset) + a[i].length; //offset of next part
			if(NBCalendar.__if_cursor < offset) {
				pattern = b[i];
				break;
			}			
		}

		var onEditStatus;
		if(typeof onedit != "undefined") {
			if(__DEBUG_MODE) log("onedit('" + subtext.text + "', '" + pattern + "')");
			NBCalendar.__if_capture = true;
			onEditStatus = onedit(subtext.text, pattern);
			NBCalendar.__if_capture = false;
		}

		if(onEditStatus == undefined || onEditStatus) {
			NBCalendar.__select_prev_part(target, true);
		}	
	} else if(kc == 38 || kc == 40 || kc == 33 || kc == 34) {
		//up arrow/down arrow/page up/page down:
		var subtext, pattern;
		if(!ifFormat) ifFormat = "%Y-%m-%d %H:%M";

		if(NBCalendar.__if_allselected) {
			//target input field is all selected. we assume you want to increase/decrease by day
			var a = target.value.split(/\W+/);
			var b = ifFormat.match(/%./g);
			var offset = 0;
			for(var i = 0; i < a.length; i++) {
				if(a[i] == "") continue;
				offset = target.value.indexOf(a[i], offset);
				if(b[i] == "%d" || b[i] == "%e") {
					pattern = b[i];
					subtext = {text:a[i], start:offset, end:offset + a[i].length};
					break;
				}
				offset += a[i].length;
			}	
		} else {
			//get the date format pattern part wich subtext matches
			subtext = NBCalendar.__if_current_subtext();
			var a = target.value.split(/\W+/);
			var b = ifFormat.match(/%./g);
			var offset = 0;
			for(var i = 0; i < a.length; i++) {
				if(a[i] == "") continue;
				offset = target.value.indexOf(a[i], offset) + a[i].length; //offset of next part
				if(NBCalendar.__if_cursor < offset) {
					pattern = b[i];
					break;
				}			
			}
		}

		if(subtext != undefined) {
			var newval;
			switch(kc) {
				case 38:
					//up arrow
					newval = NBCalendar.__if_increase(subtext.text, pattern);
					if(__DEBUG_MODE) log("increasing " + subtext.text + " pattern: " + pattern + " result: " + newval);
					break;
				case 40:
					//down arrow
					newval = NBCalendar.__if_decrease(subtext.text, pattern);
					if(__DEBUG_MODE) log("decreasing " + subtext.text + " pattern: " + pattern + " result: " + newval);
					break;
				case 33:
					//page up
					newval = NBCalendar.__if_pageup(subtext.text, pattern);
					if(__DEBUG_MODE) log("pageup " + subtext.text + " pattern: " + pattern + " result: " + newval);
					break;
				case 34:
					//page down
					newval = NBCalendar.__if_pagedown(subtext.text, pattern);
					if(__DEBUG_MODE) log("pagedown " + subtext.text + " pattern: " + pattern + " result: " + newval);
					break;				
			}			
			
			if(newval != undefined) {
				var newsubtext = (newval < 10 ? "0" + newval : "" + newval);
				//replace with new subtext
				if(__DEBUG_MODE) log("start: " + subtext.start + " new subtext: " + newsubtext + " newstr: " + target.value.substring(0, subtext.start));
				var newstr = target.value.substring(0, subtext.start) + newsubtext;
				if(subtext.end < target.value.length) {
					newstr += target.value.substring(subtext.end);
				}

				target.value = newstr;

				if(NBCalendar.__if_allselected) {
					//re-select all
					target.select();
				} else {
					var selEnd = subtext.end + newsubtext.length - subtext.text.length;
					NBCalendar.__select(target, subtext.start, selEnd, true);
				}		
			}
		}
	} else if(kc == 39) {
		//right arrow: move to next part
		//trigger onEdit
		var subtext = NBCalendar.__if_seltext;
		//get the date format pattern part wich subtext matches
		var pattern;
		if(!ifFormat) ifFormat = "%Y-%m-%d %H:%M";
		var a = target.value.split(/\W+/);
		var b = ifFormat.match(/%./g);
		var offset = 0;
		for(var i = 0; i < a.length; i++) {
			if(a[i] == "") continue;
			offset = target.value.indexOf(a[i], offset) + a[i].length; //offset of next part
			if(NBCalendar.__if_cursor < offset) {
				pattern = b[i];
				break;
			}			
		}

		var onEditStatus;
		if(typeof onedit != "undefined") {
			if(__DEBUG_MODE) log("onedit('" + subtext + "', '" + pattern + "')");
			NBCalendar.__if_capture = true;
			onEditStatus = onedit(subtext, pattern);
			NBCalendar.__if_capture = false;
		}

		if(onEditStatus == undefined || onEditStatus) {
			NBCalendar.__select_next_part(target, true);
		}
	} else if(NBCalendar.isDigit(kc)) {
		var val = "";
		if(NBCalendar.__if_cursor > 0) 
			val += target.value.substring(0, NBCalendar.__if_cursor);

		val += (kc >= 96 ? kc - 96 : kc - 48)

		if(NBCalendar.__if_cursor + 1 < target.value.length) {
			val = val + target.value.substring(NBCalendar.__if_cursor + 1);
			target.value = val;
						
			if(NBCalendar.isDigit(val.charCodeAt(NBCalendar.__if_cursor + 1))) {
				NBCalendar.__if_cursor++;
				if(__DEBUG_MODE) log("move cursor to " + NBCalendar.__if_cursor);
				//select to end
				var selEnd = NBCalendar.__if_cursor;
				while(selEnd < val.length && NBCalendar.isDigit(val.charCodeAt(selEnd))) {
					selEnd++;
				}
				NBCalendar.__select(target, NBCalendar.__if_cursor, selEnd);
			} else {
				//get text for current part
				var selEnd = NBCalendar.__if_cursor;
				var selStart = selEnd;
				while(selStart > 0 && NBCalendar.isDigit(val.charCodeAt(selStart - 1))) {
					selStart--;
				}
				var subtext = val.substring(selStart, selEnd + 1);
				//move to next part for editing
				if(__DEBUG_MODE) log("finished current part: " + subtext);
				//get the date format pattern part wich subtext matches
				var pattern;
				if(!ifFormat) ifFormat = "%Y-%m-%d %H:%M";
				var a = val.split(/\W+/);
				var b = ifFormat.match(/%./g);
				var offset = 0;
				for(var i = 0; i < a.length; i++) {
					if(a[i] == "") continue;
					offset = val.indexOf(a[i], offset);
					if(offset == selStart) {
						pattern = b[i];
						break;
					}

					//keep matching
					offset += a[i].length;
				}

				//trigger onEdit
				var onEditStatus;
				if(typeof onedit != "undefined") {
					if(__DEBUG_MODE) log("onedit('" + subtext + "', '" + pattern + "')");
					NBCalendar.__if_capture = true;
					onEditStatus = onedit(subtext, pattern);
					NBCalendar.__if_capture = false;
				}

				if(onEditStatus == undefined || onEditStatus) {
					NBCalendar.__select_next_part(target, true);
				} else {
					NBCalendar.__select_current_part(target, true, true);
				}
			}
		} else {
			target.value = val;
			//editing finished
			//the subtext part at the end			
			if(!ifFormat) ifFormat = "%Y-%m-%d %H:%M";
			var a = val.split(/\W+/);
			var b = ifFormat.match(/%./g);
			var subtext = a[a.length - 1];
			var pattern = b[a.length - 1];
			//trigger onEdit
			var onEditStatus;
			if(typeof onedit != "undefined") {
				if(__DEBUG_MODE) log("onedit('" + subtext + "', '" + pattern + "')");
				NBCalendar.__if_capture = true;
				onEditStatus = onedit(subtext, pattern);
				NBCalendar.__if_capture = false;
			}

			if(onEditStatus == undefined || onEditStatus) {
				target.blur();
				if(__DEBUG_MODE) log("editing finished: " + target.value);
			} else {
				NBCalendar.__select_current_part(target, true, true);
			}
		}
	}

	return Calendar.stopEvent(ev);
}

NBCalendar.__if_onblur = function(ev, ifFormat, onedit, onupdate) {
	if(NBCalendar.__if_capture) //in capture status, donnot do anything
		return;
	
	//check whether the value was changed
	var target = Calendar.getTargetElement(ev);
	if(!target) return;

	if(target.getAttribute("oldValue") != target.value) {
		if(typeof onedit != "undefined") {
			//check every part
			if(!ifFormat) ifFormat = "%Y-%m-%d %H:%M";
			var a = target.value.split(/\W+/);
			var b = ifFormat.match(/%./g);
			//trigger onEdit
			var selStart = selEnd = 0;
			for(var i = 0; i < a.length; i++) {
				if(a[i] == "") continue;
				selStart = target.value.indexOf(a[i], selEnd);
				selEnd = selStart + a[i].length;

				if(__DEBUG_MODE) log("onedit('" + a[i] + "', '" + b[i] + "')");
				NBCalendar.__if_capture = true;
				var onEditStatus = onedit(a[i], b[i]);
				NBCalendar.__if_capture = false;

				if(onEditStatus == false) {
					window.setTimeout("var __if_target = window[\"" + ((target.id || target.name) + "__target") + "\"];__if_target.focus();NBCalendar.__select(__if_target, " + selStart + ", " + selEnd + ")", 30);
					if(__DEBUG_MODE) log("select: " + selStart + "," + selEnd);
					return Calendar.stopEvent(ev);
				}
			}
		}

		if(typeof(onupdate) != "undefined") {
			if(__DEBUG_MODE) log("onupdate " + target.id);
			if(onupdate(Date.parseDate(target.value, ifFormat || "%Y-%m-%d %H:%M")) == false)
				target.focus();
		}
	}

	if(__DEBUG_MODE) log("blur on " + target.id);
	if(target == NBCalendar.__if_editing) 
		NBCalendar.__if_editing = null;
	NBCalendar.__if_cursor = null;
	NBCalendar.__if_seltext = null;
}

NBCalendar.__if_onkeyup = function(ev) {
	if(ev.keyCode == 9) {
		return true;	//enable key of TAB
	}

	return Calendar.stopEvent(ev);
}

NBCalendar.__if_oncontextmenu = function(ev) {
	return Calendar.stopEvent(ev);
}

NBCalendar.__if_onedit = function(subtext, pattern) {
	switch(pattern) {
		case "%Y":
			var y = parseInt(subtext, 10);
			if(y > 2050) {
				alert(NBCalendar._MSG["INVALID_YEAR_NUMBER"]);
				return false;
			}
			break;
		case "%y":
			var y = parseInt(subtext, 10);
			if(y > 99) {
				alert(NBCalendar._MSG["INVALID_YEAR_NUMBER"]);
				return false;
			}
			break;
		case "%m":
			var m = parseInt(subtext, 10);
			if(m <= 0 || m > 12) {
				alert(NBCalendar._MSG["INVALID_MONTH_NUMBER"]);
				return false;
			}
			break;
		case "%d":
		case "%e":
			var d = parseInt(subtext, 10);
			if(d <= 0 || d > 31) {
				alert(NBCalendar._MSG["INVALID_DATE_NUMBER"]);
				return false;
			}
			break;
		case "%H":
		case "%k":
			var hr = parseInt(subtext, 10);
			if(hr > 23) {
				alert(NBCalendar._MSG["INVALID_HOUR_NUMBER"]);
				return false;
			}
			break;
		case "%I":
		case "%l":
			var hr = parseInt(subtext, 10);
			if(hr <= 0 || hr > 12) {
				alert(NBCalendar._MSG["INVALID_HOUR_NUMBER"]);
				return false;
			}
			break;
		case "%M":
			var min = parseInt(subtext, 10);
			if(min > 59) {
				alert(NBCalendar._MSG["INVALID_MINUTE_NUMBER"]);
				return false;
			}
			break;
		case "%S":
			var sec = parseInt(subtext, 10);
			if(sec > 59) {
				alert(NBCalendar._MSG["INVALID_SECOND_NUMBER"]);
				return false;
			}
			break;
	}
}

NBCalendar.__select_current_part = function(o, byCursor, resetCursor) {
	if(!o || !o.value) return;	
	
	if(resetCursor == undefined) resetCursor = true;
	
	var dateStr = o.value;
	var cursorPos = (byCursor ? NBCalendar.__if_cursor : NBCalendar.getSelectionStart(o));

	//select current part where the cursor is in
	var selStart = cursorPos;
	var selEnd = cursorPos;
	while(selStart > 0 && NBCalendar.isDigit(dateStr.charCodeAt(selStart - 1))) {
		selStart--;	//until the previous char is not a digit
	}

	while(selEnd < dateStr.length && NBCalendar.isDigit(dateStr.charCodeAt(selEnd))) {
		selEnd++;
	}

	return NBCalendar.__select(o, selStart, selEnd, resetCursor);
}

NBCalendar.__select_prev_part = function(o, byCursor) {
	if(!o || !o.value) return;	

	var dateStr = o.value;
	var cursorPos = (byCursor ? NBCalendar.__if_cursor : NBCalendar.getSelectionStart(o));
	//select current part where the cursor is in
	var selStart = cursorPos;
	var selEnd;

	while(selStart > 0 && NBCalendar.isDigit(dateStr.charCodeAt(selStart - 1))) {
		selStart--;	//until the previous char is not a digit
	}

	if(selStart > 0) {
		//do not reach the first char, keep loop to find the previous one
		selEnd = selStart;
		while(!NBCalendar.isDigit(dateStr.charCodeAt(selEnd - 1))) {
			selEnd--;
		}

		selStart = selEnd;
		while(selStart > 0 && NBCalendar.isDigit(dateStr.charCodeAt(selStart - 1))) {
			selStart--;	//until the previous char is not a digit
		}
	} else {
		//reach the first char, look for ending char
		selEnd = 0;
		while(selEnd < dateStr.length && NBCalendar.isDigit(dateStr.charCodeAt(selEnd))) {
			selEnd++;
		}
	}

	return NBCalendar.__select(o, selStart, selEnd, true);
}

NBCalendar.__select_next_part = function(o, byCursor) {
	if(!o || !o.value) return;	

	var dateStr = o.value;
	var cursorPos = (byCursor ? NBCalendar.__if_cursor : NBCalendar.getSelectionStart(o));
	//select current part where the cursor is in
	var selStart;
	var selEnd = cursorPos;
	//move to the end of current part first
	while(selEnd < dateStr.length && NBCalendar.isDigit(dateStr.charCodeAt(selEnd))) {
		selEnd++;
	}

	if(selEnd == dateStr.length) {
		//select current part
		selStart = selEnd;
		while(selStart > 0 && NBCalendar.isDigit(dateStr.charCodeAt(selStart - 1))) {
			selStart--;	//until the previous char is not a digit
		}
	} else {
		//move to next part
		selStart = selEnd;
		while(selStart < dateStr.length && !NBCalendar.isDigit(dateStr.charCodeAt(selStart))) {
			selStart++;
		}

		if(selStart < dateStr.length) {
			selEnd = selStart + 1;
			while(selEnd < dateStr.length && NBCalendar.isDigit(dateStr.charCodeAt(selEnd))) {
				selEnd++;
			}
		}
	}

	return NBCalendar.__select(o, selStart, selEnd, true);
}

NBCalendar.__select = function(o, selStart, selEnd, resetCursor) {
	if(!o || !o.value) return;

	if(resetCursor == undefined || resetCursor) NBCalendar.__if_cursor = selStart;
	NBCalendar.__if_allselected = (selStart == 0 && selEnd == o.value.length)
	return NBCalendar.__if_seltext = NBCalendar.selectRange(o, selStart, selEnd);
}

NBCalendar.__if_current_subtext = function() {
	var o = NBCalendar.__if_editing;
	if(!o || NBCalendar.__if_cursor == null) return null;

	var dateStr = o.value;

	//select current part where the cursor is in
	var selStart = NBCalendar.__if_cursor;
	var selEnd = NBCalendar.__if_cursor;
	while(selStart > 0 && NBCalendar.isDigit(dateStr.charCodeAt(selStart - 1))) {
		selStart--;	//until the previous char is not a digit
	}

	while(selEnd < dateStr.length && NBCalendar.isDigit(dateStr.charCodeAt(selEnd))) {
		selEnd++;
	}

	return {text:dateStr.substring(selStart, selEnd), start:selStart, end:selEnd, length: selEnd - selStart};
}

NBCalendar.isDigit = function(c) {
	return (c >= 48 && c <= 57) || (c >= 96 && c <= 105);
}

NBCalendar.getSelectionStart = function(o) {
	if (o.createTextRange) {
		var r = document.selection.createRange().duplicate();
		r.moveEnd('character', o.value.length);
		if (r.text == '') return o.value.length;
		return o.value.lastIndexOf(r.text);
	} else {
		return o.selectionStart;
	}
}

NBCalendar.selectRange = function(o, start, end) {
	if(end == undefined) {
		end = start;
	}

	if(NBCalendar.__if_editing != o) 
		o.focus();

	if(o.createTextRange) {
		var r = document.selection.createRange().duplicate();
		r.moveEnd("character", o.value.length);
		var cursorPos = (r.text == "" ? o.value.length : o.value.lastIndexOf(r.text));
		r.moveStart("character", start - cursorPos);
		r.moveEnd("character", end - o.value.length);
		r.select();
		return r.text;
	} else {
		o.selectionStart = start;
		o.selectionEnd = end;
		return o.value.substring(start, end);
	}	
}

NBCalendar.__if_increase = function(subtext, pattern) {
	switch(pattern) {
		case "%Y":
			var y = parseInt(subtext, 10) + 1;
			if(y > 2050) {
				y = 2050;
			}
			return y;
			break;
		case "%y":
			var y = parseInt(subtext, 10) + 1;
			if(y > 99) {
				y = 99;
			}
			return y;
			break;
		case "%m":
			var m = parseInt(subtext, 10) + 1;
			if(m > 12) {
				m = 12;
			}
			return m;
			break;
		case "%d":
		case "%e":
			var d = parseInt(subtext, 10) + 1;
			if(d > 31) {
				d = 31;
			}
			return d;
			break;
		case "%H":
		case "%k":
			var hr = parseInt(subtext, 10) + 1;
			if(hr > 23) {
				hr = 23;
			}
			return hr;
			break;
		case "%I":
		case "%l":
			var hr = parseInt(subtext, 10) + 1;
			if(hr > 12) {
				hr = 12;
			}
			return hr;
			break;
		case "%M":
			var min = parseInt(subtext, 10) + 1;
			if(min > 59) {
				min = 59;
			}
			return min;
			break;
		case "%S":
			var sec = parseInt(subtext, 10) + 1;
			if(sec > 59) {
				sec = 59;
			}
			return sec;
			break;
	}
}

NBCalendar.__if_decrease = function(subtext, pattern) {
	switch(pattern) {
		case "%Y":
			var y = parseInt(subtext, 10) - 1;
			if(y < 0) {
				y = 2007;
			}
			return y;
			break;
		case "%y":
			var y = parseInt(subtext, 10) - 1;
			if(y < 0) {
				y = 37;
			}
			return y;
			break;
		case "%m":
			var m = parseInt(subtext, 10) - 1;
			if(m <= 0) {
				m = 1;
			}
			return m;
			break;
		case "%d":
		case "%e":
			var d = parseInt(subtext, 10) - 1;
			if(d <= 0) {
				d = 1;
			}
			return d;
			break;
		case "%H":
		case "%k":
			var hr = parseInt(subtext, 10) - 1;
			if(hr <= 0) {
				hr = 0;
			}
			return hr;
			break;
		case "%I":
		case "%l":
			var hr = parseInt(subtext, 10) - 1;
			if(hr <= 0) {
				hr = 1;
			}
			return hr;
			break;
		case "%M":
			var min = parseInt(subtext, 10) - 1;
			if(min <= 0) {
				min = 0;
			}
			return min;
			break;
		case "%S":
			var sec = parseInt(subtext, 10) - 1;
			if(sec <= 0) {
				sec = 0;
			}
			return sec;
			break;
	}
}

NBCalendar.__if_pageup = function(subtext, pattern) {
	switch(pattern) {
		case "%Y":
			var y = parseInt(subtext, 10) + 5;
			if(y > 2050) {
				y = 2050;
			}
			return y;
			break;
		case "%y":
			var y = parseInt(subtext, 10) + 5;
			if(y > 99) {
				y = 99;
			}
			return y;
			break;
		case "%m":
			var m = parseInt(subtext, 10) + 3;
			if(m > 12) {
				m = 12;
			}
			return m;
			break;
		case "%d":
		case "%e":
			var d = parseInt(subtext, 10) + 10;
			if(d > 31) {
				d = 31;
			}
			return d;
			break;
		case "%H":
		case "%k":
			var hr = parseInt(subtext, 10) + 4;
			if(hr > 23) {
				hr = 23;
			}
			return hr;
			break;
		case "%I":
		case "%l":
			var hr = parseInt(subtext, 10) + 4;
			if(hr > 12) {
				hr = 12;
			}
			return hr;
			break;
		case "%M":
			var min = parseInt(subtext, 10) + 10;
			if(min > 59) {
				min = 59;
			}
			return min;
			break;
		case "%S":
			var sec = parseInt(subtext, 10) + 10;
			if(sec > 59) {
				sec = 59;
			}
			return sec;
			break;
	}
}

NBCalendar.__if_pagedown = function(subtext, pattern) {
	switch(pattern) {
		case "%Y":
			var y = parseInt(subtext, 10) - 5;
			if(y < 0) {
				y = 2007;
			}
			return y;
			break;
		case "%y":
			var y = parseInt(subtext, 10) - 5;
			if(y < 0) {
				y = 37;
			}
			return y;
			break;
		case "%m":
			var m = parseInt(subtext, 10) - 3;
			if(m <= 0) {
				m = 1;
			}
			return m;
			break;
		case "%d":
		case "%e":
			var d = parseInt(subtext, 10) - 10;
			if(d <= 0) {
				d = 1;
			}
			return d;
			break;
		case "%H":
		case "%k":
			var hr = parseInt(subtext, 10) - 4;
			if(hr <= 0) {
				hr = 0;
			}
			return hr;
			break;
		case "%I":
		case "%l":
			var hr = parseInt(subtext, 10) - 4;
			if(hr <= 0) {
				hr = 1;
			}
			return hr;
			break;
		case "%M":
			var min = parseInt(subtext, 10) - 10;
			if(min <= 0) {
				min = 0;
			}
			return min;
			break;
		case "%S":
			var sec = parseInt(subtext, 10) - 10;
			if(sec <= 0) {
				sec = 0;
			}
			return sec;
			break;
	}
}

NBCalendar.__check_date = function(date, year, month, day_of_month) {
	var status = false;
	var dateRange = this.params.dateRange;
	if(dateRange) {
		if(dateRange.length > 1) {
			status = date < dateRange[0] || date > dateRange[1];	
		} else if(dateRange.length > 0) {
			status = date < dateRange[0];
		}
	}

	if(status) return true;

	var statusFunc0 = this.params.dateStatusFunc0;
	if(statusFunc0) return statusFunc0(date, year, month, day_of_month);
	return false;
}

NBCalendar.cellClick = Calendar.cellClick;
Calendar.prototype.createInternal = Calendar.prototype.create;
/**
 *	override create method of Calendar's prototype
 */
Calendar.prototype.create = function (_par) {
	this.createInternal(_par);
	//add some extra operations here
	if (this.isPopup && this.params && this.params.allowEmpty) {
		var cell = Calendar.createElement("td");
		cell.className = "button";
		Calendar._add_evs(cell);
		cell.calendar = this;
		cell.navtype = 666;
		cell.innerHTML = "<div unselectable='on'>" + Calendar._TT["CLEAR"] + "</div>";
		cell.ttip = this.params.tooltipForClear ? this.params.tooltipForClear : Calendar._TT["CLEAR_DATE_FIELD"];
		var colspan0 = parseInt(this._nav_now.colSpan);
		if(colspan0 < 4) {
			this._nav_now.colSpan = colspan0 - 1;
		} else {
			cell.colSpan = 2;
			this._nav_now.colSpan = colspan0 - 2;
		}
		this._nav_now.parentNode.insertBefore(cell, this._nav_now.nextSibling);
	}
};

/** Shows the calendar near a given element. */
/*
 *	fix a bug for IE 7 or above, when Calendar is initialized with the params 'button' & 'align' and the page is scrolled down, the calendar box floats away.
 */
Calendar.prototype.showAtElement = function (el, opts) {
	var self = this;
	var p = Calendar.getAbsolutePos(el);
	if (!opts || typeof opts != "string") {
		this.showAt(p.x, p.y + el.offsetHeight);
		return true;
	}
	function fixPosition(box) {
		if (box.x < 0)
			box.x = 0;
		if (box.y < 0)
			box.y = 0;
		var cp = document.createElement("div");
		var s = cp.style;
		s.position = "absolute";
		s.right = s.bottom = s.width = s.height = "0px";
		document.body.appendChild(cp);
		var br = Calendar.getAbsolutePos(cp);
		document.body.removeChild(cp);
		if (Calendar.is_ie) {
			br.y += document.body.scrollTop;
			br.x += document.body.scrollLeft;
		} else {
			br.y += window.scrollY;
			br.x += window.scrollX;
		}
		var tmp = box.x + box.width - br.x;
		if (tmp > 0) box.x -= tmp;
		tmp = box.y + box.height - br.y;
		if (tmp > 0) box.y -= tmp;
	};
	this.element.style.display = "block";
	Calendar.continuation_for_the_fucking_khtml_browser = function() {
		var w = self.element.offsetWidth;
		var h = self.element.offsetHeight;
		self.element.style.display = "none";
		var valign = opts.substr(0, 1);
		var halign = "l";
		if (opts.length > 1) {
			halign = opts.substr(1, 1);
		}
		// vertical alignment
		switch (valign) {
		    case "T": p.y -= h; break;
		    case "B": p.y += el.offsetHeight; break;
		    case "C": p.y += (el.offsetHeight - h) / 2; break;
		    case "t": p.y += el.offsetHeight - h; break;
		    case "b": break; // already there
		}
		// horizontal alignment
		switch (halign) {
		    case "L": p.x -= w; break;
		    case "R": p.x += el.offsetWidth; break;
		    case "C": p.x += (el.offsetWidth - w) / 2; break;
		    case "l": p.x += el.offsetWidth - w; break;
		    case "r": break; // already there
		}
		p.width = w;
		p.height = h + 40;
		self.monthsCombo.style.display = "none";
		//for IE 7 or above, DONNOT fixPosition, since it's already at the right position!
		if(!Calendar.is_ie || Calendar.ie_version < 7) fixPosition(p);
		self.showAt(p.x, p.y);
	};
	if (Calendar.is_khtml)
		setTimeout("Calendar.continuation_for_the_fucking_khtml_browser()", 10);
	else
		Calendar.continuation_for_the_fucking_khtml_browser();
};

/**
 *	override cellClick method of Calendar
 */
Calendar.cellClick = function(el, ev) {
	NBCalendar.cellClick(el, ev);
	//add some extra operations here
	if (el.navtype == 666) {
		//clear date field
		var cal = el.calendar;
		var input;
		if(cal.params && (input = cal.params.inputField)) {
			input.value = "";
		}

		//ev && cal.callHandler();
		Calendar.removeClass(el, "hilite");
		ev && cal.callCloseHandler();
	}
};

function log(message) {
	if(!__DEBUG_MODE) return;
    if (!log.window_ || log.window_.closed) {
        var win = window.open("", null, "width=400,height=200," +
                              "scrollbars=yes,resizable=yes,status=yes," +
                              "location=no,menubar=no,toolbar=no");
        if (!win) return;
        var doc = win.document;
        doc.write("<html><head><title>Debug Log</title></head>" +
                  "<body><input type='button' value='Clear' onclick=\"var _logger=document.getElementById('logger');for(var i=_logger.childNodes.length-1;i>=0;i--) _logger.removeChild(_logger.childNodes[i]);\"/><div id='logger'></div></body></html>");
        doc.close();
        log.window_ = win;		
    }
    var logLine = log.window_.document.createElement("div");
    logLine.appendChild(log.window_.document.createTextNode(message));
    log.window_.document.getElementById("logger").appendChild(logLine);
	logLine.scrollIntoView();
}

if(__DEBUG_MODE) log("");
