// Quản lý trạng thái dữ liệu (State)
const ModerationState = {
    activeLocation: 'all', // Giá trị bộ lọc vị trí
    showUnprocessed: true, // Trạng thái checkbox Chưa xử lý
    showDeleted: false,    // Trạng thái checkbox Đã xóa
    // Danh sách bình luận giả lập từ CSDL
    comments: [
        {
            id: 1001,
            locationId: 'bachthao',
            locationName: 'バックタオ公園',
            image: 'park1.jpg',
            userId: 'A9283',
            violationCount: 3,
            content: 'ここでのランニングは道が狭すぎて、歩行者が邪魔です。どいてほしい。',
            timestamp: '2024/05/20 14:30',
            status: 'unprocessed' 
        },
        {
            id: 1002,
            locationId: 'hoankiem',
            locationName: 'ホアンキエム湖',
            image: 'lake1.jpg',
            userId: 'K7731',
            violationCount: 1,
            content: 'ゴミが多すぎます。掃除してください。(スパム報告: 重複投稿)',
            timestamp: '2024/05/19 10:20',
            status: 'unprocessed'
        }
    ]
};

// Liên kết DOM
const DOM = {
    backBtn: document.querySelector('[data-id="1"]'),
    locFilterBtns: document.querySelectorAll('.loc-filter-btn'),
    chkUnprocessed: document.getElementById('filter-unprocessed'),
    chkDeleted: document.getElementById('filter-deleted'),
    commentsContainer: document.getElementById('comments-container')
};

// --- CÁC HÀM XỬ LÝ (LOGIC FUNCTIONS) ---

// 1. Nút quay lại
function goBackToDashboard() {
    console.log("Quay lại Bảng điều khiển quản trị (Dashboard).");
    // window.history.back();
}

// 6. Xử lý khi chọn bộ lọc Địa điểm
function handleLocationFilterClick(e) {
    // Đổi class active UI
    DOM.locFilterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Cập nhật State và render lại
    ModerationState.activeLocation = e.target.dataset.loc;
    renderComments();
}

// 8 & 9. Xử lý khi tick Checkbox Trạng thái
function handleStatusCheckboxChange() {
    ModerationState.showUnprocessed = DOM.chkUnprocessed.checked;
    ModerationState.showDeleted = DOM.chkDeleted.checked;
    renderComments();
}

// 19. Xử lý Xóa bình luận
function deleteComment(commentId) {
    const comment = ModerationState.comments.find(c => c.id === commentId);
    if (comment) {
        comment.status = 'deleted';
        console.log(`Đã XÓA bình luận ID: ${commentId}`);
        renderComments(); // Cập nhật lại UI lập tức
    }
}

// 20. Xử lý Khôi phục bình luận
function restoreComment(commentId) {
    const comment = ModerationState.comments.find(c => c.id === commentId);
    if (comment) {
        comment.status = 'unprocessed';
        console.log(`Đã KHÔI PHỤC bình luận ID: ${commentId}`);
        renderComments();
    }
}

// Hàm kết xuất (Render) Danh sách bình luận dựa trên bộ lọc
function renderComments() {
    DOM.commentsContainer.innerHTML = '';

    // Lọc dữ liệu theo state
    let filtered = ModerationState.comments.filter(c => {
        const matchLoc = (ModerationState.activeLocation === 'all') || (c.locationId === ModerationState.activeLocation);
        const matchStatus = (c.status === 'unprocessed' && ModerationState.showUnprocessed) || 
                            (c.status === 'deleted' && ModerationState.showDeleted);
        return matchLoc && matchStatus;
    });

    if (filtered.length === 0) {
        DOM.commentsContainer.innerHTML = '<p style="text-align:center; color:#999; font-size:12px;">条件に一致するコメントはありません。</p>';
        return;
    }

    // Nhóm bình luận theo địa điểm (Để hiển thị Tiêu đề địa điểm - Mục 10)
    const grouped = {};
    filtered.forEach(c => {
        if (!grouped[c.locationName]) grouped[c.locationName] = [];
        grouped[c.locationName].push(c);
    });

    // Tạo HTML cho từng nhóm
    for (const [locationName, comments] of Object.entries(grouped)) {
        
        // Mục 10: Tiêu đề địa điểm
        const locTitle = document.createElement('h3');
        locTitle.className = 'location-group-title';
        locTitle.setAttribute('data-id', '10');
        locTitle.innerHTML = `📍 ${locationName}`;
        DOM.commentsContainer.appendChild(locTitle);

        // Render các thẻ bình luận bên dưới tiêu đề này
        comments.forEach(c => {
            const card = document.createElement('div');
            card.className = 'comment-card';
            card.setAttribute('data-id', '11');

            const isDeleted = c.status === 'deleted';

            card.innerHTML = `
                <img src="${c.image}" class="card-img-top" data-id="12" alt="Spot Image">
                
                <div class="comment-card-body">
                    <div class="user-meta-row">
                        <div class="mod-avatar" data-id="13">👤</div>
                        <span class="mod-user-id" data-id="14">ユーザーID: ${c.userId}</span>
                        <span class="violation-badge" data-id="15">違反回数: ${c.violationCount}回</span>
                    </div>

                    <p class="comment-text-content" data-id="16" style="${isDeleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                        「${c.content}」
                    </p>

                    <div class="comment-time-loc">
                        <span data-id="17">🕒 ${c.timestamp}</span>
                        <span data-id="18">📁 ${c.locationName}</span>
                    </div>

                    <div class="card-actions-row">
                        <button class="btn-del-comment" data-id="19" onclick="deleteComment(${c.id})" ${isDeleted ? 'disabled' : ''}>削除</button>
                        <button class="btn-restore-comment" data-id="20" onclick="restoreComment(${c.id})" ${!isDeleted ? 'disabled' : ''}>復元</button>
                    </div>
                </div>
            `;
            DOM.commentsContainer.appendChild(card);
        });
    }
}

// --- KHỞI TẠO SỰ KIỆN (EVENT LISTENERS) ---
function initEventListeners() {
    DOM.backBtn.addEventListener('click', goBackToDashboard);

    DOM.locFilterBtns.forEach(btn => {
        btn.addEventListener('click', handleLocationFilterClick);
    });

    DOM.chkUnprocessed.addEventListener('change', handleStatusCheckboxChange);
    DOM.chkDeleted.addEventListener('change', handleStatusCheckboxChange);
}

// Khởi chạy hệ thống
document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    renderComments(); // Render lần đầu khi trang vừa load
});