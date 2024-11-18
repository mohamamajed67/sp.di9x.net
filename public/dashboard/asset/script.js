
function generateRandomPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}


async function applyAIDisplayNames() {
    const table = document.getElementById('dataTable');
    const rows = table.rows;
    const emailsAndNames = [];

    // Collect all emails and current display names
    for (let i = 1; i < rows.length; i++) {
        const email = rows[i].cells[1].innerHTML;
        const currentDisplayName = rows[i].cells[3].innerHTML;
        emailsAndNames.push({ email, currentDisplayName });
    }

    try {
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `Given the following list of email addresses and current display names, suggest professional and appropriate display names for each. Return only the suggested names in the same order, separated by newlines:
        ${emailsAndNames.map(item => `${item.email}, ${item.currentDisplayName}`).join('\n')}`
            }),
        });
        const data = await response.json();
        const newDisplayNames = data.answer.trim().split('\n');

        // Update table with new display names
        for (let i = 1; i < rows.length; i++) {
            rows[i].cells[3].innerHTML = newDisplayNames[i - 1].trim();
        }

        updateTextView();
        showStatusMessage('Display Names đã được cập nhật bằng AI!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Lỗi khi áp dụng AI cho Display Name', 'error');
    }
}


document.querySelectorAll('input[name="inputType"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const textarea = document.getElementById('emailInput');
        if (this.value === 'manual') {
            textarea.placeholder = "Nhập email và mật khẩu, mỗi cặp một dòng (ví dụ: example@domain.com,password123)";
        } else {
            textarea.placeholder = "Nhập danh sách email, mỗi email một dòng (ví dụ: example@domain.com)";
        }
    });
});

function processEmails() {
    const inputType = document.querySelector('input[name="inputType"]:checked').value;
    const emailInput = document.getElementById('emailInput').value.trim();
    const lines = emailInput.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        showStatusMessage('Vui lòng nhập dữ liệu!', 'error');
        return;
    }

    // Kiểm tra định dạng nhập liệu
    const hasInvalidFormat = lines.some(line => {
        if (inputType === 'manual') {
            // Kiểm tra nếu không có dấu phẩy trong chế độ nhập manual
            if (!line.includes(',')) {
                showStatusMessage('Lỗi: Trong chế độ "Nhập email và mật khẩu", mỗi dòng phải có định dạng "email,password"', 'error');
                return true;
            }
            const [email, password] = line.split(',').map(item => item.trim());
            if (!email || !password) {
                showStatusMessage('Lỗi: Email hoặc mật khẩu không được để trống', 'error');
                return true;
            }
        } else {
            // Kiểm tra nếu có dấu phẩy trong chế độ auto
            if (line.includes(',')) {
                showStatusMessage('Lỗi: Trong chế độ "Chỉ nhập email", mỗi dòng chỉ được phép nhập email', 'error');
                return true;
            }
        }
        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const email = inputType === 'manual' ? line.split(',')[0].trim() : line.trim();
        if (!emailRegex.test(email)) {
            showStatusMessage(`Lỗi: "${email}" không phải là địa chỉ email hợp lệ`, 'error');
            return true;
        }
        return false;
    });

    if (hasInvalidFormat) {
        return;
    }

    const sharedPassword = generateRandomPassword();
    const processedEmails = lines.map(line => {
        let email, password;
        
        if (inputType === 'manual') {
            [email, password] = line.split(',').map(item => item.trim());
        } else {
            email = line.trim();
            password = sharedPassword;
        }

        const [username, domain] = email.split('@');
        const displayName = username
            .split(/[._]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');

        return {
            domain,
            email,
            username,
            password,
            displayName,
            quota: '0'
        };
    });

    updateViews(processedEmails);
    showStatusMessage('Xử lý thành công!', 'success');
}

