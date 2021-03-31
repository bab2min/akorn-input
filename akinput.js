/**
jQuery용 옛한글 입력기 akorn input v0.2.0

email: bab2min@gmail.com
github: https://github.com/bab2min/akorn-input/
license: MIT License
**/

(function(){
	$.fn.getCaretPos = function() {
        var input = this.get(0);
        if (!input) return;
        if ('selectionStart' in input) {
            return input.selectionStart;
        } else if (document.selection) {
            // IE
            input.focus();
            var sel = document.selection.createRange();
            var selLen = document.selection.createRange().text.length;
            sel.moveStart('character', -input.value.length);
            return sel.text.length - selLen;
        }
    };
	
	$.fn.setCaretPos = function(caretPos) {
		var input = this.get(0);
		if (!input) return;
		input.value = input.value;
		if (input.createTextRange) {
			var range = input.createTextRange();
			range.move('character', caretPos);
			range.select();
			return true;
		} else {
			if (input.selectionStart || input.selectionStart === 0) {
				input.focus();
				input.setSelectionRange(caretPos, caretPos);
				return true;
			} else  {
				input.focus();
				return false;
			}
		}
	};
	
	/*
	매핑 테이블
	AP: 기본 초성 문자 -> 옛한글 초성
	PA: 옛한글 초성 -> 기본 초성 문자
	BP: 기본 중성 문자 -> 옛한글 중성
	PB: 옛한글 중성 -> 기본 중성 문자
	CP: 기본 종성 문자 -> 옛한글 종성
	PC: 옛한글 종성 -> 기본 종성 문자
	SP: ㅜ,ㅠ 특수키 조합 -> 옛한글 초성
	*/
	var tableAP = {}, tablePA = {};
	var tableBP = {}, tablePB = {};
	var tableCP = {}, tablePC = {};
	var tableSP = {};
	
	/* 자음(초성) -> 옛한글 매핑 테이블 */
	var tableA = {
	'\u3131':'\u1100',
	'\u3132':'\u1101',
	'\u3134':'\u1102',
	'\u3137':'\u1103',
	'\u3138':'\u1104',
	'\u3139':'\u1105',
	'\u3141':'\u1106',
	'\u3142':'\u1107',
	'\u3143':'\u1108',
	'\u3145':'\u1109',
	'\u3146':'\u110A',
	'\u3147':'\u110B',
	'\u3148':'\u110C',
	'\u3149':'\u110D',
	'\u314A':'\u110E',
	'\u314B':'\u110F',
	'\u314C':'\u1110',
	'\u314D':'\u1111',
	'\u314E':'\u1112',
	};

	/* 자음(초성) + Shift키 -> 옛한글 매핑 테이블
	 ** ㅠ+Shift, ㅜ+Shift도 자음으로 매핑되므로 이 테이블에 포함됨
	*/
	var tableAShift = {
	'\u3141':'\u1140',
	'\u3147':'\u114C',
	'\u314E':'\u1159',
	'\u314B':'\u113C',
	'\u314C':'\u113E',
	'\u314A':'\u114E',
	'\u314D':'\u1150',
	'\u3160':'\u1154',
	'\u315C':'\u1155',
	};

	
	/* 모음 -> 옛한글 매핑 테이블 */
	var tableB = {
	'\u314F':'\u1161',
	'\u3150':'\u1162',
	'\u3151':'\u1163',
	'\u3152':'\u1164',
	'\u3153':'\u1165',
	'\u3154':'\u1166',
	'\u3155':'\u1167',
	'\u3156':'\u1168',
	'\u3157':'\u1169',
	'\u315B':'\u116D',
	'\u315C':'\u116E',
	'\u3160':'\u1172',
	'\u3161':'\u1173',
	'\u3163':'\u1175',
	};

	/* 자음(종성) -> 옛한글 매핑 테이블 */
	var tableC = {
	'\u3131':'\u11A8',
	'\u3132':'\u11A9',
	'\u3134':'\u11AB',
	'\u3137':'\u11AE',
	'\u3139':'\u11AF',
	'\u3141':'\u11B7',
	'\u3142':'\u11B8',
	'\u3145':'\u11BA',
	'\u3146':'\u11BB',
	'\u3147':'\u11BC',
	'\u3148':'\u11BD',
	'\u314A':'\u11BE',
	'\u314B':'\u11BF',
	'\u314C':'\u11C0',
	'\u314D':'\u11C1',
	'\u314E':'\u11C2',
	};

	/* 자음(종성) + Shift키 -> 옛한글 매핑 테이블 */
	var tableCShift = {
	'\u3141':'\u11EB',
	'\u3147':'\u11F0',
	'\u314E':'\u11F9',
	};

	/* 옛한글 초성 분해 테이블 */
	var _tableAP = [
	'ㄴㄱ',
	'ㄴㄴ',
	'ㄴㄷ',
	'ㄴㅂ',
	'ㄷㄱ',
	'ㄹㄴ',
	'ㄹㄹ',
	'ㄹㅎ',
	'ㄹㅇ',
	'ㅁㅂ',
	'ㅁㅇ',
	'ㅂㄱ',
	'ㅂㄴ',
	'ㅂㄷ',
	'ㅂㅅ',
	'ㅂㅅㄱ',
	'ㅂㅅㄷ',
	'ㅂㅅㅂ',
	'ㅂㅅㅅ',
	'ㅂㅅㅈ',
	'ㅂㅈ',
	'ㅂㅊ',
	'ㅂㅌ',
	'ㅂㅍ',
	'ㅂㅇ',
	'ㅃㅇ',
	'ㅅㄱ',
	'ㅅㄴ',
	'ㅅㄷ',
	'ㅅㄹ',
	'ㅅㅁ',
	'ㅅㅂ',
	'ㅅㅂㄱ',
	'ㅅㅅㅅ',
	'ㅅㅇ',
	'ㅅㅈ',
	'ㅅㅊ',
	'ㅅㅋ',
	'ㅅㅌ',
	'ㅅㅍ',
	'ㅅㅎ',
	'\u113C',
	'\u113C\u113C',
	'\u113E',
	'\u113E\u113E',
	'\u1140',
	'ㅇㄱ',
	'ㅇㄷ',
	'ㅇㅁ',
	'ㅇㅂ',
	'ㅇㅅ',
	'ㅇ\u1140',
	'ㅇㅇ',
	'ㅇㅈ',
	'ㅇㅊ',
	'ㅇㅌ',
	'ㅇㅍ',
	'\u114C',
	'ㅈㅇ',
	'\u114E',
	'\u114E\u114E',
	'\u1150',
	'\u1150\u1150',
	'ㅊㅋ',
	'ㅊㅎ',
	'\u1154',
	'\u1155',
	'ㅍㅂ',
	'ㅍㅇ',
	'ㅎㅎ',
	'\u1159',
	'ㄱㄷ',
	'ㄴㅅ',
	'ㄴㅈ',
	'ㄴㅎ',
	'ㄷㄹ',
	];

	/* 옛한글 초성 분해 테이블 (유니코드 5.2 추가 영역) */
	var _tableAP2 = [
	'ㄷㅁ',
	'ㄷㅂ',
	'ㄷㅅ',
	'ㄷㅈ',
	'ㄹㄱ',
	'ㄹㄱㄱ',
	'ㄹㄷ',
	'ㄹㄷㄷ',
	'ㄹㅁ',
	'ㄹㅂ',
	'ㄹㅂㅂ',
	'ㄹㅂㅇ',
	'ㄹㅅ',
	'ㄹㅈ',
	'ㄹㅋ',
	'ㅁㄱ',
	'ㅁㄷ',
	'ㅁㅅ',
	'ㅂㅅㅌ',
	'ㅂㅋ',
	'ㅂㅎ',
	'ㅅㅅㅂ',
	'ㅇㄹ',
	'ㅇㅎ',
	'ㅉㅎ',
	'ㅌㅌ',
	'ㅍㅎ',
	'ㅎㅅ',
	'\u1159\u1159',
	];

	/* 옛한글 중성 분해 테이블 */
	var _tableBP = [
	'ㅏ',
	'ㅐ',
	'ㅑ',
	'ㅒ',
	'ㅓ',
	'ㅔ',
	'ㅕ',
	'ㅖ',
	'ㅗ',
	'ㅗㅏ',
	'ㅗㅐ',
	'ㅗㅣ',
	'ㅛ',
	'ㅜ',
	'ㅜㅓ',
	'ㅜㅔ',
	'ㅜㅣ',
	'ㅠ',
	'ㅡ',
	'ㅡㅣ',
	'ㅣ',
	'ㅏㅗ',
	'ㅏㅜ',
	'ㅑㅗ',
	'ㅑㅛ',
	'ㅓㅗ',
	'ㅓㅜ',
	'ㅓㅡ',
	'ㅕㅗ',
	'ㅕㅜ',
	'ㅗㅓ',
	'ㅗㅔ',
	'ㅗㅖ',
	'ㅗㅗ',
	'ㅗㅜ',
	'ㅛㅑ',
	'ㅛㅒ',
	'ㅛㅕ',
	'ㅛㅗ',
	'ㅛㅣ',
	'ㅜㅏ',
	'ㅜㅐ',
	'ㅜㅓㅡ',
	'ㅜㅖ',
	'ㅜㅜ',
	'ㅠㅏ',
	'ㅠㅓ',
	'ㅠㅔ',
	'ㅠㅕ',
	'ㅠㅖ',
	'ㅠㅜ',
	'ㅠㅣ',
	'ㅡㅜ',
	'ㅡㅡ',
	'ㅡㅣㅜ',
	'ㅣㅏ',
	'ㅣㅑ',
	'ㅣㅗ',
	'ㅣㅜ',
	'ㅣㅡ',
	'ㅣㅏㅏ',
	'ㅏㅏ',
	'ㅏㅏㅓ',
	'ㅏㅏㅜ',
	'ㅏㅏㅣ',
	'ㅏㅏㅏㅏ',
	'ㅏㅡ',
	'ㅑㅜ',
	'ㅕㅑ',
	'ㅗㅑ',
	'ㅗㅒ',
	];

	/* 옛한글 중성 분해 테이블 (유니코드 5.2 추가 영역) */
	var _tableBP2 = [
	'ㅗㅕ',
	'ㅗㅗㅣ',
	'ㅛㅏ',
	'ㅛㅐ',
	'ㅛㅓ',
	'ㅜㅕ',
	'ㅜㅣㅣ',
	'ㅠㅐ',
	'ㅠㅗ',
	'ㅡㅏ',
	'ㅡㅓ',
	'ㅡㅔ',
	'ㅡㅗ',
	'ㅣㅑㅗ',
	'ㅣㅒ',
	'ㅣㅕ',
	'ㅣㅖ',
	'ㅣㅗㅣ',
	'ㅣㅛ',
	'ㅣㅠ',
	'ㅣㅣ',
	'ㅏㅏㅏ',
	'ㅏㅏㅔ',
	];

	/* 옛한글 종성 분해 테이블 (유니코드 5.2 추가 영역) */
	var _tableCP = [
	'ㄱ',
	'ㄲ',
	'ㄱㅅ',
	'ㄴ',
	'ㄴㅈ',
	'ㄴㅎ',
	'ㄷ',
	'ㄹ',
	'ㄹㄱ',
	'ㄹㅁ',
	'ㄹㅂ',
	'ㄹㅅ',
	'ㄹㅌ',
	'ㄹㅍ',
	'ㄹㅎ',
	'ㅁ',
	'ㅂ',
	'ㅂㅅ',
	'ㅅ',
	'ㅆ',
	'ㅇ',
	'ㅈ',
	'ㅊ',
	'ㅋ',
	'ㅌ',
	'ㅍ',
	'ㅎ',
	'ㄱㄹ',
	'ㄱㅅㄱ',
	'ㄴㄱ',
	'ㄴㄷ',
	'ㄴㅅ',
	'ㄴ\u1140',
	'ㄴㅌ',
	'ㄷㄱ',
	'ㄷㄹ',
	'ㄹㄱㅅ',
	'ㄹㄴ',
	'ㄹㄷ',
	'ㄹㄷㅎ',
	'ㄹㄹ',
	'ㄹㅁㄱ',
	'ㄹㅁㅅ',
	'ㄹㅂㅅ',
	'ㄹㅂㅎ',
	'ㄹㅂㅇ',
	'ㄹㅅㅅ',
	'ㄹ\u1140',
	'ㄹㅋ',
	'ㄹ\u1159',
	'ㅁㄱ',
	'ㅁㄹ',
	'ㅁㅂ',
	'ㅁㅅ',
	'ㅁㅅㅅ',
	'ㅁ\u1140',
	'ㅁㅊ',
	'ㅁㅎ',
	'ㅁㅇ',
	'ㅂㄹ',
	'ㅂㅍ',
	'ㅂㅎ',
	'ㅂㅇ',
	'ㅅㄱ',
	'ㅅㄷ',
	'ㅅㄹ',
	'ㅅㅂ',
	'\u1140',
	'ㅇㄱ',
	'ㅇㄱㄱ',
	'ㅇㅇ',
	'ㅇㅋ',
	'\u114C',
	'ㅇㅅ',
	'ㅇ\u1140',
	'ㅍㅂ',
	'ㅍㅇ',
	'ㅎㄴ',
	'ㅎㄹ',
	'ㅎㅁ',
	'ㅎㅂ',
	'\u1159',
	'ㄱㄴ',
	'ㄱㅂ',
	'ㄱㅊ',
	'ㄱㅋ',
	'ㄱㅎ',
	'ㄴㄴ',
	];

	/* 옛한글 종성 분해 테이블 (유니코드 5.2 추가 영역) */
	var _tableCP2 = [
	'ㄴㄹ',
	'ㄴㅊ',
	'ㄷㄷ',
	'ㄷㄷㅂ',
	'ㄷㅂ',
	'ㄷㅅ',
	'ㄷㅅㄱ',
	'ㄷㅈ',
	'ㄷㅊ',
	'ㄷㅌ',
	'ㄹㄱㄱ',
	'ㄹㄱㅎ',
	'ㄹㄹㅋ',
	'ㄹㅁㅎ',
	'ㄹㅂㄷ',
	'ㄹㅂㅍ',
	'ㄹㅇ',
	'ㄹ\u1159ㅎ',
	'ㄹㅇ',
	'ㅁㄴ',
	'ㅁㄴㄴ',
	'ㅁㅁ',
	'ㅁㅂㅅ',
	'ㅁㅈ',
	'ㅂㄷ',
	'ㅂㄹㅍ',
	'ㅂㅁ',
	'ㅂㅂ',
	'ㅂㅅㄷ',
	'ㅂㅈ',
	'ㅂㅊ',
	'ㅅㅁ',
	'ㅅㅂㅇ',
	'ㅅㅅㄱ',
	'ㅅㅅㄷ',
	'ㅅ\u1140',
	'ㅅㅈ',
	'ㅅㅊ',
	'ㅅㅌ',
	'ㅅㅎ',
	'\u1140ㅂ',
	'\u1140ㅂㅇ',
	'ㅇㅁ',
	'ㅇㅎ',
	'ㅈㅂ',
	'ㅈㅂㅂ',
	'ㅈㅈ',
	'ㅍㅅ',
	'ㅍㅌ',
	];

	for(var i in _tableAP) {
		var t = mapping(_tableAP[i], tableA);
		var u = String.fromCharCode(0x1113 + (i|0));
		if(t == u) continue;
		tableAP[t] = u;
		tablePA[u] = t;
	}
	for(var i in _tableAP2) {
		var t = mapping(_tableAP2[i], tableA);
		var u = String.fromCharCode(0xA960 + (i|0));
		if(t == u) continue;
		tableAP[t] = u;
		tablePA[u] = t;
	}
	for(var i in tableAShift) {
		if(tableA[i]) {
			tableAP[tableA[i] + '.'] = tableAShift[i];
		} else if(tableB[i]) {
			tableSP[tableB[i] + '.'] = tableAShift[i];
		}
	}
	tableAP['\u1109\u1109'] = '\u110A';
	tablePA['\u110A'] = '\u1109\u1109';

	for(var i in _tableBP) {
		var t = mapping(_tableBP[i], tableB);
		var u = String.fromCharCode(0x1161 + (i|0));
		if(t == u) continue;
		tableBP[t] = u;
		tablePB[u] = t;
	}
	for(var i in _tableBP2) {
		var t = mapping(_tableBP2[i], tableB);
		var u = String.fromCharCode(0xD7B0 + (i|0));
		if(t == u) continue;
		tableBP[t] = u;
		tablePB[u] = t;
	}
	for(var i in _tableCP) {
		var t = mapping(_tableCP[i], tableA);
		var u = String.fromCharCode(0x11A8 + (i|0));
		if(t == u) continue;
		tableCP[t] = u;
		if(t.indexOf('\u1140') >= 0) {
			tableCP[t.replace('\u1140', '\u1106.')] = u;
		} else if(t.indexOf('\u1159') >= 0) {
			tableCP[t.replace('\u1159', '\u1112.')] = u;
		}
		tablePC[u] = t;
	}
	for(var i in _tableCP2) {
		var t = mapping(_tableCP2[i], tableA);
		var u = String.fromCharCode(0xD7CB + (i|0));
		if(t == u) continue;
		tableCP[t] = u;
		if(t.indexOf('\u1140') >= 0) {
			tableCP[t.replace('\u1140', '\u1106.')] = u;
		} else if(t.indexOf('\u1159') >= 0) {
			tableCP[t.replace('\u1159', '\u1112.')] = u;
		}
		tablePC[u] = t;
	}
	for(var i in tableCShift) {
		tableCP[tableA[i] + '.'] = tableCShift[i];
	}

	tableCP['\u1109\u1109'] = '\u11BB';
	tablePC['\u11BB'] = '\u1109\u1109';

	function mapping(str, table) {
		for(var l = 2; l >= 0; l--) {
			for(var k in table) {
				if(k.length <= l) continue;
				str = str.split(k).join(table[k]);
			}
		}
		return str;
	}

	function splitComposition(str) {
		var chos = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
		var jungs = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
		var jongs = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
		function complexSyllable(code) {
			switch(code)
			{
				case 0x3133: return 'ㄱㅅ';
				case 0x3135: return 'ㄴㅈ';
				case 0x3136: return 'ㄴㅎ';
				case 0x313A: return 'ㄹㄱ';
				case 0x313B: return 'ㄹㅁ';
				case 0x313C: return 'ㄹㅂ';
				case 0x313D: return 'ㄹㅅ';
				case 0x313E: return 'ㄹㅌ';
				case 0x313F: return 'ㄹㅍ';
				case 0x3140: return 'ㄹㅎ';
				case 0x3144: return 'ㅂㅅ';
			}
			return null;
		}

		var ret = '';
		for(var i = 0; i < str.length; i++) {
			var code = str.charCodeAt(i);
			if(0xAC00 <= code && code < 0xD7A4) {
				var s = (code - 0xAC00);
				var c = s % 28;
				s = Math.floor(s / 28);
				var v = s % 21;
				s = Math.floor(s / 21);
				ret += chos[s];
				ret += jungs[v];
				if(c) ret += jongs[c];
			} else if(0x1100 <= code && code <= 0x1112) {
				ret += chos[code - 0x1100];
			} else if(0x1161 <= code && code <= 0x1175) {
				ret += jungs[code - 0x1161];
			} else if(0x11A8 <= code && code <= 0x11C2) {
				ret += jongs[code - 0x11A7];
			} else {
				var c = complexSyllable(code);
				if (c) ret += c;
				else ret += str.substr(i, 1);
			}
		}
		return ret;
	}

	function joinSyllable(str) {
		var ret = '';
		var stage = 0;
		var joining = 0;
		var temp = '';
		for(var i = 0; i < str.length; i++) {
			var code = str.charCodeAt(i);
			if(stage == 0 && 0x1100 <= code && code < 0x1100 + 19) {
				joining += (code - 0x1100) * 21 * 28;
				stage = 1;
				temp += str.substr(i, 1);
			} else if(stage == 1 && 0x1161 <= code && code < 0x1161 + 21) {
				joining += (code - 0x1161) * 28;
				stage = 2;
				temp += str.substr(i, 1);
			} else if(stage == 2 && 0x11A8 <= code && code < 0x11A7 + 28) {
				joining += code - 0x11A7;
				ret += String.fromCharCode(joining + 0xAC00);
				joining = 0;
				stage = 0;
				temp = '';
			} else {
				if(stage == 2 && !isCoda(code)) {
					ret += String.fromCharCode(joining + 0xAC00);
				} else {
					ret += temp;
				}
				temp = '';
				joining = 0;
				stage = 0x1100 <= code && code < 0x1100 + 19 ? 1 : 0;
				if(stage) {
					temp = str.substr(i, 1);
					joining += (code - 0x1100) * 21 * 28;
				} else {
					ret += str.substr(i, 1);
				}
			}
		}
		if(stage == 2) {
			ret += String.fromCharCode(joining + 0xAC00);
		} else {
			ret += temp + str.substr(i, 1);
		}
		return ret;
	}

	function reassemble(str, table1, table2) {
		var dis = '', ret = '';
		for(var i = 0; i < str.length; i++) {
			var c = str.substr(i, 1);
			dis += table1[c] ? table1[c] : c;
		}
		if(!table2) return dis;
		for(var i = dis.length; i > 0; i--) {
			var c = dis.substr(0, i);
			if(table2[c]) return table2[c] + dis.substr(i);
		}
		return dis;
	}

	function isOnset(c) {
		return (0x1100 <= c && c <= 0x115E) || (0xA960 <= c && c <= 0xA97F);
	}
	function isVowel(c) {
		return (0x1160 <= c && c <= 0x11A7) || (0xD7B0 <= c && c <= 0xD7C6);
	}
	function isCoda(c) {
		return (0x11A8 <= c && c <= 0x11FF) || (0xD7CB <= c && c <= 0xD7FF);
	}

    function getValFromTables(k, a, b, shifted) {
        if(b[k] && shifted) return b[k];
        return a[k] || null;
    }

	function akComposite(v, p, ch, shifted, compBegin, compEnd) {
        var inserted = null, prefix, suffix, curVal;
		if(compBegin == compEnd) {
			compBegin = compEnd = p;
		}
        if((inserted = getValFromTables(ch, tableA, tableAShift, shifted)) || '.' == (inserted = ch)) {
			var b = Math.max(compBegin, p - 1);
            prefix = v.substr(0, b);
            suffix = v.substr(p);
            curVal = v.substring(b, p);
            if(isVowel(curVal.charCodeAt(0))) {
                var combination = curVal + reassemble(inserted, tablePC, tableCP);
                if(!isOnset(prefix.charCodeAt(prefix.length - 1))) combination = reassemble(combination, {}, tableSP);
                curVal = prefix + combination + suffix;
            } else {
                var t1 = tablePA, t2 = tableAP;
                if(compBegin < p - 1 && isVowel(prefix.charCodeAt(p - 2))) {
                    t1 = tablePC, t2 = tableCP;
                }
                var r = reassemble(curVal + inserted, t1, t2);
                if(r.length > 1) {
                    compBegin = prefix.length + r.length - 1;
                }
                curVal = prefix + r + suffix;
            }
            p = compEnd = curVal.length - suffix.length;
        } else if((inserted = tableB[ch])) {
            if(!compEnd) {
                compBegin = p;
                p++;
                inserted = '\u115F' + inserted;
            }

			var b = Math.max(compBegin, p - 1);
            prefix = v.substr(0, b);
            suffix = v.substr(p);
            curVal = v.substring(b, p);
            if(isCoda(curVal.charCodeAt(0))) {
                var rt = reassemble(curVal, tablePC);
                prefix += reassemble(rt.substr(0, rt.length - 1), tablePC, tableCP);
                curVal = rt.substr(rt.length - 1);
                compBegin = prefix.length;
            }
            r = reassemble(curVal + inserted, tablePB, tableBP);
            if(r.length > 1) {
                if(isVowel(r.charCodeAt(0))) r = r.substr(0, 1) + '\u115F' + r.substr(1);
                compBegin = prefix.length + 1;
            }
            curVal = prefix + r + suffix;
            p = compEnd = curVal.length - suffix.length;
        } else {
            compEnd = 0;
            document.getElementById('log').textContent += ch + "(" + ch.charCodeAt(0) + ")\n";
            return null;
        }
        return [curVal, p, compBegin, compEnd];
    }

	function splitSyllable(str) {
		var ret = '';
		for(var i = 0; i < str.length; i++) {
			var code = str.charCodeAt(i);
			if(0xAC00 <= code && code < 0xD7A4) {
				var s = (code - 0xAC00);
				var c = s % 28;
				s = Math.floor(s / 28);
				var v = s % 21;
				s = Math.floor(s / 21);
				ret += String.fromCharCode(0x1100 + s);
				ret += String.fromCharCode(0x1161 + v);
				if(c) ret += String.fromCharCode(0x11A7 + c);
			} else {
				ret += str.substr(i, 1);
			}
		}
		return ret;
	}

	function findDelta(value, prevValue) {
		var delta = '';
		var deltaPos = -1;
		
		for (var i = 0; i < value.length; i++) {
			var str = value.substr(0, i) + 
				value.substr(i + value.length - prevValue.length);
			if (str === prevValue) {
				delta = value.substr(i, value.length - prevValue.length);
				deltaPos = i;
			}
		}
		return [delta, deltaPos, value.length - prevValue.length];
	}

	var isIE = /*@cc_on!@*/false || !!document.documentMode;
	var isEdge = !isIE && !!window.StyleMedia;
	var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
	var isFirefox = typeof InstallTrigger !== 'undefined';

	if (isEdge || isChrome || isFirefox) {
		$.fn.akInput = function(){
			if(!$("style#ak-global-stylesheet").length) {
				$("<style>").attr("id", "ak-global-stylesheet").html("@keyframes ak-caret {0% { background-color: #00f; }\n 20% { background-color: #00f; }\n 50% { background-color: #fff; }\n 80% { background-color: #00f; }\n 100% { background-color: #00f; }}").appendTo("head");
			}
	
			var receivers = [];
			this.each(function(){
				this.ak_shifted = false;
				this.ak_composite_state = 0;
				this.ak_comp_begin = 0;
				this.ak_comp_end = 0;
				this.akInputOn = true;
				var container = $('<div style="position:relative">');
				var receiver = $('<input style="position:absolute;z-index:-1;border:none;background:transparent;left:2px;right:2px;top:2px;">');
				var caret = $('<span style="position: absolute; top:1px; left:1px; animation: ak-caret 1s infinite; width:1px; height:1em; z-index:1;">');
				this.ak_receiver = receiver[0];
				this.ak_caret = caret[0];
	
				$(this).before(container);
				container.append($(this));
				container.append(receiver);
				container.append(caret);
				this.ak_receiver.ak_sender = this;
				receivers.push(this.ak_receiver);
			});
	
			receivers = $(receivers);
	
			function insertOne(target, inserted) {
				var receiver = $(target[0].ak_receiver);
				var v = target.val();
				var p = target.getCaretPos();
				target.val(v.substr(0, p) + inserted + v.substr(p));
				target.setCaretPos(p + inserted.length);
				receiver.val(" ");
			}
	
			function deleteOne(target) {
				var receiver = $(target[0].ak_receiver);
				var v = target.val();
				var p = target.getCaretPos();
				target.val(v.substr(0, p - 1) + v.substr(p));
				target.setCaretPos(p - 1);
				target[0].ak_comp_end = p - 1;
				if(target[0].ak_comp_begin > p - 1) target[0].ak_comp_begin = p - 1;
				receiver.val(" ");
			}
	
			function updatePseudoCaret(target) {
				var caret = $(target[0].ak_caret);
				var cp = getCaretCoordinates(target[0], target.getCaretPos());
				caret
					.css("left", cp.left - target.scrollLeft())
					.css("top", cp.top - target.scrollTop())
					.css("height", cp.height);
			}
	
			receivers.keydown(function(e){
				this.ak_sender.ak_shifted = e.shiftKey;
			}).keyup(function(e){
				this.ak_sender.ak_shifted = e.shiftKey;
			});
	
			function compStart(_this, data) {
				var sender = _this.ak_sender;
				sender.ak_composite_start = true;
				sender.ak_composite_before = '';
				sender.ak_composite_state = 1;
			}
	
			function compUpdate(_this, data) {
				var my = $(_this);
				var sender = _this.ak_sender;
				var data = splitComposition(data);
				var bf = sender.ak_composite_before;
				if (data.length < bf.length) {
					sender.ak_composite_update = false;
				} else {
					sender.ak_composite_update = data.substr(data.length - 1);
				}
				sender.ak_composite_before = data;
				my.val(" ");
	
				setTimeout(function(){
					var ch = sender.ak_composite_update;
					if (ch === false) {
						deleteOne($(sender));
						updatePseudoCaret($(sender));
						my.focus();
					}
					if (!ch) return;
					sender.ak_composite_update = '';
					sender.ak_composite_start = false;
					var v = $(sender).val();
					var p = $(sender).getCaretPos();
	
					var ret = akComposite(v, p, ch, sender.ak_shifted, sender.ak_comp_begin, sender.ak_comp_end);
					if (ret) {
						$(sender).val(ret[0]);
						$(sender).setCaretPos(ret[1]);
						sender.ak_comp_begin = ret[2];
						sender.ak_comp_end = ret[3];
						updatePseudoCaret($(sender));
						my.focus();
					}
				}, 5);
			}
	
			receivers.on('input', function(e){
				if (!this.ak_sender.akInputOn) return;
				var sender = this.ak_sender;
				var inserted = e.originalEvent.data;
				if(e.originalEvent.inputType == "insertLineBreak") {
					sender.ak_composite_state = 0;
					insertOne($(sender), "\n");
					updatePseudoCaret($(sender));
					$(this).focus();
				} else if (inserted == " ") {
					sender.ak_composite_state = 0;
					insertOne($(sender), inserted);
					updatePseudoCaret($(sender));
					$(this).focus();
				} else if (inserted == ".") {
					var v = $(sender).val();
					var p = $(sender).getCaretPos();
	
					var ret = akComposite(v, p, ".", false, sender.ak_comp_begin, sender.ak_comp_end);
					$(sender).val(ret[0]);
					$(sender).setCaretPos(ret[1]);
					sender.ak_comp_begin = ret[2];
					sender.ak_comp_end = ret[3];
					updatePseudoCaret($(sender));
					$(this).focus();
				} else if (sender.ak_composite_state == 0) {
					$(this).val(" ");
					if (inserted) {
						// inserted
						if (!/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(splitComposition(inserted))) {
							insertOne($(sender), inserted);
						}
					} else {
						// deleted
						deleteOne($(sender));
					}
					updatePseudoCaret($(sender));
					$(this).focus();
				}
			}).on('compositionstart', function(e){
				if (!this.ak_sender.akInputOn) return;
				compStart(this, e.originalEvent.data);
			}).on('compositionupdate', function(e){
				if (!this.ak_sender.akInputOn) return;
				compUpdate(this, e.originalEvent.data);
			}).on('compositionend', function(e){
				if (!this.ak_sender.akInputOn) return;
				var sender = this.ak_sender;
				$(this).val(" ");
				if (e.originalEvent.data) sender.ak_composite_update = '';
				else sender.ak_composite_update = false;
				sender.ak_composite_state = 0;
			}).on('keydown', function(e){
				if (!this.ak_sender.akInputOn) return;
				var sender = this.ak_sender;
				if (e.key == 'ArrowLeft') {
					var p = Math.max($(sender).getCaretPos() - 1, 0);
					$(sender).setCaretPos(p);
					sender.ak_comp_begin = p;
					sender.ak_comp_end = p;
					setTimeout(function(){updatePseudoCaret($(sender));}, 1);
				} else if (e.key == 'ArrowRight') {
					var p = Math.min($(sender).getCaretPos() + 1, $(sender).val().length);
					$(sender).setCaretPos(p);
					sender.ak_comp_begin = p;
					sender.ak_comp_end = p;
					setTimeout(function(){updatePseudoCaret($(sender));}, 1);
				}
			}).on('keypress', function(e){
			}).on('keyup', function(e){
				if (!this.ak_sender.akInputOn) return;
				var sender = this.ak_sender;
				if (e.key == 'Backspace') {
					if ($(this).val().length == 0) {
						deleteOne($(sender));
						updatePseudoCaret($(sender));
						$(this).focus();
					}
				}
			});
	
			this.click(function(){
				if (!this.akInputOn) return;
				updatePseudoCaret($(this));
				var p = $(this).getCaretPos();
				this.ak_comp_begin = p;
				this.ak_comp_end = p;
			}).keydown(function(){
				if (!this.akInputOn) return;
				var _this = $(this);
				setTimeout(function(){
					updatePseudoCaret(_this);
					var p = _this.getCaretPos();
					_this[0].ak_comp_begin = p;
					_this[0].ak_comp_end = p;
				}, 1);
			});
	
			this.on('input', function(e){
				if (!this.akInputOn) return;
				if(/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(e.originalEvent.data)) {
					var v = $(this).val();
					var p = $(this).getCaretPos();
					$(this).val(v.substr(0, p - 1) + v.substr(p));
					$(this).setCaretPos(p - 1);
					compStart(this.ak_receiver, "");
					compUpdate(this.ak_receiver, e.originalEvent.data);
				}
				updatePseudoCaret($(this));
				$(this.ak_receiver).focus();
			});
		};
	} else {
		$.fn.akInput = function(){
			this.each(function(){
				this.befVal = '';
				this.shifted = false;
				this.compBegin = 0;
				this.compEnd = 0;
				this.akInputOn = true;
			});
		
			this.keydown(function(e){
				if(e.keyCode == 16) this.shifted = true;
			}).keyup(function(e){
				if(e.keyCode == 16) this.shifted = false;
			});
			
			this.on('input', function(e){
				if(!this.akInputOn) return;
			
				var caretPos = $(this).getCaretPos();
				var curVal = splitSyllable($(this).val());
				if(this.befVal == curVal) return;
				var d = findDelta(curVal, this.befVal);
				//$('#st').append(d[0] + ',' + d[1] + ',' + d[2] + ': ');
				var ch = d[0];
				var inserted = null, prefix, suffix;
				if((inserted = getValFromTables(ch, tableA, tableAShift, this.shifted)) || '.' == (inserted = ch)) {
					if(!this.compEnd) {
						this.compBegin = this.caretPos;
					}
					prefix = curVal.substr(0, d[1] - 1);
					suffix = curVal.substr(d[1] + d[2]);
					curVal = curVal.substring(d[1] - 1, d[1]);
					if(isVowel(curVal.charCodeAt(0))) {
						var combination = curVal + reassemble(inserted, tablePC, tableCP);
						if(!isOnset(prefix.charCodeAt(prefix.length - 1))) combination = reassemble(combination, {}, tableSP);
						curVal = prefix + combination + suffix;
					} else {
						var t1 = tablePA, t2 = tableAP;
						if(this.compBegin < d[1]-1 && isVowel(prefix.charCodeAt(d[1]-2))) {
							t1 = tablePC, t2 = tableCP;
						}
						var r = reassemble(curVal + inserted, t1, t2);
						if(r.length > 1) {
							this.compBegin = prefix.length + r.length - 1;
						}
						curVal = prefix + r + suffix;
					}
					caretPos = this.compEnd = curVal.length - suffix.length;
					//$('#st').append(inserted + '(' + this.compBegin + ',' + this.compEnd + ')\n');
				} else if((inserted = tableB[ch])) {
					if(!this.compEnd) {
						this.compBegin = caretPos;
						caretPos++;
						inserted = '\u115F' + inserted;
					}
					prefix = curVal.substr(0, d[1] - 1);
					suffix = curVal.substr(d[1] + d[2]);
					curVal = curVal.substring(d[1] - 1, d[1]);
					if(isCoda(curVal.charCodeAt(0))) {
						var rt = reassemble(curVal, tablePC);
						prefix += reassemble(rt.substr(0, rt.length - 1), tablePC, tableCP);
						curVal = rt.substr(rt.length - 1);
						this.compBegin = prefix.length;
					}
					r = reassemble(curVal + inserted, tablePB, tableBP);
					if(r.length > 1) {
						if(isVowel(r.charCodeAt(0))) r = r.substr(0, 1) + '\u115F' + r.substr(1);
						this.compBegin = prefix.length + 1;
					}
					curVal = prefix + r + suffix;
					caretPos = this.compEnd = curVal.length - suffix.length;
					//$('#st').append(inserted + '(' + this.compBegin + ',' + this.compEnd + ')\n');
				} else {
					//$('#st').append('\n');
					if(d[2] >= 0) this.compEnd = 0;
				}
				curVal = curVal.replace(/\u115F([^\u1160-\u11A7\uD7B0-\uD7C6]|$)/g, '$1');
				this.befVal = curVal;
				//$('#st').append("update = " + curVal + "\n");
				if(inserted || d[2] < 0) {
					$(this).blur();
					$(this).val(joinSyllable(curVal));
					var _this = $(this);
					setTimeout(function(){_this.setCaretPos(caretPos);}, 0);
				}
			});
		};
	}
	
}());
