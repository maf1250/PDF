let files = [];
const dropArea = document.getElementById("drop-area");
const fileElem = document.getElementById("fileElem");
const fileList = document.getElementById("file-list");
const mergeBtn = document.getElementById("mergeBtn");
const progress = document.getElementById("progress");
const bar = document.querySelector(".bar");

// ===== Drag & Drop Upload =====
dropArea.addEventListener("click", () => fileElem.click());
fileElem.addEventListener("change", (e) => handleFiles(e.target.files));

dropArea.addEventListener("dragover", (e) => e.preventDefault());
dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

// ===== Handle Files =====
function handleFiles(selectedFiles) {
    for (let file of selectedFiles) files.push(file);
    renderList();
}

// ===== Render File List with Drag & Drop =====
function renderList() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
        let li = document.createElement("li");
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `${file.name} <button onclick="removeFile(${index})">❌</button>`;

        // Drag events
        li.addEventListener("dragstart", () => li.classList.add("dragging"));
        li.addEventListener("dragend", () => li.classList.remove("dragging"));
        li.addEventListener("dragover", (e) => {
            e.preventDefault();
            const dragging = document.querySelector(".dragging");
            const allItems = [...fileList.querySelectorAll("li:not(.dragging)")];
            const afterElement = getDragAfterElement(allItems, e.clientY);
            if (!afterElement) {
                fileList.appendChild(dragging);
            } else {
                fileList.insertBefore(dragging, afterElement);
            }
        });

        fileList.appendChild(li);
    });
}

// Helper: find element after dragging position
function getDragAfterElement(elements, y) {
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    elements.forEach(el => {
        const box = el.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            closest = { offset: offset, element: el };
        }
    });
    return closest.element;
}

// ===== Remove File =====
function removeFile(index) {
    files.splice(index, 1);
    renderList();
}

// ===== Merge PDFs =====
mergeBtn.addEventListener("click", () => {
    const lis = [...fileList.querySelectorAll("li")];
    if (lis.length === 0) return;

    let formData = new FormData();
    lis.forEach(li => {
        const index = li.dataset.index;
        formData.append("pdfs", files[index]);
    });

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
