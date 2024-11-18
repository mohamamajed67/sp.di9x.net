document.getElementById('bookmarkletForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const bookmarkletName = document.getElementById('bookmarkletName').value;
    const template = document.getElementById('template').value;
    const ticketType = document.getElementById('ticketType').value;
    const noteContent = document.getElementById('noteContent').value;
    const htmlContent = document.getElementById('htmlContent').value;

    let bookmarkletCode = `javascript:(function(){
var step1 = function(){
var date = new Date(),
    options = {hour: '2-digit', minute: '2-digit'},
    timeString = date.toLocaleString('vi-VN', options);
options = {year: 'numeric', month: 'numeric', day: 'numeric'};
var dateString = date.toLocaleString('vi-VN', options),
    emailElement = document.querySelector('#fs_ticket_customer > div:nth-child(3) > div:nth-child(3)'),
    email = '';
if(emailElement){
    var emailPattern = /[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}/,
        emailMatch = emailElement.innerText.match(emailPattern);
    email = emailMatch ? emailMatch[0] : '';
}
var domainElement = document.querySelector('fieldset#fs_ticket_service b');
if (!domainElement) {
    console.log('Không thể trích xuất tên miền.');
    return;
}
var domainText = domainElement.textContent,
    domainPattern = /- (.+)$/,
    domainMatch = domainText.match(domainPattern),
    domain = domainMatch ? domainMatch[1] : null;
if(!domain) {
    console.log('Không thể trích xuất tên miền.');
    return;
}
var maKhachHang = document.querySelector('#fs_ticket_customer > div:nth-child(3) > div:nth-child(1) > b').textContent;    
var serviceEmail = document.querySelector('#fs_ticket_service > div:nth-child(2) > div > span').textContent;
`;

    if (template === 'api') {
        bookmarkletCode += `
var apiUrl = 'https://checkip.matbao.support/mx.php?domain=' + domain;
fetch(apiUrl).then(response => response.text()).then(apiResult => {`;
    }

    bookmarkletCode += `
var contactElement = document.getElementById('div_customer_contact_list');
if(contactElement){
    var contactText = contactElement.innerText,
        phoneMatches = contactText.match(/\\+\\d{2}-\\d+/g);
    if(phoneMatches && phoneMatches.length > 0){
        var lastPhone = phoneMatches[phoneMatches.length - 1],
            phoneNumber = lastPhone.replace(/\\+84-/, '0'),
            iframe = document.querySelector('#txt_answers_ifr');
        if(iframe){
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.body.innerHTML = \`${htmlContent}\`;
        } else {
            console.error('Không tìm thấy chỗ điền HTML.');
        }
    }
}`;

    if (template === 'api') {
        bookmarkletCode += `
}).catch(error => {
    console.error('Lỗi khi gọi API:', error);
});`;
    }

    bookmarkletCode += `
setTimeout(step2, 500);
};

var step2 = function(){
var dropdownItems = document.querySelectorAll('.dropdown-menu.open li'),
    targetItem = null;
dropdownItems.forEach(function(item){
    var text = item.querySelector('.text').textContent.trim();
    if(text === '${ticketType}'){
        targetItem = item;
    }
});
if(targetItem){
    document.querySelector('button[data-id="cbo_report_issue_type"]').click();
    setTimeout(function(){
        targetItem.querySelector('a').click();
    }, 100);
}
setTimeout(step3, 100);
};

var step3 = function(){
var noteElement = document.getElementById('txt_report_issue_note');
if(noteElement){
    noteElement.value = '${noteContent}';
}
document.querySelector('#fmLTicketAnswer > div > div > div > div > div.row.clearfix > div.col-sm-5.panel-right > ul > li:nth-child(9) > a').click();
setTimeout(step4, 100);
};

var step4 = function(){
var linkElement = document.querySelector('#fmLTicketAnswer > div > div > div > div > div.row.clearfix > div.col-sm-5.panel-right > ul > li:nth-child(9) > a'),
    labelElement = document.querySelector('#job-check-list-3 > label');
if(linkElement) linkElement.click();
if(labelElement) labelElement.click();
var inputElement = document.querySelector('.input-job-check-list.form-control.job-id-check-list-3');
if(inputElement) inputElement.value = 'Đã liên hệ';
};

step1();
})();`;

    const encodedBookmarklet = encodeURIComponent(bookmarkletCode);

    document.getElementById('bookmarklet').style.display = 'block';
    document.getElementById('bookmarkletLink').textContent = bookmarkletName;
    document.getElementById('bookmarkletLink').href = `javascript:${encodedBookmarklet}`;
    document.getElementById('encodedBookmarklet').textContent = `javascript:${encodedBookmarklet}`;
    document.getElementById('originalCode').textContent = bookmarkletCode;
});