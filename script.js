let board = null;
let game = new Chess();

const coachText = document.getElementById('coachText');
const moveHistory = document.getElementById('moveHistory');

// منع التحريك الخاطئ أو تحريك قطع الخصم
function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;

    const mode = document.getElementById('gameMode').value;
    if (mode === 'ai' && game.turn() === 'b') return false; // دور الكمبيوتر

    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

// تنفيذ نقلة الروبوت باستخدام Stockfish API
function makeAIMove() {
    if (game.game_over()) return;

    const depth = document.getElementById('difficulty').value;
    const fen = game.fen();

    fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.bestmove) {
                const bestMove = data.bestmove.split(' ')[1];
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                const promotion = bestMove.length > 4 ? bestMove.substring(4, 5) : 'q';

                game.move({ from: from, to: to, promotion: promotion });
                board.position(game.fen());
                updateStatus();
            } else {
                makeRandomMove();
            }
        })
        .catch(() => {
            makeRandomMove();
        });
}

// نقلة عشوائية كخيار احتياطي
function makeRandomMove() {
    const possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;
    const randomIdx = Math.floor(Math.random() * possibleMoves.length);
    game.move(possibleMoves[randomIdx]);
    board.position(game.fen());
    updateStatus();
}

// عند إسقاط القطعة في مكان جديد
function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    updateStatus();

    const mode = document.getElementById('gameMode').value;
    if (mode === 'ai' && !game.game_over()) {
        window.setTimeout(makeAIMove, 250);
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

// تحديث حالة اللعبة وسجل النقلات
function updateStatus() {
    const history = game.history();
    moveHistory.innerHTML = history.length ? history.join(', ') : 'لا توجد تحركات بعد.';

    if (game.in_checkmate()) {
        coachText.innerHTML = "<b>كش مات! 🎉</b> انتهت اللعبة.";
    } else if (game.in_draw()) {
        coachText.innerHTML = "<b>تعادل! 🤝</b>";
    } else if (game.in_check()) {
        coachText.innerHTML = "<b>⚠️ تنبيه: كش ملك!</b>";
    }
}

// طلب النصيحة والتحليل من المدرب الذكي
function askCoach() {
    if (game.game_over()) {
        coachText.innerHTML = "اللعبة منتهية حالياً!";
        return;
    }

    coachText.innerHTML = "جاري تحليل الموقف الحالي بواسطة الذكاء الاصطناعي... ⏳";

    const fen = game.fen();
    fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=10`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const bestMove = data.bestmove.split(' ')[1];
                const mate = data.mate;
                const evalVal = (data.evaluation !== undefined) ? (data.evaluation / 100).toFixed(1) : 0;

                let advice = `<b>💡 اقتراح المدرب:</b> أفضل نقلة لك الآن هي <b>${bestMove}</b>.<br>`;
                advice += `<b>📊 التقييم:</b> موقفك يعادل (${evalVal > 0 ? '+' + evalVal : evalVal}).`;

                if (mate) {
                    advice += `<br><b>🎯 كش مات قريب:</b> هناك كش مات خلال ${Math.abs(mate)} نقلات!`;
                }

                coachText.innerHTML = advice;
            } else {
                coachText.innerHTML = "تعذر الحصول على تحليل حالياً.";
            }
        })
        .catch(() => {
            coachText.innerHTML = "حدث خطأ أثناء الاتصال بالمدرب الذكي.";
        });
}

// التراجع عن النقلة
function undoMove() {
    game.undo();
    const mode = document.getElementById('gameMode').value;
    if (mode === 'ai') game.undo(); // تراجع عن حركة الكمبيوتر أيضاً
    board.position(game.fen());
    updateStatus();
}

// إعادة بدء اللعبة
function resetGame() {
    game.reset();
    board.start();
    coachText.innerHTML = "بدأت لعبة جديدة! حظاً موفقاً ♟️";
    updateStatus();
}

// تهيئة اللوحة عند التحميل
const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

board = Chessboard('myBoard', config);
$(window).resize(board.resize);
