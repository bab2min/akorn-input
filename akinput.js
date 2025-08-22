/**
jQuery용 옛한글 입력기 akorn input v0.3.0

email: bab2min@gmail.com
github: https://github.com/bab2min/akorn-input/
license: MIT License
**/

(function(){
    const isBrowser = (typeof window !== 'undefined');
    const isFirefox = (isBrowser && window.mozInnerScreenX != null);

    function getCaretPos(input) {
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
    }
    
    function setCaretPos(input, caretPos) {
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
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.innerText = str;
        const escaped = div.innerHTML;
        div.remove();
        return escaped;
    }

    function getOffset(el) {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY
        };
    }

    window.getCaretPos = getCaretPos;
    window.setCaretPos = setCaretPos;

    // 두 string인 oldStr와 newStr를 입력받아 차이를 찾아내는 함수
    // [operation, startOldIndex, endOldIndex, startNewIndex, endNewIndex]를 반환한다.
    // operation: 'insert', 'delete', 'replace' 중 하나
    // startOldIndex: 차이가 시작되는 oldStr의 인덱스
    // endOldIndex: 차이가 끝나는 oldStr의 인덱스
    // startNewIndex: 차이가 시작되는 newStr의 인덱스
    // endNewIndex: 차이가 끝나는 newStr의 인덱스
    // 만약 차이가 없다면 null을 반환한다.
    function findDiff(oldStr, newStr) {
        if (oldStr === newStr) return null;

        let startOld = 0, startNew = 0;
        let endOld = oldStr.length - 1, endNew = newStr.length - 1;

        // 앞에서부터 같은 부분 찾기
        while (
            startOld <= endOld &&
            startNew <= endNew &&
            oldStr[startOld] === newStr[startNew]
        ) {
            startOld++;
            startNew++;
        }

        // 뒤에서부터 같은 부분 찾기
        while (
            endOld >= startOld &&
            endNew >= startNew &&
            oldStr[endOld] === newStr[endNew]
        ) {
            endOld--;
            endNew--;
        }

        if (startOld > endOld && startNew <= endNew) {
            // insert
            return ['insert', startOld, endOld + 1, startNew, endNew + 1];
        } else if (startNew > endNew && startOld <= endOld) {
            // delete
            return ['delete', startOld, endOld + 1, startNew, endNew + 1];
        } else {
            // replace
            return ['replace', startOld, endOld + 1, startNew, endNew + 1];
        }
    }

    function addCompositionIgnoringInputListener(inputElement, callback, timeDelay) {
        const compositionDeletingThreshold = 10;

        if (typeof timeDelay === 'undefined') {
            timeDelay = 10; // Default delay of 10 milliseconds
        }
        inputElement.ignoringComposition = true; // Flag to indicate composition is being ignored
        
        inputElement.composingEvents = {};
        inputElement.lastValue = inputElement.value;
        inputElement.lastCompositionEndTime = 0;
        inputElement.addEventListener('beforeinput', function(event) {
            if (!this.ignoringComposition) return; // Ignore if not set to ignore composition
            const inputType = event.inputType;
            if (inputType == 'deleteContentBackward') {
                if (event.timeStamp < inputElement.lastCompositionEndTime + compositionDeletingThreshold) {
                    event.preventDefault();
                }
            }
        });

        function dispatch(event, inputType, trueValue) {
            // find difference between last value and current value
            const diff = findDiff(inputElement.lastValue, trueValue);
            if (!diff) return; // No difference found
            var value;
            if (diff[0] == 'insert') {
                if (inputType == 'deleteContentBackward') return;
                let delta = trueValue.slice(diff[3], diff[4]);
                // delete duplication bug
                if (delta.length == 2 && delta[0] == delta[1]) {
                    delta = delta[0];
                }
                value = callback({
                    type: 'insert',
                    start: diff[1],
                    end: diff[2],
                    lastValue: inputElement.lastValue,
                    value: delta,
                    event: event,
                });
            } else if (diff[0] == 'delete') {
                value = callback({
                    type: 'delete',
                    start: diff[1],
                    end: diff[2],
                    lastValue: inputElement.lastValue,
                    value: null,
                    event: event,
                });
            } else if (diff[0] == 'replace') {
                const delta = trueValue.slice(diff[3], diff[4]);
                value = callback({
                    type: 'replace',
                    start: diff[1],
                    end: diff[2],
                    lastValue: inputElement.lastValue,
                    value: delta,
                    event: event,
                });
            }

            inputElement.lastValue = typeof value === 'string' ? value : trueValue;
            if (typeof value === 'string') {
                setTimeout(() => {
                    inputElement.value = value;
                    inputElement.lastValue = value;
                }, 0);
            }
        }

        inputElement.addEventListener('input', function(event) {
            if (!this.ignoringComposition) return; // Ignore if not set to ignore composition
            const inputType = event.inputType;
            const trueValue = inputElement.value;
            //console.log(event, inputElement.lastValue, trueValue);
            if (inputType == 'insertText' || inputType == 'insertCompositionText' || inputType == 'insertLineBreak') {
                if (event.isComposing) {
                    setTimeout(function(){ 
                        inputElement.blur();
                        inputElement.focus();
                    }, timeDelay);
                    if (!isFirefox) { 
                        inputElement.composingEvents[event.data] = setTimeout(function(){
                            dispatch(event, inputType, trueValue);
                        }, timeDelay * 2);
                    }
                    return;
                }
            } else if (inputType == 'deleteContentBackward') {
                if (event.timeStamp < inputElement.lastCompositionEndTime + compositionDeletingThreshold) {
                    return;
                }
            } else {
                return;
            }
            if (!isFirefox) {
                if (inputElement.composingEvents[event.data]) {
                    clearTimeout(inputElement.composingEvents[event.data]);
                    delete inputElement.composingEvents[event.data];
                }
            }
            dispatch(event, inputType, trueValue);
        });

        inputElement.addEventListener('compositionend', function(event) {
            inputElement.lastCompositionEndTime = event.timeStamp;
        });
    }

    function enableCompositionIgnoringInput(inputElement) {
        if (!inputElement) return;
        inputElement.ignoringComposition = true; // Set flag to ignore composition
        inputElement.lastValue = inputElement.value; // Initialize lastValue
    }

    function disableCompositionIgnoringInput(inputElement) {
        if (!inputElement) return;
        inputElement.ignoringComposition = false; // Clear flag to stop ignoring composition
        inputElement.lastValue = inputElement.value; // Reset lastValue
    }

    window.addCompositionIgnoringInputListener = addCompositionIgnoringInputListener;
    window.enableCompositionIgnoringInput = enableCompositionIgnoringInput;
    window.disableCompositionIgnoringInput = disableCompositionIgnoringInput;

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
    const tableAP = {}, tablePA = {};
    const tableBP = {}, tablePB = {};
    const tableCP = {}, tablePC = {};
    const tableSP = {};

    /* 자음(초성) -> 옛한글 매핑 테이블 */
    const tableA = {
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
    const tableAShift = {
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
    const tableB = {
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
    const tableC = {
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
    const tableCShift = {
        '\u3141':'\u11EB',
        '\u3147':'\u11F0',
        '\u314E':'\u11F9',
    };

    function initTable() {
        /* 옛한글 초성 분해 테이블 */
        const _tableAP = [
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
        const _tableAP2 = [
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
        const _tableBP = [
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
        const _tableBP2 = [
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
        const _tableCP = [
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
        const _tableCP2 = [
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

        function mapping(str, table) {
            for (var l = 2; l >= 0; l--) {
                for (var k in table) {
                    if(k.length <= l) continue;
                    str = str.split(k).join(table[k]);
                }
            }
            return str;
        }

        for (var i in _tableAP) {
            var t = mapping(_tableAP[i], tableA);
            var u = String.fromCharCode(0x1113 + (i|0));
            if (t == u) continue;
            tableAP[t] = u;
            tablePA[u] = t;
        }
        for (var i in _tableAP2) {
            var t = mapping(_tableAP2[i], tableA);
            var u = String.fromCharCode(0xA960 + (i|0));
            if (t == u) continue;
            tableAP[t] = u;
            tablePA[u] = t;
        }
        for (var i in tableAShift) {
            if (tableA[i]) {
                tableAP[tableA[i] + '.'] = tableAShift[i];
            } else if (tableB[i]) {
                tableSP[tableB[i] + '.'] = tableAShift[i];
            }
        }
        tableAP['\u1109\u1109'] = '\u110A';
        tablePA['\u110A'] = '\u1109\u1109';

        tableAP['\u113C.'] = '\u113D';
        tableAP['\u113E.'] = '\u113F';
        tableAP['\u114E.'] = '\u114F';
        tableAP['\u1150.'] = '\u1151';

        for (var i in _tableBP) {
            var t = mapping(_tableBP[i], tableB);
            var u = String.fromCharCode(0x1161 + (i|0));
            if (t == u) continue;
            tableBP[t] = u;
            tablePB[u] = t;
        }
        for (var i in _tableBP2) {
            var t = mapping(_tableBP2[i], tableB);
            var u = String.fromCharCode(0xD7B0 + (i|0));
            if (t == u) continue;
            tableBP[t] = u;
            tablePB[u] = t;
        }
        for (var i in _tableCP) {
            var t = mapping(_tableCP[i], tableA);
            var u = String.fromCharCode(0x11A8 + (i|0));
            if (t == u) continue;
            tableCP[t] = u;
            if (t.indexOf('\u1140') >= 0) {
                tableCP[t.replace('\u1140', '\u1106.')] = u;
            } else if (t.indexOf('\u1159') >= 0) {
                tableCP[t.replace('\u1159', '\u1112.')] = u;
            }
            tablePC[u] = t;
        }
        for (var i in _tableCP2) {
            var t = mapping(_tableCP2[i], tableA);
            var u = String.fromCharCode(0xD7CB + (i|0));
            if (t == u) continue;
            tableCP[t] = u;
            if (t.indexOf('\u1140') >= 0) {
                tableCP[t.replace('\u1140', '\u1106.')] = u;
            } else if (t.indexOf('\u1159') >= 0) {
                tableCP[t.replace('\u1159', '\u1112.')] = u;
            }
            tablePC[u] = t;
        }
        for (var i in tableCShift) {
            tableCP[tableA[i] + '.'] = tableCShift[i];
        }

        tableCP['\u1109\u1109'] = '\u11BB';
        tablePC['\u11BB'] = '\u1109\u1109';
    }
    initTable();

    function reassemble(str, tableDec, tableCom) {
        var dis = '';
        for (var i = 0; i < str.length; i++) {
            var c = str.slice(i, i + 1);
            dis += tableDec[c] ? tableDec[c] : c;
        }
        if (!tableCom) return dis;
        for (var i = dis.length; i > 0; i--) {
            var c = dis.slice(0, i);
            if (tableCom[c]) return tableCom[c] + dis.slice(i);
        }
        return dis;
    }

    function deleteUnit(str, tableDec, tableCom) {
        var dec = tableDec[str] ? tableDec[str] : str;
        dec = dec.slice(0, -1);
        return tableCom[dec] ? tableCom[dec] : dec;
    }

    function normalizeModernHangul(str) {
        return str.replace(/([\u1100-\u1112][\u1161-\u1174][\u11A8-\u11C2])|([\u1100-\u1112][\u1161-\u1174](?![\u113C-\u11FF\uD7B0-\uD7FF]))/g, function(m){
            return m.normalize();
          });
    }

    function isOnset(c) {
        return (0x1100 <= c && c <= 0x115E) || (0xA960 <= c && c <= 0xA97F);
    }
    function isVowel(c) {
        return (0x1161 <= c && c <= 0x11A7) || (0xD7B0 <= c && c <= 0xD7C6);
    }
    function isCoda(c) {
        return (0x11A8 <= c && c <= 0x11FF) || (0xD7CB <= c && c <= 0xD7FF);
    }

    function getValFromTables(k, a, b, shifted) {
        if (b[k] && shifted) return b[k];
        return a[k] || null;
    }

    function akComposite(text, insertPosition, chr, shifted, compBegin) {
        //console.log('akComposite', {text: text, insertPosition: insertPosition, chr: chr, shifted: shifted, compBegin: compBegin});
        var inserted = null, prefix, suffix, composing, final;
        if ((inserted = getValFromTables(chr, tableA, tableAShift, shifted)) || '.' == (inserted = chr)) {
            // if compBegin is null, set it to the current insertPosition
            if (compBegin == null) {
                compBegin = insertPosition;
            }
            prefix = text.slice(0, compBegin);
            suffix = text.slice(insertPosition);
            composing = text.substring(compBegin, insertPosition);
            if (composing && isVowel(composing.charCodeAt(composing.length - 1))) {
                var combination = composing + reassemble(inserted, tablePC, tableCP);
                if (!isOnset(prefix.charCodeAt(prefix.length - 1))) combination = reassemble(combination, {}, tableSP);
                final = prefix + combination + suffix;
            } else {
                if (composing.charCodeAt(composing.length - 1) == 0x1160) {
                    // remove HJF
                    composing = composing.slice(0, -1);
                }
                var t1 = tablePA, t2 = tableAP;
                if (isCoda(composing.charCodeAt(composing.length - 1))) {
                    t1 = tablePC, t2 = tableCP;
                }
                var r = reassemble(composing.slice(-1) + inserted, t1, t2);
                if (r.length > 1) {
                    // composing new syllable
                    compBegin = prefix.length + composing.length;
                    if (isOnset(r.charCodeAt(0)) && isOnset(r.charCodeAt(1))) {
                        // insert HJF
                        r = r.slice(0, 1) + '\u1160' + r.slice(1);
                        compBegin += 1;
                    }
                }
                if (isOnset(r.charCodeAt(r.length - 1))) {
                    // insert HJF
                    r += '\u1160';
                }
                final = prefix + composing.slice(0, -1) + r + suffix;
            }
        } else if ((inserted = tableB[chr])) {
            if (compBegin == null) {
                // insert HCF
                compBegin = insertPosition;
                insertPosition++;
                inserted = '\u115F' + inserted;
            }

            prefix = text.slice(0, compBegin);
            suffix = text.slice(insertPosition);
            composing = text.substring(compBegin, insertPosition);
            if (composing.charCodeAt(composing.length - 1) == 0x1160) {
                // remove HJF
                composing = composing.slice(0, -1);
            }

            if (isCoda(composing.charCodeAt(composing.length - 1))) {
                var rt = reassemble(composing.slice(-1), tablePC);
                prefix += composing.slice(0, composing.length - 1) + reassemble(rt.slice(0, rt.length - 1), tablePC, tableCP);
                composing = rt.slice(rt.length - 1);
                compBegin = prefix.length;
            }

            r = reassemble(composing.slice(-1) + inserted, tablePB, tableBP);
            if (r.length > 1 && isVowel(r.charCodeAt(0))) {
                // composing new syllable
                compBegin = prefix.length + composing.length;
                r = r.slice(0, 1) + '\u115F' + r.slice(1);
            }
            final = prefix + composing.slice(0, -1) + r + suffix;
        } else {
            prefix = text.slice(0, insertPosition);
            suffix = text.slice(insertPosition);
            const normalized = normalizeModernHangul(prefix);
            if (normalized == prefix) return null;
            return {
                text: normalized + chr + suffix,
                position: normalized.length + chr.length,
                compBegin: null,
            }
        }
        const normalized = normalizeModernHangul(final.slice(0, compBegin));
        final = normalized + final.slice(compBegin);
        insertPosition = final.length - suffix.length;
        compBegin = normalized.length;
        //console.log('akComposite result', {final: final, insertPosition: insertPosition, compBegin: compBegin});
        return {
            text: final,
            position: insertPosition,
            compBegin: compBegin,
        }
    }

    function akDeleteOne(text, deletePosition, compBegin) {
        const code = text.charCodeAt(deletePosition);
        var newPosition;
        if (compBegin == null) {
            const deleted = text.slice(0, deletePosition + 1).replace(/[\u1100-\u115F\uA960-\uA97F][\u1160-\u11A7\uD7B0-\uD7C6][\u11A8-\u11FF\uD7CB-\uD7FF]?$/, '');
            if (deleted.length <= deletePosition) {
                text = deleted + text.slice(deletePosition + 1);
                newPosition = deleted.length;
            } else {
                text = text.slice(0, deletePosition) + text.slice(deletePosition + 1);
                newPosition = deletePosition;
            }
        } else {
            if (isOnset(code) || code == 0x1160) {
                if (code == 0x1160) {
                    text = text.slice(0, deletePosition) + text.slice(deletePosition + 1);
                    deletePosition -= 1;
                }
                var deleted = deleteUnit(text.slice(deletePosition, deletePosition + 1), tablePA, tableAP);
                if (deleted && code == 0x1160) {
                    deleted += '\u1160';
                }
                text = text.slice(0, deletePosition) + deleted + text.slice(deletePosition + 1);
                newPosition = deletePosition + deleted.length;
            } else if (isVowel(code)) {
                var deleted = deleteUnit(text.slice(deletePosition, deletePosition + 1), tablePB, tableBP);
                if (!deleted && deletePosition > 0) {
                    if (text.charCodeAt(deletePosition - 1) == 0x115F) {
                        text = text.slice(0, deletePosition - 1) + text.slice(deletePosition + 1);
                        newPosition = deletePosition - 1;
                    } else if (isOnset(text.charCodeAt(deletePosition - 1))) {
                        // 중성을 지울때는 중성 채움 문자를 넣어준다.
                        text = text.slice(0, deletePosition) + '\u1160' + text.slice(deletePosition + 1);
                        newPosition = deletePosition + 1;
                    }
                } else {
                    text = text.slice(0, deletePosition) + deleted + text.slice(deletePosition + 1);
                    newPosition = deletePosition + deleted.length;
                }
            } else if (isCoda(code)) {
                var deleted = deleteUnit(text.slice(deletePosition, deletePosition + 1), tablePC, tableCP);
                text = text.slice(0, deletePosition) + deleted + text.slice(deletePosition + 1);
                newPosition = deletePosition + deleted.length;
            } else {
                text = text.slice(0, deletePosition) + text.slice(deletePosition + 1);
                newPosition = deletePosition;
            }
        }

        return {
            text: text,
            position: newPosition,
        };
    }

    function makeAkInput(element, options) {
        if (!element) return;
        if (typeof options === 'undefined') options = {};
        if (typeof options.displayComposing === 'undefined') options.displayComposing = true;

        element.akShifted = false;
        element.akCompBegin = null;
        element.akInputOn = true;
        const timeDelay = 10;

        function onInput(event) {
            if (event.type == 'insert') {
                const ret = akComposite(
                    element.lastValue, 
                    event.start, 
                    event.value, 
                    element.akShifted, 
                    element.akCompBegin);
                //console.log('onInput', event, ret);
                if (ret) {
                    setTimeout(function() {
                        setCaretPos(element, ret.position);
                        updateSurrogateDiv(element);
                    }, timeDelay);
                    element.akCompBegin = ret.compBegin;
                    return ret.text;
                } else {
                    element.akCompBegin = null;
                    updateSurrogateDiv(element);
                }
            } else if (event.type == 'delete') {
                if (event.start + 1 == event.end) {
                    const ret = akDeleteOne(event.lastValue, event.start, element.akCompBegin);
                    //console.log('onInput', event, ret);
                    setTimeout(function() {
                        setCaretPos(element, ret.position);
                        updateSurrogateDiv(element);
                    }, timeDelay);
                    return ret.text;
                }
            } else if (event.type == 'replace') {
                //console.log('onInput', event, element.value);
                if (event.value.length == 1 && (event.event.inputType == 'insertText' || event.event.inputType == 'insertCompositionText')) {
                    const lastValue = event.lastValue.slice(0, event.start) + event.lastValue.slice(event.end);
                    const ret = akComposite(
                        lastValue, 
                        event.start, 
                        event.value, 
                        element.akShifted, 
                        element.akCompBegin);
                     if (ret) {
                        setTimeout(function() {
                            setCaretPos(element, ret.position);
                            updateSurrogateDiv(element);
                        }, timeDelay);
                        element.akCompBegin = ret.compBegin;
                        return ret.text;
                    }
                }
                element.akCompBegin = null;
                updateSurrogateDiv(element);
            }
        }

        function onKeyDown(event) {
            if (!element.akInputOn) return;
            element.akShifted = event.shiftKey;
        }

        function onKeyUp(event) {
            if (!element.akInputOn) return;
            element.akShifted = event.shiftKey;
            if (event.key == 'Backspace') {
                //console.log(event);
                const p = getCaretPos(element);
                if (p <= element.akCompBegin) element.akCompBegin = null;
            } else if (event.key == 'ArrowLeft' || event.key == 'ArrowRight' || event.key == 'ArrowUp' || event.key == 'ArrowDown'
                || event.key == 'Home' || event.key == 'End' || event.key == 'PageUp' || event.key == 'PageDown'
            ) {
                element.akCompBegin = null;
            }
            updateSurrogateDiv(element);
        }

        function onClick(event) {
            if (!element.akInputOn) return;
            element.akCompBegin = null;
            updateSurrogateDiv(element);
        }

        addCompositionIgnoringInputListener(element, onInput);
        element.addEventListener('keydown', onKeyDown);
        element.addEventListener('keyup', onKeyUp);
        element.addEventListener('click', onClick);

        function createSurrogateDiv(element) {
            const div = document.createElement('div');
            document.body.appendChild(div);
            div.classList.add('ak-input-surrogate');
            const style = div.style;
            const isInput = element.nodeName === 'INPUT';

            if (!document.querySelector('#ak-global-style')) {
                const style = document.createElement('style');
                style.id = 'ak-global-style';
                style.innerHTML = '.ak-input-surrogate {position: absolute; border-color: transparent; color: transparent; background: none; visibility: hidden;} .ak-input-surrogate span {visibility: visible; border-bottom: 1px solid rgba(0, 0, 0, 0.8);}';
                document.head.appendChild(style);
            }

            // Default textarea styles
            style.whiteSpace = 'pre-wrap';
            if (!isInput) style.wordWrap = 'break-word';  // only for textarea-s

            // Position off-screen
            style.position = 'absolute';  // required to return coordinates properly
            return div;
        }

        function updateSurrogateDiv(element) {
            const properties = [
                'direction',  // RTL support
                'boxSizing',
                'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
                'height',
                'overflowX',
                'overflowY',  // copy the scrollbar for IE

                'borderTopWidth',
                'borderRightWidth',
                'borderBottomWidth',
                'borderLeftWidth',
                'borderStyle',

                'paddingTop',
                'paddingRight',
                'paddingBottom',
                'paddingLeft',

                // https://developer.mozilla.org/en-US/docs/Web/CSS/font
                'fontStyle',
                'fontVariant',
                'fontWeight',
                'fontStretch',
                'fontSize',
                'fontSizeAdjust',
                'lineHeight',
                'fontFamily',

                'textAlign',
                'textTransform',
                'textIndent',
                'textDecoration',  // might not make a difference, but better be safe

                'letterSpacing',
                'wordSpacing',

                'tabSize',
                'MozTabSize'
            ];
            if (!element.akSurrogateDiv) return;
            const style = element.akSurrogateDiv.style;
            const isInput = element.nodeName === 'INPUT';
            const computed = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;  // currentStyle for IE < 9
            // Transfer the element's properties to the div
            properties.forEach(function (prop) {
                if (isInput && prop === 'lineHeight') {
                // Special case for <input>s because text is rendered centered and line height may be != height
                    if (computed.boxSizing === "border-box") {
                        var height = parseInt(computed.height);
                        var outerHeight =
                            parseInt(computed.paddingTop) +
                            parseInt(computed.paddingBottom) +
                            parseInt(computed.borderTopWidth) +
                            parseInt(computed.borderBottomWidth);
                        var targetHeight = outerHeight + parseInt(computed.lineHeight);
                        if (height > targetHeight) {
                            style.lineHeight = height - outerHeight + "px";
                        } else if (height === targetHeight) {
                            style.lineHeight = computed.lineHeight;
                        } else {
                            style.lineHeight = 0;
                        }
                    } else {
                        style.lineHeight = computed.height;
                    }
                } else {
                    style[prop] = computed[prop];
                }
            });

            if (isFirefox) {
                // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
                if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
            } else {
                style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
            }
            
            const offset = getOffset(element);
            style.left = offset.left + 'px';
            style.top = offset.top + 'px';

            if (element.akCompBegin == null) {
                element.akSurrogateDiv.innerText = "";
            } else {
                const caret = getCaretPos(element);
                element.akSurrogateDiv.innerHTML = escapeHTML(element.value.slice(0, element.akCompBegin)) + '<span>' + escapeHTML(element.value.slice(element.akCompBegin, caret)) + '</span>';
            }
            
        }

        if (options.displayComposing) {
            element.akSurrogateDiv = createSurrogateDiv(element);
        }
    }

    function enableAkInput(element) {
        if (element.akInputOn) return;
        element.akInputOn = true;
        enableCompositionIgnoringInput(element);
    }

    function disableAkInput(element) {
        if (!element.akInputOn) return;
        element.akInputOn = false;
        disableCompositionIgnoringInput(element);
    }

    window.makeAkInput = makeAkInput;
    window.enableAkInput = enableAkInput;
    window.disableAkInput = disableAkInput;
}());
