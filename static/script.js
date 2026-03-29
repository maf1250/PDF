let files = [];
const dropArea = document.getElementById("drop-area");
const fileElem = document.getElementById("fileElem");
const fileList = document.getElementById("file-list");
const mergeBtn = document.getElementById("mergeBtn");
const progress = document.getElementById("progress");
const bar = document.querySelector(".bar");

// ===== Drag & Drop / File Upload =====
dropArea.addEventListener("click", () => fileElem.click());
fileElem.addEventListener("change", (e) => handleFiles(e.target.files));

dropArea.addEventListener("dragover", (e) => e.preventDefault());
dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

function handleFiles(selectedFiles) {
    for (let file of selectedFiles) files.push(file);
    renderList();
}

// ===== Render File List with Move Up / Move Down =====
function renderList() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
        let li = document.createElement("li");
        li.innerHTML = `
            ${file.name} 
            <div style="display:inline-flex; gap:5px">
                <button onclick="moveUp(${index})">⬆️</button>
                <button onclick="moveDown(${index})">⬇️</button>
                <button onclick="removeFile(${index})">❌</button>
            </div>
        `;
        fileList.appendChild(li);
    });
}

// ===== Move File Up / Down =====
function moveUp(index) {
    if (index === 0) return;
    [files[index - 1], files[index]] = [files[index], files[index - 1]];
    renderList();
}

function moveDown(index) {
    if (index === files.length - 1) return;
    [files[index + 1], files[index]] = [files[index], files[index + 1]];
    renderList();
}

// ===== Remove File =====
function removeFile(index) {
    files.splice(index, 1);
    renderList();
}

// ===== Merge PDFs =====
mergeBtn.addEventListener("click", () => {
    if (files.length === 0) return;

    let formData = new FormData();
    files.forEach(file => formData.append("pdfs", file));

    progress.classList.remove("hidden");

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/merge");
    xhr.upload.onprogress = (e) => {
        let percent = (e.loaded / e.total) * 100;
        bar.style.width = percent + "%";
    };
    xhr.onload = () => {
        let blob = new Blob([xhr.response], { type: "application/pdf" });
        let link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "merged.pdf";
        link.click();

        progress.classList.add("hidden");
        bar.style.width = "0%";
    };
    xhr.responseType = "blob";
    xhr.send(formData);
});

// ===== Delete Pages from PDF =====
async function deletePages() {
    const file = document.getElementById("deleteFile").files[0];
    const pages = document.getElementById("pagesInput").value;
    if (!file || !pages) { 
        alert("يرجى اختيار ملف وإدخال الصفحات"); 
        return; 
    }

    let formData = new FormData();
    formData.append("pdf", file);
    formData.append("pages", pages);

    let response = await fetch("/delete-pages", { method: "POST", body: formData });
    let blob = await response.blob();

    let link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "edited.pdf";
    link.click();
}
