function generateRandomPassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    // Đảm bảo mật khẩu có ít nhất 1 ký tự đặc biệt và 1 số
    let password =
        uppercase[Math.floor(Math.random() * uppercase.length)] +
        lowercase[Math.floor(Math.random() * lowercase.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        symbols[Math.floor(Math.random() * symbols.length)];

    // Thêm các ký tự ngẫu nhiên cho đến đủ độ dài
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Trộn ngẫu nhiên các ký t trong mật khẩu
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

function validateEmail(email) {
    // Regular expression cho định dạng email
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

function processEmails() {
    const emails = document.getElementById('emailInput').value.split('\n').filter(email => email.trim());
    const table = document.getElementById('dataTable');
    const textArea = document.getElementById('dataText');
    const statusMessage = document.getElementById('statusMessage');

    // Kiểm tra nếu không có email nào được nhập
    if (emails.length === 0) {
        statusMessage.textContent = 'Vui lòng nhập ít nhất một email!';
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
        return;
    }

    // Kiểm tra định dạng của tất cả email
    const invalidEmails = emails.filter(email => !validateEmail(email.trim()));
    if (invalidEmails.length > 0) {
        statusMessage.innerHTML = `Các email sau không đúng định dạng:<br>${invalidEmails.join('<br>')}`;
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
        return;
    }

    // Xóa dữ liệu cũ
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    const sharedPassword = generateRandomPassword();
    let textOutput = '';

    emails.forEach((email, index) => {
        if (email.trim()) {
            const name_folder = 'duytv';
            const path = `/config/workspace/<span class="highlight-value">${name_folder}</span>/oauth2/tokens/oauth2_tokens_<span class="highlight-value">${email}</span>.txt`;

            const row = table.insertRow(-1);
            row.insertCell(0).textContent = index + 1;
            row.insertCell(1).textContent = email;
            row.insertCell(2).innerHTML = path;
            row.insertCell(3).textContent = sharedPassword;

            const plainPath = `/config/workspace/${name_folder}/oauth2/tokens/oauth2_tokens_${email}.txt`;
            textOutput += `${email}|${plainPath}|${email}|${sharedPassword}\n`;
        }
    });

    textArea.value = textOutput;

    // Hiển thị thông báo thành công
    statusMessage.textContent = 'Xử lý email thành công!';
    statusMessage.className = 'success';
    statusMessage.style.display = 'block';

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

function openTab(evt, viewType) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(viewType).style.display = "block";
    evt.currentTarget.className += " active";
}

function downloadTXT() {
    const text = document.getElementById('dataText').value;
    const statusMessage = document.getElementById('statusMessage');

    // Kiểm tra nếu không có dữ liệu
    if (!text.trim()) {
        statusMessage.textContent = 'Không có dữ liệu để tải xuống!';
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
        return;
    }

    // Nếu có dữ liệu thì tiến hành tải
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email_data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Hiển thị thông báo thành công
    statusMessage.textContent = 'Tải file thành công!';
    statusMessage.className = 'success';
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

function applyAdvancedSettings() {
    const option = document.getElementById('advancedOption').value;
    const newValue = document.getElementById('advancedValue').value.trim();
    const table = document.getElementById('dataTable');
    const textArea = document.getElementById('dataText');
    const statusMessage = document.getElementById('statusMessage');

    if (!newValue) {
        statusMessage.textContent = 'Vui lòng nhập giá trị mới!';
        statusMessage.className = 'error';
        statusMessage.style.display = 'block';
        return;
    }

    const columnIndex = option === 'path' ? 2 : 3;
    let textOutput = '';

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const email = row.cells[1].textContent;

        if (option === 'path') {
            // Highlight cả newValue và email khi cập nhật
            const newPath = `/config/workspace/<span class="highlight-value">${newValue}</span>/oauth2/tokens/oauth2_tokens_<span class="highlight-value">${email}</span>.txt`;
            row.cells[columnIndex].innerHTML = newPath;
        } else {
            row.cells[columnIndex].textContent = newValue;
        }

        // Text output không có HTML
        const path = `/config/workspace/${newValue}/oauth2/tokens/oauth2_tokens_${email}.txt`;
        const password = row.cells[3].textContent;
        textOutput += `${email}|${path}|${email}|${password}\n`;
    }

    textArea.value = textOutput;

    statusMessage.textContent = 'Đã cập nhật thành công!';
    statusMessage.className = 'success';
    statusMessage.style.display = 'block';
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}