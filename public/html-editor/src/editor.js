const editor = document.getElementById('editor');
const htmlOutput = document.getElementById('html-output');
const preview = document.getElementById('preview');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const searchReplaceModal = document.getElementById('search-replace-modal');
const searchInput = document.getElementById('search-input');
const replaceInput = document.getElementById('replace-input');
const searchResults = document.getElementById('search-results');
let currentSearchIndex = -1;
let searchMatches = [];

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    updateOutput();
}

function insertLink() {
    const url = prompt('Nhập URL:');
    if (url) {
        document.execCommand('createLink', false, url);
        updateOutput();
    }
}

// function insertImage() {
//     const url = prompt('Nhập URL hình ảnh:');
//     if (url) {
//         document.execCommand('insertImage', false, url);
//         updateOutput();
//     }
// }
function insertImage() {
    document.getElementById('image-modal').style.display = 'block';
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

function insertTable() {
    const rows = prompt('Nhập số hàng:');
    const cols = prompt('Nhập số cột:');
    if (rows && cols) {
        let table = '<table border="1">';
        for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
                table += '<td>Nội dung</td>';
            }
            table += '</tr>';
        }
        table += '</table>';
        document.execCommand('insertHTML', false, table);
        updateOutput();
    }
}
function insertCustomImage() {
    const url = document.getElementById('image-url').value;
    const width = document.getElementById('image-width').value;
    const height = document.getElementById('image-height').value;

    if (url) {
        let imgHtml = `<img src="${url}" alt="Inserted image"`;
        if (width) imgHtml += ` width="${width}"`;
        if (height) imgHtml += ` height="${height}"`;
        imgHtml += '>';

        document.execCommand('insertHTML', false, imgHtml);
        updateOutput();
        closeImageModal();
    } else {
        showNotification('Vui lòng nhập URL hình ảnh', 'error');
    }
}
// Thêm sự kiện để giữ tỷ lệ khung hình
document.getElementById('constrain-proportions').addEventListener('change', function () {
    const widthInput = document.getElementById('image-width');
    const heightInput = document.getElementById('image-height');

    if (this.checked) {
        let aspectRatio;

        widthInput.addEventListener('input', function () {
            if (aspectRatio) {
                heightInput.value = Math.round(widthInput.value / aspectRatio);
            }
        });

        heightInput.addEventListener('input', function () {
            if (aspectRatio) {
                widthInput.value = Math.round(heightInput.value * aspectRatio);
            }
        });

        // Tính tỷ lệ khung hình khi hình ảnh được tải
        const img = new Image();
        img.onload = function () {
            aspectRatio = this.width / this.height;
            widthInput.value = this.width;
            heightInput.value = this.height;
        };
        img.src = document.getElementById('image-url').value;
    } else {
        // Xóa các sự kiện nếu không giữ tỷ lệ
        widthInput.removeEventListener('input');
        heightInput.removeEventListener('input');
    }
});


function undo() {
    document.execCommand('undo', false, null);
    updateOutput();
}

function redo() {
    document.execCommand('redo', false, null);
    updateOutput();
}

function updateOutput() {
    htmlOutput.value = editor.innerHTML;
    preview.innerHTML = editor.innerHTML;
    updateWordAndCharCount();
}

function updateFromHtmlOutput() {
    editor.innerHTML = htmlOutput.value;
    preview.innerHTML = htmlOutput.value;
    updateWordAndCharCount();
}

function saveContent() {
    localStorage.setItem('editorContent', editor.innerHTML);
    showNotification('Nội dung đã được lưu!');
}

function loadContent() {
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
        editor.innerHTML = savedContent;
        updateOutput();
        showNotification('Nội dung đã được tải!');
    } else {
        showNotification('Không tìm thấy nội dung đã lưu!', 'error');
    }
}