function updateViews(processedEmails) {
    // Cập nhật bảng
    const table = document.getElementById('dataTable');
    // Xóa các hàng cũ trừ header
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Thêm dữ liệu mới vào bảng
    processedEmails.forEach(({ domain, email, password, displayName, quota }) => {
        const row = table.insertRow();
        row.insertCell().textContent = domain;
        row.insertCell().textContent = email;
        row.insertCell().textContent = password;
        row.insertCell().textContent = displayName;
        row.insertCell().textContent = quota;
    });

    // Cập nhật text view
    const textView = document.getElementById('dataText');
    textView.value = processedEmails
        .map(({ domain, email, password, displayName, quota }) => {
            const quotaBytes = Math.round(parseFloat(quota) * 1024 * 1024 * 1024);
            return `${domain},${email},${password},${displayName},${quotaBytes}`;
        })
        .join('\n');
}

function clearTable() {
    const table = document.getElementById('dataTable');
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}

function clearText() {
    document.getElementById('dataText').value = '';
}

function addToTable(domain, username, email, password, displayName, quota) {
    const table = document.getElementById('dataTable');
    const row = table.insertRow(-1);
    row.insertCell(0).innerHTML = domain;
    row.insertCell(1).innerHTML = username;
    row.insertCell(2).innerHTML = password;
    row.insertCell(3).innerHTML = displayName;
    row.insertCell(4).innerHTML = quota;
}

function addToText(domain, email, password, displayName, quota) {
    const textArea = document.getElementById('dataText');
    const quotaBytes = Math.round(quota * 1024 * 1024 * 1024);
    const username = email.split('@')[0];
    const newLine = `${domain},${username},${password},${displayName},${quotaBytes}\n`;
    textArea.value += newLine;
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function downloadCSV() {
    const textArea = document.getElementById('dataText');
    const content = textArea.value;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "email_data.txt");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showStatusMessage('File TXT đã được tải xuống!', 'success');
    }
}

function applyAdvancedSettings() {
    const option = document.getElementById('advancedOption').value;
    const value = document.getElementById('advancedValue').value;
    const table = document.getElementById('dataTable');
    const rows = table.rows;

    if (option === 'quota') {
        const quotaOption = document.getElementById('quotaOption').value;
        if (quotaOption === 'fixed') {
            for (let i = 1; i < rows.length; i++) {
                rows[i].cells[4].innerHTML = value;
            }
        } else if (quotaOption === 'divide') {
            const totalQuota = parseFloat(value);
            const quotaPerEmail = totalQuota / (rows.length - 1);
            for (let i = 1; i < rows.length; i++) {
                rows[i].cells[4].innerHTML = quotaPerEmail.toFixed(2);
            }
        }
    } else {
        const columnIndex = option === 'password' ? 2 : (option === 'domain' ? 0 : -1);
        if (columnIndex !== -1) {
            for (let i = 1; i < rows.length; i++) {
                rows[i].cells[columnIndex].innerHTML = value;
                if (option === 'domain') {
                    const username = rows[i].cells[1].innerHTML;
                    rows[i].cells[0].innerHTML = value;
                }
            }
        }
    }

    updateTextView();
    showStatusMessage('Cài đặt đã được áp dụng!', 'success');
}

function updateTextView() {
    const table = document.getElementById('dataTable');
    const textArea = document.getElementById('dataText');
    textArea.value = '';

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const domain = row.cells[0].innerHTML;
        const username = row.cells[1].innerHTML;
        const password = row.cells[2].innerHTML;
        const displayName = row.cells[3].innerHTML;
        const quotaGB = parseFloat(row.cells[4].innerHTML);
        const quotaBytes = Math.round(quotaGB * 1024 * 1024 * 1024);
        const newLine = `${domain},${username},${password},${displayName},${quotaBytes}\n`;
        textArea.value += newLine;
    }
}

function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

document.getElementById('advancedOption').addEventListener('change', function () {
    const quotaOption = document.getElementById('quotaOption');
    quotaOption.style.display = this.value === 'quota' ? 'block' : 'none';
});

// Mở tab "Dạng Bảng" mặc định khi tải trang
document.addEventListener('DOMContentLoaded', function () {
    document.getElementsByClassName("tablinks")[0].click();
});
