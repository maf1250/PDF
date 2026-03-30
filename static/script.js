// ===== JS =====
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

// ===== Render File List =====
function renderList() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
        let li = document.createElement("li");
        li.textContent = file.name;

        let div = document.createElement("div");
        div.style.display = "inline-flex";
        div.style.gap = "5px";

        let upBtn = document.createElement("button");
        upBtn.textContent = "⬆️";
        upBtn.addEventListener("click", () => moveUp(index));

        let downBtn = document.createElement("button");
        downBtn.textContent = "⬇️";
        downBtn.addEventListener("click", () => moveDown(index));

        let removeBtn = document.createElement("button");
        removeBtn.textContent = "❌";
        removeBtn.addEventListener("click", () => removeFile(index));

        div.append(upBtn, downBtn, removeBtn);
        li.appendChild(div);
        fileList.appendChild(li);
    });
}

// ===== Move / Remove Files =====
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
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
        let percent = (e.loaded / e.total) * 100;
        bar.style.width = percent + "%";
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            let blob = xhr.response;
            let url = window.URL.createObjectURL(blob);
            let link = document.createElement("a");
            link.href = url;

            let inputEl = document.getElementById("NewName");
            let userInput = inputEl.value.trim();
            let filename = userInput ? userInput : "merged";

            link.download = filename + ".pdf";
            link.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert("حدث خطأ أثناء الدمج");
        }

        progress.classList.add("hidden");
        bar.style.width = "0%";
    };

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
    if (!response.ok) {
        alert("حدث خطأ أثناء حذف الصفحات");
        return;
    }

    let blob = await response.blob();
    let url = window.URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;

    let nameWithoutExt = file.name.replace(/\.pdf$/i, "");
    link.download = nameWithoutExt + "_edited.pdf";

    link.click();
    window.URL.revokeObjectURL(url);
}