function exportHTML() {
    const blob = new Blob([editor.innerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported_html.html';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('HTML đã được xuất!');
}

function updateWordAndCharCount() {
    const text = editor.innerText;
    const words = text.trim().split(/\s+/);
    const characters = text.length;

    wordCount.textContent = words.length;
    charCount.textContent = characters;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.backgroundColor = type === 'success' ? '#2ecc71' : '#e74c3c';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.5s ease-in-out';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    showNotification('Chế độ tối đã được ' + (document.body.classList.contains('dark-mode') ? 'bật' : 'tắt'));
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function openSearchReplaceModal() {
    searchReplaceModal.style.display = 'block';
}

function closeSearchReplaceModal() {
    searchReplaceModal.style.display = 'none';
}

function findNext() {
    const searchTerm = searchInput.value.trim();
    const caseSensitive = document.getElementById('case-sensitive').checked;
    const wholeWord = document.getElementById('whole-word').checked;

    if (searchTerm === '') {
        showNotification('Vui lòng nhập từ khóa tìm kiếm', 'error');
        return;
    }

    let content = editor.innerHTML;
    let regexFlags = 'g';
    if (!caseSensitive) regexFlags += 'i';

    let searchRegex = wholeWord ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, regexFlags) : new RegExp(escapeRegExp(searchTerm), regexFlags);

    searchMatches = [];
    let match;
    while ((match = searchRegex.exec(content)) !== null) {
        searchMatches.push(match.index);
    }

    if (searchMatches.length === 0) {
        searchResults.textContent = 'Không tìm thấy kết quả.';
        return;
    }

    currentSearchIndex = (currentSearchIndex + 1) % searchMatches.length;
    highlightSearchResult(searchMatches[currentSearchIndex], searchTerm.length);
    searchResults.textContent = `Kết quả ${currentSearchIndex + 1} / ${searchMatches.length}`;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchResult(startIndex, length) {
    let range = document.createRange();
    let startNode = findNodeAtIndex(editor, startIndex);
    let endNode = findNodeAtIndex(editor, startIndex + length);

    if (startNode && endNode) {
        range.setStart(startNode.node, startNode.offset);
        range.setEnd(endNode.node, endNode.offset);

        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        editor.focus();

        range.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function findNodeAtIndex(root, targetIndex) {
    let currentIndex = 0;

    function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (currentIndex + node.length > targetIndex) {
                return { node: node, offset: targetIndex - currentIndex };
            }
            currentIndex += node.length;
        } else {
            for (let child of node.childNodes) {
                let result = traverse(child);
                if (result) return result;
            }
        }
        return null;
    }

    return traverse(root);
}

function replaceNext() {
    if (currentSearchIndex === -1 || searchMatches.length === 0) {
        showNotification('Vui lòng tìm kiếm trước khi thay thế', 'error');
        return;
    }

    const replaceTerm = replaceInput.value;
    let content = editor.innerHTML;
    let startIndex = searchMatches[currentSearchIndex];
    let endIndex = startIndex + searchInput.value.length;

    content = content.substring(0, startIndex) + replaceTerm + content.substring(endIndex);
    editor.innerHTML = content;
    updateOutput();

    searchMatches.splice(currentSearchIndex, 1);
    if (searchMatches.length === 0) {
        currentSearchIndex = -1;
        searchResults.textContent = 'Đã thay thế tất cả kết quả.';
    } else {
        currentSearchIndex = currentSearchIndex % searchMatches.length;
        findNext();
    }
}

function switchTab(event, tabName) {
    var tabContents = document.getElementsByClassName("tab-content");
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    var tabButtons = document.getElementsByClassName("tab-button");
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    event.currentTarget.classList.add("active");
}

function replaceAll() {
    const searchTerm = searchInput.value;
    const replaceTerm = replaceInput.value;
    const caseSensitive = document.getElementById('case-sensitive').checked;
    const wholeWord = document.getElementById('whole-word').checked;

    if (searchTerm === '') {
        showNotification('Vui lòng nhập từ khóa tìm kiếm', 'error');
        return;
    }

    let content = editor.innerHTML;
    let regexFlags = 'g';
    if (!caseSensitive) regexFlags += 'i';

    let searchRegex = wholeWord ? new RegExp(`\\b${searchTerm}\\b`, regexFlags) : new RegExp(searchTerm, regexFlags);

    content = content.replace(searchRegex, replaceTerm);
    editor.innerHTML = content;
    updateOutput();

    const count = (editor.innerHTML.match(searchRegex) || []).length;
    searchResults.textContent = `Đã thay thế ${count} kết quả.`;
    currentSearchIndex = -1;
    searchMatches = [];
}

function copyHtmlOutput() {
    htmlOutput.select();
    document.execCommand('copy');
    showNotification('HTML đã được sao chép vào clipboard!');
}

function clearAll() {
    editor.innerHTML = '';
    htmlOutput.value = '';
    preview.innerHTML = '';
    updateWordAndCharCount();
    showNotification('Tất cả nội dung đã được xóa!');

}

editor.addEventListener('input', updateOutput);
updateOutput();

setInterval(saveContent, 30000);

window.onclick = function (event) {
    if (event.target == searchReplaceModal) {
        closeSearchReplaceModal();
    }
}

function openInsertVariableModal() {
    document.getElementById('insert-variable-modal').style.display = 'block';
}

function closeInsertVariableModal() {
    document.getElementById('insert-variable-modal').style.display = 'none';
}

function insertVariable(variable) {
    document.execCommand('insertText', false, variable);
    closeInsertVariableModal();
    updateOutput();
}

Split(['#editor', '#preview'], {
    sizes: [50, 50],
    minSize: 200,
    gutterSize: 10,
    cursor: 'col-resize'
});