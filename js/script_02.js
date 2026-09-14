
$(document).ready(function() {
    const CONFIG = { MAX_RING_SLOTS: 6, MAX_CARD_SKILLS: 4, MAX_CARD_TOTAL_LV: 9, MAX_CARD_SINGLE_LV: 5, BASE_SKILL_LV: 14, TARGET_SKILL_LV: 20 };
    const SKILLS = {
        active: ["격파쇄","백열격","돌진 격파","타격쇄","열파격", "질풍 난무","암격쇄","파동격","회전격","진동쇄","쾌유의 주문","충격 해제"],
        passive: ["생명의 축복","십자방어","보호진","고취의 주문","공격준비", "바람의 약속","격노의 주문","충격 적중","대지의 약속","생존의지"]
    };
    const ALL_SKILLS = [...SKILLS.active, ...SKILLS.passive];
    const DEFAULT_PRIORITY = {
        active: ["쾌유의 주문", "암격쇄", "회전격", "격파쇄"],
        passive: ["바람의 약속", "충격 적중", "공격준비", "고취의 주문"]
    };
    const FULL_DEFAULT_PRIORITY = [...new Set([...DEFAULT_PRIORITY.active, ...SKILLS.active, ...DEFAULT_PRIORITY.passive, ...SKILLS.passive])];
    const ARCANA = { "성배": ALL_SKILLS, "양피지": ["격파쇄","돌진 격파","열파격","암격쇄","회전격","파동격"], "나침반": ["백열격","타격쇄","쾌유의 주문","진동쇄","질풍 난무","충격 해제"], "종": ["생명의 축복","보호진","공격준비","격노의 주문","생존의지"], "거울": ["십자방어","고취의 주문","바람의 약속","대지의 약속","충격 적중"], "천칭": ALL_SKILLS };
    
    let userPriority = [];

    $('#togglePanel').on('click', function() {
        const isVisible = $('#fullHeader').is(':visible');
        $('#fullHeader').slideToggle();
        $(this).text(isVisible ? "▼ 펼치기" : "▲ 접기");
    });

    function initUI() {
        let $act = $('<div style="margin-bottom:8px;">').append('<b style="color:var(--accent); margin-right:10px;">[액티브]</b>');
        $.each(SKILLS.active, function(_, s) { $act.append(`<label style="margin-right:10px; cursor:pointer;"><input type="checkbox" class="chk-priority" value="${s}"> ${s}</label>`); });
        let $pas = $('<div>').append('<b style="color:lightgreen; margin-right:10px;">[패시브]</b>');
        $.each(SKILLS.passive, function(_, s) { $pas.append(`<label style="margin-right:10px; cursor:pointer;"><input type="checkbox" class="chk-priority" value="${s}"> ${s}</label>`); });
        $('#priorityCheckboxes').append($act, $pas);
    }

    $(document).on('change', '.chk-priority', function() {
        let s = $(this).val();
        if ($(this).is(':checked')) userPriority.push(s);
        else userPriority = userPriority.filter(v => v !== s);
        $('#userPriorityText').text(userPriority.length > 0 ? userPriority.join(" > ") : "기본 설정 사용 중")
                             .css('color', userPriority.length > 0 ? 'lightskyblue' : '#aaa');
    });

    function createArea(title, skillList, type) {
        let $box = $('<div>').addClass('box').attr('data-type', type).attr('data-name', title);
        let $header = $('<div>').addClass('box-header').append($('<b>').text(title), $('<button>').addClass('btn-reset').text('초기화').css({'background':'#555','color':'#fff','border':'none','padding':'3px 8px','cursor':'pointer','borderRadius':'3px'}));
        let $slotArea = $('<div>').addClass('slot-area');
        let $skillArea = $('<div>').addClass('skills');
        $box.append($header, $slotArea, $skillArea);
        $('#left').append($box);

        const updateTitle = () => {
            let cnt = $slotArea.children('.slot').length;
            let max = type === "ring" ? CONFIG.MAX_RING_SLOTS : CONFIG.MAX_CARD_SKILLS;
            let totalLv = 0; $slotArea.children().each(function(){ totalLv += parseInt($(this).attr('data-level')); });
            $box.find('b').text(`${title} (${cnt}/${max})`);
            $box.toggleClass('completed', type === "ring" ? cnt >= max : (cnt >= max || totalLv >= 9));
        };

        $.each(skillList, function(_, s) {
            $skillArea.append($('<div>').addClass('skill-btn').text(s).on('click', function() {
                if ($slotArea.find(`[data-skill="${s}"]`).length > 0 || $slotArea.children().length >= (type === "ring" ? CONFIG.MAX_RING_SLOTS : CONFIG.MAX_CARD_SKILLS)) return;
                addSlot($slotArea, s, type, updateTitle);
            }));
        });

        $box.find('.btn-reset').on('click', function() { $slotArea.empty(); updateButtons(); updateTitle(); calcTotal(); });
        updateTitle();
    }

    function addSlot($area, s, type, updater, lv = 1) {
        let $slot = $('<div>').addClass('slot').attr('data-skill', s).attr('data-level', lv).text(`${s} (${lv})`).toggleClass('max', lv >= 3);
        $slot.on('click', function() {
            if (type === "ring") return;
            let curLv = parseInt($(this).attr('data-level'));
            let boxTotal = 0; $area.children().each(function(){ boxTotal += parseInt($(this).attr('data-level')); });
            if (curLv < CONFIG.MAX_CARD_SINGLE_LV && boxTotal < CONFIG.MAX_CARD_TOTAL_LV) {
                curLv++; $(this).attr('data-level', curLv).text(`${s} (${curLv})`).toggleClass('max', curLv >= 3);
                updater(); calcTotal();
            }
        }).on('contextmenu', function(e) { e.preventDefault(); $(this).remove(); updateButtons(); updater(); calcTotal(); });
        $area.append($slot); updateButtons(); updater(); calcTotal();
    }

    function updateButtons() {
        $('.box').each(function() {
            let $b = $(this); $b.find('.skill-btn').each(function() {
                $(this).toggleClass('disabled', $b.find(`[data-skill="${$(this).text()}"]`).length > 0);
            });
        });
    }

    function calcTotal() {
        let html = ""; let prio = [...new Set([...userPriority, ...FULL_DEFAULT_PRIORITY])];
        $.each(prio, function(_, s) {
            let total = CONFIG.BASE_SKILL_LV;
            $(`.slot[data-skill="${s}"]`).each(function() { total += parseInt($(this).attr('data-level')); });
            let cls = total >= 20 ? "good" : (total >= 16 ? "warn" : "bad");
            html += `<div class="res-item ${cls}">${s} : ${total}</div>`;
        });
        $('#result').html(html);
    }

    // --- 추천 시스템 핵심 로직 ---
    const fillCard = ($b, p) => {
        let allowed = ARCANA[$b.data('name')];
        $.each(p, (i, s) => {
            if ($b.find('.slot').length >= 4) return false;
            if ($.inArray(s, allowed) !== -1 && getCurrentTotal(s) < 20) {
                addSlot($b.find('.slot-area'), s, "card", () => updateBoxTitle($b));
            }
        });
    };

    const upgradeCard = ($b, p) => {
        for(let i=0; i<20; i++){
            let up = false;
            $.each(p, (idx, s) => {
                let $s = $b.find(`[data-skill="${s}"]`);
                let boxTotal = 0; $b.find('.slot').each(function(){ boxTotal += parseInt($(this).attr('data-level')); });
                if ($s.length > 0 && parseInt($s.attr('data-level')) < 3 && boxTotal < 9 && getCurrentTotal(s) < 20) {
                    let lv = parseInt($s.attr('data-level')) + 1;
                    $s.attr('data-level', lv).text(`${s} (${lv})`).toggleClass('max', lv >= 3);
                    up = true; return false;
                }
            });
            if(!up) break;
        }
        updateBoxTitle($b);
    };

    const fillRing = ($b, p) => {
        $.each(p, (i, s) => {
            if ($b.find('.slot').length >= 6) return false;
            if ($.inArray(s, SKILLS.active) !== -1 && $b.find(`[data-skill="${s}"]`).length === 0 && getCurrentTotal(s) < 20) {
                addSlot($b.find('.slot-area'), s, "ring", () => updateBoxTitle($b));
            }
        });
    };

    const getCurrentTotal = (s) => {
        let t = CONFIG.BASE_SKILL_LV;
        $(`.slot[data-skill="${s}"]`).each(function(){ t += parseInt($(this).attr('data-level')); });
        return t;
    };

    const updateBoxTitle = ($b) => {
        let cnt = $b.find('.slot').length;
        let type = $b.data('type');
        let totalLv = 0; $b.find('.slot').each(function(){ totalLv += parseInt($(this).attr('data-level')); });
        $b.find('b').text(`${$b.data('name')} (${cnt}/${type==="ring"?6:4})`);
        $b.toggleClass('completed', type === "ring" ? cnt >= 6 : (cnt >= 4 || totalLv >= 9));
    };

    $('#btnCurrentRecommend').on('click', function() {
        let prio = [...new Set([...userPriority, ...FULL_DEFAULT_PRIORITY])];
        
        // 1. 카드 남은 자리 채우기 및 레벨업
        $.each(["천칭", "양피지", "나침반", "종", "거울", "성배"], (i, n) => {
            let $b = $(`.box[data-name="${n}"]`);
            fillCard($b, prio);
            upgradeCard($b, prio);
        });
        
        // 2. 반지 남은 자리 채우기
        $.each(["반지1", "반지2"], (i, n) => fillRing($(`.box[data-name="${n}"]`), prio));
        
        // 3. 최종 결과 재계산
        calcTotal();
    });

    $('#btnRecommend').on('click', function() {
        $('.btn-reset').click();
        let prio = [...new Set([...userPriority, ...FULL_DEFAULT_PRIORITY])];
        $.each(["천칭", "양피지", "나침반", "종", "거울", "성배"], (i, n) => {
            let $b = $(`.box[data-name="${n}"]`);
            fillCard($b, prio); upgradeCard($b, prio);
        });
        $.each(["반지1", "반지2"], (i, n) => fillRing($(`.box[data-name="${n}"]`), prio));
        calcTotal();
    });
    
    $('#btnDream').on('click', function() {
        $('.btn-reset').click();
        const data = {
            "반지1": { t:"ring", s: {"쾌유의 주문":1, "암격쇄":1, "돌진 격파":1, "타격쇄":1, "진동쇄":1, "백열격":1}},
            "반지2": { t:"ring", s: {"격파쇄":1, "회전격":1, "돌진 격파":1, "타격쇄":1, "진동쇄":1, "백열격":1}},
            "양피지": { t:"card", s: {"회전격":3, "암격쇄":2, "격파쇄":2, "돌진 격파":2}},
            "나침반": { t:"card", s: {"쾌유의 주문":3, "타격쇄":2, "진동쇄":2, "백열격":2}},
            "성배": { t:"card", s: {"격파쇄":3, "돌진 격파":2, "진동쇄":2, "백열격":2}},
            "천칭": { t:"card", s: {"암격쇄":3, "쾌유의 주문":2, "회전격":2, "타격쇄":2}},
            "종": { t:"card", s: {"공격준비":4, "생명의 축복":3, "대지의 약속":1, "보호진":1}},
            "거울": { t:"card", s: {"바람의 약속":4, "충격 적중":3, "십자방어":1, "고취의 주문":1}}
        };
        $.each(data, function(n, d) {
            let $b = $(`.box[data-name="${n}"]`);
            $.each(d.s, (sk, lv) => addSlot($b.find('.slot-area'), sk, d.t, () => updateBoxTitle($b), lv));
        });
        calcTotal();
    });
    
    // 전체 초기화 버튼 클릭 이벤트
    $('#btnAllReset').on('click', function() {
        if(confirm("모든 스킬 설정을 초기화하시겠습니까?")) {
            $('.btn-reset').click();
            
            $('.chk-priority').prop('checked', false);
            userPriority = [];
            $('#userPriorityText').text("기본 설정 사용 중").css('color', '#aaa');
            
            calcTotal();
            
            alert("초기화되었습니다.");
        }
    });

    // 모바일 결과창 접기/펼치기 기능 추가
    function initMobileToggle() {
        if ($(window).width() <= 768) {
            $('.right').addClass('collapsed'); // 기본적으로 접힌 상태로 시작
        }
    }

    $('.right h3').on('click', function() {
        if ($(window).width() <= 768) {
            $('.right').toggleClass('collapsed');
        }
    });

    // 윈도우 리사이즈 대응
    $(window).on('resize', function() {
        if ($(window).width() > 768) {
            $('.right').removeClass('collapsed');
        }
    });

    initMobileToggle(); // 실행
    
    initUI();
    createArea("반지1", SKILLS.active, "ring");
    createArea("반지2", SKILLS.active, "ring");
    $.each(ARCANA, (n, s) => createArea(n, s, "card"));
    calcTotal();
});
