// Enhance email processing
async function improveEmail() {
    const inputEmail = document.getElementById('input-email').value;
    const outputDiv = document.getElementById('output');
    const loading = document.getElementById('loading');

    if (!inputEmail.trim()) {
        showNotification('Vui lòng nhập nội dung email!', 'warning');
        return;
    }

    // Lấy style được chọn
    const selectedStyle = document.querySelector('.feature-card.active').dataset.style;

    // Chuyển đổi style sang tiếng Việt
    const styleMap = {
        'professional': 'chuyên nghiệp',
        'friendly': 'thân thiện',
        'formal': 'trang trọng',
        'easy to understand': 'Dễ hiểu'
    };

    loading.classList.add('show');
    outputDiv.value = '';

    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Viết lại lá mail sau đây theo phong cách ${styleMap[selectedStyle]}: "${inputEmail} ". Hoàn thiện email, không cần giải thích. (Nội dung mail "Chúng tôi" sẽ thay bằng "Mắt Bão")`
            })
        });

        const data = await response.json();
        const improvedEmail = data.answer;

        loading.classList.remove('show');

        // Enhanced typing effect
        let i = 0;
        const speed = 30;
        const typing = setInterval(() => {
            if (i < improvedEmail.length) {
                outputDiv.value += improvedEmail.charAt(i);
                outputDiv.scrollTop = outputDiv.scrollHeight;
                i++;
            } else {
                clearInterval(typing);
                showNotification('Email đã được tối ưu thành công!', 'success');
            }
        }, speed);

    } catch (error) {
        console.error('Error:', error);
        loading.classList.remove('show');
        showNotification('Có lỗi xảy ra khi xử lý email. Vui lòng thử lại sau.', 'error');
    }
}

// Enhanced Theme Toggle with smooth transitions
const themeToggle = document.querySelector('.theme-toggle');
let isDark = true;

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.add('transition-theme');
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');

    setTimeout(() => {
        document.body.classList.remove('transition-theme');
    }, 300);
});

// Notification System
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add notification to the DOM
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Enhanced copy functionality
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const action = this.querySelector('i').classList.contains('fa-copy') ? 'copy' :
            this.querySelector('i').classList.contains('fa-eraser') ? 'clear' : 'fullscreen';

        const textarea = this.closest('.email-container').querySelector('textarea');

        switch (action) {
            case 'copy':
                // Kiểm tra nếu không có nội dung
                if (!textarea.value.trim()) {
                    showNotification('Chưa có nội dung để sao chép!', 'warning');
                    return;
                }
                navigator.clipboard.writeText(textarea.value)
                    .then(() => showNotification('Đã sao chép vào clipboard!', 'success'))
                    .catch(() => showNotification('Không thể sao chép văn bản!', 'error'));
                break;
            case 'clear':
                // Kiểm tra nếu không có nội dung
                if (!textarea.value.trim()) {
                    showNotification('Không có nội dung để xóa!', 'warning');
                    return;
                }
                textarea.value = '';
                showNotification('Đã xóa nội dung!', 'success');
                break;
        }
    });
});

// Thêm vào phần script
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', function () {
        // Xóa active khỏi tất cả các card
        document.querySelectorAll('.feature-card').forEach(c => {
            c.classList.remove('active');
        });
        // Thêm active vào card được chọn
        this.classList.add('active');
    });
});

// Thêm code xử lý fullscreen
document.querySelector('.fullscreen-btn').addEventListener('click', function(e) {
    e.preventDefault(); // Ngăn chặn hành vi mặc định
    const originalOutput = document.querySelector('#output');
    
    // Kiểm tra nếu không có nội dung
    if (!originalOutput.value.trim()) {
        showNotification('Chưa có nội dung email để hiển thị!', 'warning');
        return;
    }
    
    const modal = document.querySelector('.fullscreen-modal');
    const fullscreenOutput = document.querySelector('#fullscreen-output');
    
    // Copy nội dung từ output gốc
    fullscreenOutput.value = originalOutput.value;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
});

document.querySelector('.close-modal').addEventListener('click', function(e) {
    e.preventDefault(); // Ngăn chặn hành vi mặc định
    const modal = document.querySelector('.fullscreen-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable scrolling
});

// Đóng modal khi click bên ngoài
document.querySelector('.fullscreen-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});