
$(document).ready(function() {
    const CONFIG = { MAX_RING_SLOTS: 6, MAX_CARD_SKILLS: 4, MAX_CARD_TOTAL_LV: 9, MAX_CARD_SINGLE_LV: 5, BASE_SKILL_LV: 14, TARGET_SKILL_LV: 20 };
    const SKILLS = {
        active: ["대지의 응보","심판의 번개","약화의 낙인","신성한 기운","고통의 연쇄", "벼락난사","단죄","벽력","재생의 빛","치유의 빛","쾌유의 광휘","충격 해제"],
        passive: ["따뜻한 가호","주신의 가호","주신의 은총","치유력 강화","불사의 장막", "회복 차단","집중의 기도","대지의 은총","생존 의지","찬란한 가호"]
    };
    const ALL_SKILLS = [...SKILLS.active, ...SKILLS.passive];
    const DEFAULT_PRIORITY = {
        active: ["쾌유의 광휘", "단죄", "재생의 빛", "신성한 기운", "치유의 빛", "심판의 번개", "대지의 응보", "약화의 낙인"],
        passive: ["치유력 강화", "대지의 은총", "불사의 장막", "따뜻한 가호"]
    };
    const FULL_DEFAULT_PRIORITY = [...new Set([...DEFAULT_PRIORITY.active, ...SKILLS.active, ...DEFAULT_PRIORITY.passive, ...SKILLS.passive])];
    const ARCANA = { "성배": ALL_SKILLS, "양피지": ["대지의 응보","약화의 낙인","고통의 연쇄","단죄","쾌유의 광휘","벽력"], "나침반": ["심판의 번개","신성한 기운","재생의 빛","치유의 빛","벼락난사","충격 해제"], "종": ["따뜻한 가호","주신의 은총","불사의 장막","집중의 기도","생존 의지"], "거울": ["주신의 가호","치유력 강화","회복 차단","찬란한 가호","대지의 은총"], "천칭": ALL_SKILLS };
    
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
            "반지1": { t:"ring", s: {"쾌유의 광휘":1, "단죄":1, "약화의 낙인":1, "신성한 기운":1, "치유의 빛":1, "심판의 번개":1}},
            "반지2": { t:"ring", s: {"대지의 응보":1, "재생의 빛":1, "약화의 낙인":1, "신성한 기운":1, "치유의 빛":1, "심판의 번개":1}},
            "양피지": { t:"card", s: {"쾌유의 광휘":3, "단죄":2, "대지의 응보":2, "약화의 낙인":2}},
            "나침반": { t:"card", s: {"재생의 빛":3, "신성한 기운":2, "치유의 빛":2, "심판의 번개":2}},
            "성배": { t:"card", s: {"대지의 응보":3, "약화의 낙인":2, "치유의 빛":2, "심판의 번개":2}},
            "천칭": { t:"card", s: {"단죄":3, "쾌유의 광휘":2, "재생의 빛":2, "신성한 기운":2}},
            "종": { t:"card", s: {"불사의 장막":5, "따뜻한 가호":2, "생존 의지":1, "주신의 은총":1}},
            "거울": { t:"card", s: {"치유력 강화":5, "대지의 은총":2, "주신의 가호":1, "찬란한 가호":1}}
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